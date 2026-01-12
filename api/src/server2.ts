import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import path from 'path';
import fs from 'fs';
import { AppDataSource } from './data-source';
import { ServerStart, getIPAddress, logNginx, normalizePort, notEmpty } from './functions/functions';
import cors from 'cors';
import bearerToken from 'express-bearer-token';
import { ENV, ENV_FOLDER } from "./providers/constantes";

import session from 'express-session';
import compression from "compression";
import responseTime from 'response-time';
import fetch from 'node-fetch';
import { ApiTokenAccess, getApiTokenAccessRepository } from './entities/Api-token';
import { VACCINATION_NOT_DONE_DATA, VACCINATION_ALL_DONE_DATA, VACCINATION_PARTIAL_DONE_DATA } from './controllers/DASHBOARDS/dashboars-realtime';
import { RECOS_CUSTOM_QUERY } from './controllers/ORGUNITS/org-units-custom';

const { API_PORT, ACCESS_ALL_AVAILABE_PORT, USE_LOCALHOST, IS_SECURE_MODE } = ENV;


const parseInQuery = (input: string): string[] => {
  const data = [];
  try {
    const regex1 = /['\[\]\s"]/g;
    const regex2 = /%27/g;
    if (input && notEmpty(input)) {
      const dts = input.split(',');
      for (let i = 0; i < dts.length; i++) {
        var res = dts[i].replace(regex1, '');
        res = res.replace(regex2, '');
        data.push(res);
      }
    }
  } catch (error) { }
  return data;
};


async function uidsJson(req: Request, res: Response, next: NextFunction): Promise<any> {
  const { number } = req.body ?? req.query ?? req.params;
  if (number && number != '') {
    const numIds = parseInt(number, 10);
    if (isNaN(numIds) || numIds <= 0) {
      return 'A';
    }
    const csvData = Array.from({ length: numIds }, () => ({
      id: uuidv4(),
    }));
    return csvData.length <= 0 ? 'D' : csvData;
  } else {
    return 'B';
  }
}

const validPaths = [
  '/api/documentations',
  '/api/vaccine',
];

const getActiveTokens = async () => {
  const apiRepo = await getApiTokenAccessRepository();
  const validApiKeysElement: ApiTokenAccess[] = await apiRepo.findBy({ isActive: true });
  if (validApiKeysElement.length === 0) {
    return [{ id: 1, token: 'AZERTY', isActive: true }]
  }
  return validApiKeysElement;
}

function app() {
  const server = express();

  server.use(helmet())
    .enable('trust proxy')
    .set('trust proxy', 1)
    .set('content-type', 'application/json; charset=utf-8')
    .set('view engine', 'ejs')
    .set('views', path.join(__dirname, 'views'))
    .use(cors({
      origin: true,//['http://127.0.0.1:5501', 'http://127.0.0.1:5502'],
      credentials: true
    }))
    .use(responseTime())
    .use(compression())
    .set('json spaces', 0)
    .use(session({
      secret: 'session',
      cookie: {
        secure: true,
        maxAge: 60000
      },
      saveUninitialized: true,
      resave: true
    }))
    .use(bearerToken())
    .use(async (req: Request, res: Response, next: NextFunction) => {
      const { api_access_key } = req.body ?? req.query ?? req.params;
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed', allowedMethods: ['GET'] });
      if (IS_SECURE_MODE && !req.secure) return res.redirect(`https://${req.headers.host}${req.url}`);
      if (!api_access_key || api_access_key == '') return res.status(405).json({ error: 'You must provide a valid `api_access_key`' });

      const validApiKeysElement = await getActiveTokens();

      const validApiKeys = validApiKeysElement.map(api => api.token);
      if (!validApiKeys.includes(api_access_key) || !validPaths.includes(req.path)) return res.status(401).json({ error: 'Unauthorized' });
      if (IS_SECURE_MODE && req.secure || !req.secure) next();
    })
    .get('/favicon.ico', (req, res) => {
      res.status(204).end(); // No content response
    })
    .get('/api/documentations', async (req: Request, res: Response, next: NextFunction) => {
      server.set('json spaces', 0);
      const { date } = req.body ?? req.query ?? req.params;
      const params = {
        host: 'https://tonoudayoapi.portal-integratehealth.org/api/chws-meg?',
        api_access_key: 'api_access_key = your_valid_api_access_key',
        year: '& year = 2023',
        month: '& month = 12',
        districts: '& districts = x8f4IKAC7TO',
        sites: '& sites = [552aafc3-11a9-4209-8f17-d1ea13bab8d5]',
        chws: '& chws = [eafabdf9-c16a-44d5-83e4-a619d5478919]',
        full_url: 'https://tonoudayoapi.portal-integratehealth.org/api/chws-meg?api_access_key=your_valid_api_access_key&year=2023&month=12&districts=x8f4IKAC7TO&sites=[552aafc3-11a9-4209-8f17-d1ea13bab8d5]&chws=[eafabdf9-c16a-44d5-83e4-a619d5478919]',
      };
      return res.render('documentations', params);
    })
    .get('/api/vaccine', async (req: Request, res: Response, next: NextFunction) => {
      server.set('json spaces', 2);
      const { state, api_access_key, recos, months, year } = req.body ?? req.query ?? req.params; // not_done | all_done | partial_done 

      let apiYear = 0;

      if (!year || year.length !== 4 || Array.isArray(year)) {
        return res.json({ error: `Vous devez renseigner l'année ( Exple: year=2025 )` });
      } else {
        try {
          apiYear = parseInt(`${year}`);
        } catch (error) { }

        if (`${apiYear}`.length !== 4) {
          return res.json({ error: `Vous devez renseigner l'année ( Exple: year=2025 )` });
        }
      }

      let apiRecos: string[] = [];
      if (!recos || recos.length === 0) return res.json({ error: 'Vous devez renseigner au moins un `RECO`!' });
      if (['*', 'all'].includes(recos)) {
        const allRecos = await RECOS_CUSTOM_QUERY();
        apiRecos = allRecos.map(r => r.id);
      } else if (Array.isArray(recos)) {
        apiRecos = recos as string[];
      } else {
        const recoFound = String(recos).split(',').map(r => r.trim()).filter(Boolean);
        if (recoFound.length === 0) return res.json({ error: 'Aucun `RECO` renseigné' });
        apiRecos = recoFound;
      }


      let apiMonths: string[] = [];
      if (!months || months.length === 0) return res.json({ error: 'Vous devez renseigner au moins un `MOIS`!' });
      if (['*', 'all'].includes(months)) {
        apiMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));;
      } else if (Array.isArray(months)) {
        apiMonths = months.map(m => String(m).padStart(2, '0'));
      } else {
        const monthFound = String(months).split(',').map(m => m.trim()).filter(Boolean).map(m => m.padStart(2, '0'));
        if (monthFound.length === 0) return res.json({ error: 'Aucun `Mois` renseigné' });
        apiMonths = monthFound;
      }


      const params = { userId: api_access_key, recos: apiRecos, months: apiMonths, year: apiYear, fullData: true, sync: true }

      if (state === 'not_done') {
        const { status, data } = await VACCINATION_NOT_DONE_DATA(params);
        return res.json(data);

      } else if (state === 'all_done') {
        const { status, data } = await VACCINATION_ALL_DONE_DATA(params);
        return res.json(data);

      } else if (state === 'partial_done') {
        const { status, data } = await VACCINATION_PARTIAL_DONE_DATA(params);
        return res.json(data);

      } else {
        return res.json({ error: `Le state n'existe pas (Exple: state='not_done')` });
      }


    });
  return server;

}


AppDataSource.initialize().then(async () => {
  logNginx("Server 2 -> initialize success !");
}).catch(error => { logNginx(`Server 2 -> ${error}`) });


const server = app();
const hostnames = getIPAddress(ACCESS_ALL_AVAILABE_PORT);
const port = normalizePort(API_PORT || 3334);

const credential: Record<string, any> | any = {};

if (IS_SECURE_MODE) {
  credential.key = fs.readFileSync(`${ENV_FOLDER}/server.key`, 'utf8');
  credential.ca = fs.readFileSync(`${ENV_FOLDER}/server-ca.crt`, 'utf8');
  credential.cert = fs.readFileSync(`${ENV_FOLDER}/server.crt`, 'utf8');
}
ServerStart({
  credential,
  isSecure: IS_SECURE_MODE,
  server,
  access_all_host: ACCESS_ALL_AVAILABE_PORT,
  port,
  hostnames,
  useLocalhost: USE_LOCALHOST
})








// .get('/api/uids', async (req: Request, res: Response, next: NextFunction) => {
//   server.set('json spaces', 0);
//   const uidsJsonData = await uidsJson(req, res, next);
//   if (uidsJsonData === 'A') {
//     return res.json({ error: 'Provide valid number' });
//   } else if (uidsJsonData === 'B') {
//     return res.status(401).json({ error: 'Provide number of IDs' });
//   } else if (uidsJsonData === 'C') {
//     return res.status(401).json({ error: 'Unauthorized' });
//   } else if (uidsJsonData == 'D') {
//     return res.status(404).json({ error: 'No data found in db' });
//   } else {
//     return res.json(uidsJsonData);
//   }
// })
// .get('/api/uids.csv', async (req: Request, res: Response, next: NextFunction) => {
//   server.set('json spaces', 0);
//   const csvData: any = await uidsJson(req, res, next);
//   if (csvData === 'A') {
//     return res.json({ error: 'Provide valid number' });
//   } else if (csvData === 'B') {
//     return res.status(401).json({ error: 'Provide number of IDs' });
//   } else if (csvData === 'C') {
//     return res.status(401).json({ error: 'Unauthorized' });
//   } else if (csvData == 'D') {
//     return res.status(404).json({ error: 'No data found in db' });
//   } else {
//     // const fileName = `uids-${Date.now()}.csv`;
//     // const downloadPath = path.resolve(`${__dirname}/downloads`, fileName);
//     const csvWriter = createCsvWriter({
//       path: 'output.csv',
//       header: [
//         { id: 'id', title: 'id' },
//       ],
//     });
//     csvWriter.writeRecords(csvData)
//       .then(() => {
//         res.attachment('output.csv');
//         res.status(200).sendFile('output.csv');
//       })
//       .catch((err: any) => {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//       });
//   }
// })
// .get('/api/uids.json', async (req: Request, res: Response, next: NextFunction) => {
//   server.set('json spaces', 2);
//   const uidsJsonData = await uidsJson(req, res, next);
//   if (uidsJsonData === 'A') {
//     return res.json({ error: 'Provide valid number' });
//   } else if (uidsJsonData === 'B') {
//     return res.status(401).json({ error: 'Provide number of IDs' });
//   } else if (uidsJsonData === 'C') {
//     return res.status(401).json({ error: 'Unauthorized' });
//   } else if (uidsJsonData == 'D') {
//     return res.status(404).json({ error: 'No data found in db' });
//   } else {
//     return res.json(uidsJsonData);
//   }
// })