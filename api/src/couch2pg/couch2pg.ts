import axios from "axios";
import PQueue from "p-queue";
import { In, Repository, DataSource } from "typeorm";
import {
    getCouchDBRepository,
    getCouchDBLastSeqRepository,
    getCouchDbLogRepository,
    getCouchDBLogsRepository,
    getCouchDBMetasRepository,
    getCouchDBSentinelRepository,
    getCouchDBUsersRepository
} from "../entities/Couchdb";
import { ENV } from "../providers/constantes";
import { RefreshMaterializedView } from "./refresh-view";
import { CouchdbFetchCible } from "../models/Interfaces";

const { CHT_USER, CHT_PASS, CHT_HOST, CHT_PROTOCOL, CHT_PORT } = ENV;

const COUCHDB_BASE_URI = `${CHT_PROTOCOL}://${CHT_USER}:${CHT_PASS}@${CHT_HOST}:${CHT_PORT}`;

/* -------------------- CONSTANTES -------------------- */
const DEFAULT_LIMIT = 1000;
const IDLE_DELAY = 5000;
const LONGPOLL_TIMEOUT = 60000;
const ONE_MINUTE = 60_000;
const MAX_RETRY_DELAY = 12 * 60 * 60 * 1000;

/* -------------------- EXCLUSIONS -------------------- */
const EXCLUDED_PATTERNS: RegExp[] = [
    /^target~.*~org\.couchdb\.user/,
    /^settings/,
    /^service-worker-meta/,
    /^resources/,
    /^privacy-policies/,
    /^partners/,
    /^migration-log/,
    /^form:/,
    /^_design/,
    /^extension-libs/,
    /^messages-/
];

/* -------------------- TYPES -------------------- */
type CouchDBChange = { id: string; doc?: any; deleted?: boolean; };

type CouchDBResponse = { last_seq: string; results: CouchDBChange[]; };

/* -------------------- CIBLES -------------------- */
const cibleArray: CouchdbFetchCible[] = [
    "medic",
    "users",
    "logs",
    "sentinel",
    "users_meta"
];

const cibleMap: Record<CouchdbFetchCible, { index: number; name: string }> = {
    medic: { index: 1, name: "medic" },
    users: { index: 2, name: "_users" },
    logs: { index: 3, name: "medic-logs" },
    sentinel: { index: 4, name: "medic-sentinel" },
    users_meta: { index: 5, name: "medic-users-meta" }
};

/* -------------------- QUEUES PAR CIBLE -------------------- */
const queues: Record<CouchdbFetchCible, PQueue> = {} as any;
for (const cible of cibleArray) {
    queues[cible] = new PQueue({
        concurrency: 1,
        interval: 1000,
        intervalCap: 1
    });
}

/* -------------------- LOGGING -------------------- */
async function logMessage(message: string): Promise<void> {
    const repo = await getCouchDbLogRepository();
    await repo.save({
        log: `[${new Date().toISOString()}] ${message}`
    }).catch(console.error);
}

/* -------------------- REPOSITORIES -------------------- */
async function getRepository(cible: CouchdbFetchCible): Promise<Repository<any>> {
    switch (cible) {
        case "users":
            return getCouchDBUsersRepository();
        case "logs":
            return getCouchDBLogsRepository();
        case "sentinel":
            return getCouchDBSentinelRepository();
        case "users_meta":
            return getCouchDBMetasRepository();
        default:
            return getCouchDBRepository();
    }
}

/* -------------------- SEQUENCE -------------------- */
async function getLastSequence(cible: CouchdbFetchCible): Promise<string> {
    const repo = await getCouchDBLastSeqRepository();
    const id = cibleMap[cible].index;
    const found = await repo.findOneBy({ id });
    return found?.seq || "0";
}

async function updateLastSequence(cible: CouchdbFetchCible, seq: string, manager: any): Promise<void> {
    const repo = manager.getRepository((await getCouchDBLastSeqRepository()).target);
    await repo.save({ id: cibleMap[cible].index, seq });
}

/* -------------------- FETCH COUCHDB -------------------- */
async function fetchCouchDBChanges(cible: CouchdbFetchCible, since: string): Promise<CouchDBResponse | 'error_found'> {
    try {
        const dbName = cibleMap[cible].name;

        const res = await axios.get<CouchDBResponse>(
            `${COUCHDB_BASE_URI}/${dbName}/_changes`,
            {
                params: {
                    since,
                    include_docs: true,
                    limit: DEFAULT_LIMIT,
                    style: "all_docs",
                    feed: "longpoll",
                    timeout: LONGPOLL_TIMEOUT
                }
            }
        );

        return res.data;
    } catch (err: any) {
        await logMessage(`${cible}: ⚠️ Failed to fetch CouchDB changes: ${err.message}`);
        return 'error_found';
    }
}

/* -------------------- PROCESS BATCH -------------------- */
async function processBatch(cible: CouchdbFetchCible, data: CouchDBResponse, dataSource: DataSource): Promise<string> {
    if (!data.results.length) return data.last_seq;

    const toSave: any[] = [];
    const toDelete: string[] = [];

    for (const { id, doc, deleted } of data.results) {
        const isExcluded = EXCLUDED_PATTERNS.some(p => p.test(id));
        const isTombstone = doc?.type === "tombstone" || !!doc?.tombstone;
        if (deleted || doc?._deleted || isExcluded || isTombstone) {
            toDelete.push(id);
        } else {
            toSave.push({ id, doc, rev: doc?._rev });
        }
    }

    await dataSource.transaction(async manager => {
        const repo = await getRepository(cible);

        if (toSave.length) {
            await manager.getRepository(repo.target).save(toSave);
        }

        if (toDelete.length) {
            await manager.getRepository(repo.target).delete({
                id: In(toDelete)
            });
        }

        await updateLastSequence(cible, data.last_seq, manager);
    });

    await logMessage(
        `${cible}: ✅ batch ok (save=${toSave.length}, delete=${toDelete.length})`
    );

    await RefreshMaterializedView(cible);

    return data.last_seq;
}

/* -------------------- MAIN LOOP -------------------- */
async function runCible(cible: CouchdbFetchCible, dataSource: DataSource) {
    let lastSeq = await getLastSequence(cible);
    let retryDelay = ONE_MINUTE;

    while (true) {
        try {
            const data = await fetchCouchDBChanges(cible, lastSeq);

            if (data === 'error_found' || !data) {
                await new Promise(r => setTimeout(r, IDLE_DELAY));
                continue;
            }

            if (data.last_seq === lastSeq) {
                await new Promise(r => setTimeout(r, IDLE_DELAY));
                continue;
            }

            lastSeq = await queues[cible].add(() =>
                processBatch(cible, data, dataSource)
            );

            retryDelay = ONE_MINUTE;
        } catch (err: any) {
            await logMessage(
                `${cible}: ❌ error ${err.message} – retry in ${retryDelay / 1000}s`
            );
            await new Promise(r => setTimeout(r, retryDelay));
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
        }
    }
}

/* -------------------- ENTRY POINT -------------------- */
export async function syncCouchDBToPostgres(dataSource: DataSource): Promise<void> {
    await logMessage("🚀 Starting CouchDB → Postgres sync");

    for (const cible of cibleArray) {
        setImmediate(() => runCible(cible, dataSource));
    }
}
