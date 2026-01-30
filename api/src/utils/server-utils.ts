
import express, { Request, Response, NextFunction } from 'express';
import { Readable } from "stream";
import { VACCINATION_NOT_DONE_DATA, VACCINATION_ALL_DONE_DATA, VACCINATION_PARTIAL_DONE_DATA } from "../controllers/DASHBOARDS/dashboars-realtime";
import { RECOS_CUSTOM_QUERY } from "../controllers/ORGUNITS/org-units-custom";
import { TransformInput, TransformOutput, RecoVaccinationDashboardDbOutput } from "../models/dashboards";
import { notEmpty } from "./functions";
import { v4 as uuidv4 } from 'uuid';
// import { createObjectCsvWriter } from 'csv-writer';


const MAX_UIDS = 10_000;

type ApiResult<T = any> = {
    status: number;
    data: T | string;
};

type AnyObject = Record<string, any>;
type VaccineKey =
    | 'BCG'
    | 'VPO_0' | 'VPO_1' | 'VPO_2' | 'VPO_3'
    | 'PENTA_1' | 'PENTA_2' | 'PENTA_3'
    | 'VPI_1' | 'VPI_2'
    | 'VAR_1' | 'VAR_2'
    | 'VAA'
    | 'MEN_A';

const parseInQuery = (input?: string): string[] => {
    if (!input || !notEmpty(input)) return [];
    return input.replace(/['\[\]\s"]/g, '').replace(/%27/g, '').split(',').filter(Boolean);
};

const escapeCsv = (value: any): string => {
    if (value === null || value === undefined) return '';

    let str = String(value);

    // Protection CSV Injection (Excel)
    if (/^[=+\-@]/.test(str)) {
        str = `'${str}`;
    }

    // Escape quotes
    str = str.replace(/"/g, '""');

    // Wrap if needed
    if (/[",\n]/.test(str)) {
        str = `"${str}"`;
    }

    return str;
};

const transformVaccineData = (param: TransformInput): TransformOutput => {
    // Valeur par défaut sécurisée
    const result: TransformOutput = {
        status: param.status,
        data: {
            count: 0,
            vaccins: [],
        },
    };

    // Vérification stricte
    if (!Array.isArray(param.data)) {
        return param as any;
    }

    result.data.vaccins = param.data;
    result.data.count = param.data.length;
    return result;
};

const flattenVaccines = (source: AnyObject, data: AnyObject, vaccines: VaccineKey[]) => {
    for (const key of vaccines) {
        const v = data?.[key] ?? {};
        source[`${key}_done`] = v.done ?? false;
        source[`${key}_date`] = v.date ?? null;
        source[`${key}_reason`] = v.reason ?? null;
    }
}


export const streamCsv = (res: Response, rows: any[], filename: string = `output_${Date.now()}.csv`, successMessage?: string) => {

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);


    // ✅ Message lisible côté frontend
    if (successMessage) {
        const safeMessage = Buffer.from(successMessage).toString('base64');
        res.setHeader('X-Success-Message', safeMessage);
    }

    // UTF-8 BOM (Excel friendly)
    res.write('\uFEFF');
    const headers = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

    const stream = new Readable({
        read() {
            if (headers.length) {
                // Header
                this.push(headers.join(',') + '\n');
                // Rows
                for (const row of rows) {
                    const line = headers.map(h => escapeCsv(row[h])).join(',');
                    this.push(line + '\n');
                }
            }
            this.push(null);
        }
    });

    stream.pipe(res);
};

export const vaccineRouter = async (req: Request) => {
    // res.set('json spaces', '2');

    const { state, recos, months, year, api_access_key } = req.query;

    /* ----- Validation année ----- */
    const apiYear = Number(year);
    if (!year || isNaN(apiYear) || String(apiYear).length !== 4) {
        return { status: 400, data: 'Année invalide (ex: year=2025)' };
    }

    /* ----- RECOs ----- */
    let apiRecos: string[] = [];
    if (!recos) {
        return { status: 400, data: 'Au moins un RECO requis' };
    }

    if (['*', 'all'].includes(String(recos).trim())) {
        const all = await RECOS_CUSTOM_QUERY();
        apiRecos = all.map(r => r.id);
    } else {
        apiRecos = parseInQuery(String(recos));
    }

    if (!apiRecos.length) {
        return { status: 400, data: 'Aucun RECO valide' };
    }

    /* ----- Mois ----- */
    let apiMonths: string[] = [];
    if (!months) {
        return { status: 400, data: 'Au moins un mois requis' };
    }

    if (['*', 'all'].includes(String(months).trim())) {
        apiMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    } else {
        apiMonths = parseInQuery(String(months)).map(m => m.padStart(2, '0'));
    }

    const params = { userId: String(api_access_key), recos: apiRecos, months: apiMonths, year: apiYear, fullData: true, sync: true };

    const defaultOutput = { status: 400, data: 'state invalide (not_done | all_done | partial_done)' };

    const allowedStates = ['not_done', 'all_done', 'partial_done'] as const;

    if (!allowedStates.includes(state as any)) {
        return defaultOutput;
    }

    try {
        let rawData;

        switch (state) {
            case 'not_done':
                rawData = (await VACCINATION_NOT_DONE_DATA(params));
                break;
            case 'all_done':
                rawData = (await VACCINATION_ALL_DONE_DATA(params));
                break;
            case 'partial_done':
                rawData = (await VACCINATION_PARTIAL_DONE_DATA(params));
                break;
            default:
                return defaultOutput;
        }

        return transformVaccineData(rawData);
    } catch (err) {
        console.error('Erreur /api/vaccine', err);
        return { status: 400, data: 'Erreur serveur' };
    }
};

export const generateUids = async (req: Request): Promise<ApiResult<{ id: string }[]>> => {
    try {
        const raw = req.body?.number ?? req.query?.number ?? req.params?.number;

        if (!raw) {
            return { status: 400, data: "Parameter 'number' is required" };
        }

        const number = Number(raw);

        if (!Number.isInteger(number) || number <= 0) {
            return { status: 400, data: "Provide a valid positive integer" };
        }

        if (number > MAX_UIDS) {
            return { status: 413, data: `Maximum allowed is ${MAX_UIDS}` };
        }

        return { status: 200, data: Array.from({ length: number }, () => ({ id: uuidv4() })) };

    } catch (err) {
        console.error('generateUids:', err);
        return { status: 500, data: 'Internal server error' };
    }
};


export function exploseVaccineObject(vaccins: RecoVaccinationDashboardDbOutput[]): AnyObject[] {

    const output: AnyObject[] = [];

    if (!Array.isArray(vaccins) || vaccins.length === 0) {
        return output;
    }

    const VACCINE_KEYS: VaccineKey[] = [
        'BCG',
        'VPO_0', 'VPO_1', 'VPO_2', 'VPO_3',
        'PENTA_1', 'PENTA_2', 'PENTA_3',
        'VPI_1', 'VPI_2',
        'VAR_1', 'VAR_2',
        'VAA',
        'MEN_A'
    ];

    for (const vaccin of vaccins) {
        const { children_vaccines = [] } = vaccin;
        if (!Array.isArray(children_vaccines)) continue;

        for (const cv of children_vaccines) {
            const family = cv?.family ?? {};

            for (const dt of cv?.data ?? []) {
                const row: AnyObject = {

                    id: vaccin.id,
                    year: vaccin.year,
                    month: vaccin.month,

                    country_id: vaccin.country.id,
                    country_name: vaccin.country.name,

                    region_id: vaccin.region.id,
                    region_name: vaccin.region.name,

                    prefecture_id: vaccin.prefecture.id,
                    prefecture_name: vaccin.prefecture.name,

                    commune_id: vaccin.commune.id,
                    commune_name: vaccin.commune.name,

                    hospital_id: vaccin.hospital.id,
                    hospital_name: vaccin.hospital.name,

                    district_quartier_id: vaccin.district_quartier.id,
                    district_quartier_name: vaccin.district_quartier.name,

                    village_secteur_id: vaccin.village_secteur.id,
                    village_secteur_name: vaccin.village_secteur.name,

                    reco_id: vaccin.reco.id,
                    reco_name: vaccin.reco.name,
                    reco_phone: vaccin.reco.phone,


                    /* FAMILY */
                    family_id: family.id ?? null,
                    family_name: family.name ?? null,
                    family_fullname: family.fullname ?? null,
                    family_code: family.code ?? null,

                    /* CHILD */
                    child_id: dt?.child?.id ?? null,
                    child_name: dt?.child?.name ?? null,
                    child_code: dt?.child?.code ?? null,
                    child_sex: dt?.child?.sex ?? null,
                    child_age_in_days: dt?.child?.age_in_days ?? null,
                    child_age_in_months: dt?.child?.age_in_months ?? null,
                    child_age_in_years: dt?.child?.age_in_years ?? null,
                    child_age_str: dt?.child?.age_str ?? null,
                    child_parent_phone: dt?.phone?.parent ?? null,
                    child_neighbor_phone: dt?.phone?.neighbor ?? null,
                };

                /* VACCINES */
                flattenVaccines(row, dt, VACCINE_KEYS);

                output.push(row);
            }
        }
    }

    return output;
}


