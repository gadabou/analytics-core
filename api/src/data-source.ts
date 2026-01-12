import { DataSource } from "typeorm"
import { ENV } from "./providers/constantes";

const { PG_HOST, PG_PORT, PG_DB_NAME, PG_DB_USER, PG_DB_PASS } = ENV;


export const AppDataSource = new DataSource({
    type: 'postgres',
    host: PG_HOST,
    port: parseInt(`${PG_PORT}`),
    username: PG_DB_USER,
    password: PG_DB_PASS,
    database: PG_DB_NAME,
    entities: [
        __dirname + '/entities/*{.ts,.js}',
        __dirname + '/entities/**/*{.ts,.js}'
    ],
    synchronize: true,
    logging: [
        "query",
        "error"
    ],
    migrations: [
        __dirname + '/migrations/*.{ts,js}'
        // __dirname + '/migrations/mat/*.{ts,js}',
        // __dirname + '/migrations/functions/*.{ts,js}',
    ],
    migrationsTableName: "typeorm_migrations",
    subscribers: [
        __dirname + "/subscriber/*{.ts,.js}"
    ],
});