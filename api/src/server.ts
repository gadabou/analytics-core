import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bearerToken from 'express-bearer-token';
import compression from 'compression';
import responseTime from 'response-time';
import fs from 'fs';
import session from 'express-session';
import { join } from 'path';
import { ServerStart, appVersion, getIPAddress, logNginx, normalizePort } from './utils/functions';
import { ENV, ENV_FOLDER, PROJECT_FOLDER, SRC_FOLDER } from './providers/constantes';
import { AuthUserController } from './controllers/auth-user';
import { AppDataSource } from './data-source';
import authRouter from './routes/auth-user';
import configsRouter from './routes/config';
import orgUnitsRouter from './routes/org-units';
import reportsRouter from './routes/reports';
import dashboardsRouter from './routes/dashboards';
import mapsRouter from './routes/maps';
import apisRouter from './routes/api-token';
import sqlManageRouter from './routes/sql-management';
import databaseRouter from './routes/database';
import dhis2Router from './routes/dhis2';
import smsRouter from './routes/sms';
import { Errors } from './routes/error';
import { syncCouchDBToPostgres } from './couch2pg/couch2pg';
import { Middelware } from './middleware/middleware';
import { vaccineRouter, exploseVaccineObject, streamCsv, generateUids } from './utils/server-utils';

const { APP_PORT, ACCESS_ALL_AVAILABE_PORT, USE_LOCALHOST, IS_SECURE_MODE, SESSION_SECRET, ENABLE_SYNC } = ENV;


function createApp() {
  const app = express();

  const ANGULAR_PATH = join(PROJECT_FOLDER, 'views');
  const EJS_PATH = join(SRC_FOLDER, 'ejs_views');
  const PUBLIC_PATH = join(SRC_FOLDER, 'public');

  /* TRUST PROXY */
  app.set('trust proxy', 1);

  /* VIEW ENGINE (EJS ONLY) */
  app.set('views', EJS_PATH);
  app.set('view engine', 'ejs');

  /* SECURITY */
  app.use(
    helmet({
      contentSecurityPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'deny' },
      // xssFilter: true,
      // noSniff: true
    })
  );

  app.use(cors({ origin: true, credentials: true }));
  app.use(responseTime());
  app.use(compression());

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(bearerToken());

  // app.set('json spaces', 0);

  /* SESSION */
  app.use(
    session({
      name: 'kendeya.sid',
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: IS_SECURE_MODE,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
      }
    })
  );

  /* LOGGER */
  app.use(Middelware.userLoggerMiddleware);

  /* STATIC FILES */
  app.use('/publics', express.static(PUBLIC_PATH));
  app.use('/assets', express.static(join(__dirname, 'assets')));

  /* API ROUTES (JSON) */
  app.use('/api/auth-user', authRouter);
  app.use('/api/configs', configsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/dashboards', dashboardsRouter);
  app.use('/api/maps', mapsRouter);
  app.use('/api/org-units', orgUnitsRouter);
  app.use('/api/api-token', apisRouter);
  app.use('/api/sql', sqlManageRouter);
  app.use('/api/database', databaseRouter);
  app.use('/api/dhis2', dhis2Router);
  app.use('/api/sms', smsRouter);

  /* EJS DOCUMENTATION */
  app.get('/api/documentations', Middelware.apiSecurity, (req: Request, res: Response) => {
    return res.render('documentations', {
      host: 'https://tonoudayoapi.portal-integratehealth.org/api/vaccine',
      example: '?api_access_key=XXXX&year=2025&monthA=12&districts=XXX&sites=[UUID]&chws=[UUID]'
    });
  });

  app.get('/api/vaccine', Middelware.apiSecurity, async (req: Request, res: Response, next: NextFunction) => {
    const { status, data } = await vaccineRouter(req);
    return res.status(status).json(data);
  });
  app.get('/api/vaccine.csv', Middelware.apiSecurity, async (req: Request, res: Response) => {
    const { status, data } = await vaccineRouter(req);

    // ❌ Erreur métier
    if (status !== 200) {
      return res.status(status).json({ error: data });
    }

    // ❌ Structure inattendue
    if (!data || typeof data !== 'object' || !Array.isArray(data?.vaccins)) {
      return res.status(500).json({ error: 'Invalid vaccine data format' });
    }

    const vaccins = exploseVaccineObject(data.vaccins);

    if (!vaccins.length) {
      return res.status(204).end();
    }

    const filename = `vaccine_${req.query.state}_${req.query.year}.csv`;

    const successMessage = `✅ Exporté avec succès dans ${filename}`

    // ✅ CSV streaming
    return streamCsv(res, vaccins, filename, successMessage);
  });


  app.get('/api/uids', async (req, res) => {
    const { status, data } = await generateUids(req);

    if (status !== 200 || !Array.isArray(data)) {
      return res.status(status).json({ error: data });
    }

    return res.status(200).json({
      count: data.length,
      ids: data.map(d => d.id)
    });
  });
  app.get('/api/uids.csv', async (req: Request, res: Response, next: NextFunction) => {
    const { status, data } = await generateUids(req);

    if (status !== 200 || !Array.isArray(data)) {
      return res.status(status).json({ error: data });
    }
    // ✅ CSV streaming
    return streamCsv(res, data, `uids_${Date.now()}.csv`);

  });

  /* DOWNLOADS */
  app.get('/publics/download/:apk', (req, res, next) => {
    const file = join(PUBLIC_PATH, 'apk', req.params.apk);
    if (!fs.existsSync(file)) {
      const err: any = new Error('File not found');
      err.statusCode = 404;
      return res.status(404).json(err);
    }
    res.download(file);
  });

  app.get('/favicon.ico', (_, res) => res.status(204).end());

  /* ANGULAR SPA */
  app.use(express.static(ANGULAR_PATH));

  /* ⚠️ SPA FALLBACK (CRUCIAL) */
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(join(ANGULAR_PATH, 'index.html'));
  });

  /* ERRORS */
  app.use(Errors.getErrors);
  app.use(Errors.get404);

  return app;
}



AppDataSource
  .initialize()
  .then(async () => {
    logNginx(`📦 Database connected successfully!\nApp Version: ${appVersion().app_version}`);

    // npx typeorm migration:create src/migrations/materialised-views/reports/RecoMegSituationReportsView
    // npx typeorm migration:create src/migrations/materialised-views/dashboards/RecoVaccinationDashboardView
    // npx typeorm migration:create src/migrations/materialised-views/views/UsersView

    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/RecosMapFamilyUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/RecosMapPatientsUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/RecosMapDataUidView

    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapDatasUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapFamiliesUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapFamiliesDatasUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapPatientsUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView

    // await DropOrTruncateDataFromDatabase({ procide:true, entities:[{name:'', table:'typeorm_migrations'}], action:'TRUNCATE' })

    await AppDataSource.runMigrations();

    await AuthUserController.DefaultAdminCreation();

    const app = createApp();
    const port = normalizePort(APP_PORT || 3000);
    const hostnames = getIPAddress(ACCESS_ALL_AVAILABE_PORT);

    // cron.schedule('00 59 23 * * *', () => {
    //   logNginx('Running this task every day at 23:59:00.');
    // });

    const credential: Record<string, any> | any = {};

    if (IS_SECURE_MODE) {
      credential.key = fs.readFileSync(`${ENV_FOLDER}/server.key`, 'utf8');
      credential.ca = fs.readFileSync(`${ENV_FOLDER}/server-ca.crt`, 'utf8');
      credential.cert = fs.readFileSync(`${ENV_FOLDER}/server.crt`, 'utf8');
    }

    ServerStart({
      port,
      app,
      hostnames,
      credential,
      isSecure: IS_SECURE_MODE,
      useLocalhost: USE_LOCALHOST,
      access_all_host: ACCESS_ALL_AVAILABE_PORT,
    });

    if (ENABLE_SYNC) {
      // setInterval(() => {
      //   const mb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      //   console.log(`MEMORY: ${mb} MB`);
      // }, 1000);
      syncCouchDBToPostgres(AppDataSource);
    }

  })
  .catch(error => logNginx(`${error}`));

