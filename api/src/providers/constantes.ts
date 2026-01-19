import { config } from 'dotenv';
import { resolve } from 'path';

/* --------------------------------- PATHS ----------------------------------- */
export const SRC_FOLDER = resolve(__dirname, '..');
export const API_FOLDER = resolve(SRC_FOLDER, '..');
export const PROJECT_FOLDER = resolve(API_FOLDER, '..');
export const PROJECT_PARENT_FOLDER = resolve(PROJECT_FOLDER, '..');
export const ENV_FOLDER = resolve(PROJECT_PARENT_FOLDER, 'ssl', 'analytics');
export const JSON_DB_FOLDER = resolve(PROJECT_FOLDER, 'json-db-folder');
export const MIGRATIONS_FOLDER = resolve(SRC_FOLDER, 'migrations');

/* ------------------------ ENVIRONMENT LOADING ------------------------------ */
const ENV_PATHS = [
  resolve(SRC_FOLDER, '.env'),
  resolve(API_FOLDER, '.env'),
  resolve(PROJECT_FOLDER, '.env'),
  resolve(PROJECT_PARENT_FOLDER, '.env'),
  resolve(ENV_FOLDER, '.env'),
  resolve(JSON_DB_FOLDER, '.env'),
];

ENV_PATHS.forEach(path => {
  config({ path, override: false });
});

/* ------------------------------ ENV TYPING ---------------------------------- */
const APP_ENV = process.env;

/* ------------------------- REQUIRED ENV VALIDATION -------------------------- */
const requiredEnvVars = [
  'APP_SECRET_PRIVATE_KEY',
  'APP_AUTH_TOKEN'
];

requiredEnvVars.forEach((key) => {
  if (!APP_ENV[key]) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
});

/* ------------------------------ ENV TYPING ---------------llogNginxogNginx------------------- */
export const ENV = {
  // NODE_ENV, 
  JSON_DB_FOLDER_NAME: APP_ENV.JSON_DB_FOLDER_NAME || 'prod',
  APP_PORT:APP_ENV.APP_PORT,
  APP_SECRET_PRIVATE_KEY:APP_ENV.APP_SECRET_PRIVATE_KEY as string,
  APP_AUTH_TOKEN:APP_ENV.APP_AUTH_TOKEN as string,
  APP_ADMIN_PRIVILEGE:APP_ENV.APP_ADMIN_PRIVILEGE ?? `${APP_ENV.APP_AUTH_TOKEN}::ADMIN_PRIVILEGES`,
  API_PORT:APP_ENV.API_PORT, 
  
  ACCESS_ALL_AVAILABE_PORT: APP_ENV.ACCESS_ALL_AVAILABE_PORT === 'true', 
  USE_LOCALHOST: APP_ENV.USE_LOCALHOST === 'true', 
  IS_SECURE_MODE:APP_ENV.ACTIVE_SECURE_MODE === 'true',

  PG_HOST: APP_ENV.PG_HOST, 
  PG_PORT: APP_ENV.PG_PORT, 
  PG_DB_NAME: APP_ENV.PG_DB_NAME, 
  PG_DB_USER: APP_ENV.PG_DB_USER, 
  PG_DB_PASS: APP_ENV.PG_DB_PASS,

  TWILIO_SID: APP_ENV.TWILIO_SID, 
  TWILIO_AUTH_TOKEN: APP_ENV.TWILIO_AUTH_TOKEN, 
  TWILIO_PHONE_NUMBER: APP_ENV.TWILIO_PHONE_NUMBER,

  DHIS2_USER: APP_ENV.DHIS2_USER, 
  DHIS2_PASS: APP_ENV.DHIS2_PASS, 
  DHIS2_HOST: APP_ENV.DHIS2_HOST, 
  DHIS2_PROTOCOL: APP_ENV.DHIS2_PROTOCOL,

  CHT_USER: APP_ENV.CHT_USER, 
  CHT_PASS: APP_ENV.CHT_PASS, 
  CHT_HOST: APP_ENV.CHT_HOST, 
  CHT_PROTOCOL: APP_ENV.CHT_PROTOCOL, 
  CHT_PORT: APP_ENV.CHT_PORT,

  SERVER_HOST: APP_ENV.SERVER_HOST,

  SESSION_SECRET: APP_ENV.SESSION_SECRET ?? APP_ENV.APP_AUTH_TOKEN ?? 'SESSION_SECRET_KOSSI_TSOLEGNAGBO',
  ENABLE_SYNC: APP_ENV.ENABLE_SYNC ?  APP_ENV.ENABLE_SYNC === 'true' : true
};
