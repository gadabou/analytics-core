import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getUsersRepository, userTokenGenerated } from "../entities/User";
import { ENV } from "../providers/constantes";
import { roleAuthorizations } from "../providers/authorizations-pages";
import { ApiTokenAccess, getApiTokenAccessRepository } from '../entities/Api-token';
import { getUsersLogRepository } from '../entities/UserLog';
import useragent from 'useragent'; // Optional: For parsing user-agent string
import { URL } from 'url'

const { IS_SECURE_MODE, SERVER_HOST } = ENV;

// 🔐 Liste d'IP autorisées (à personnaliser selon ton infra)
const TRUSTED_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

if (SERVER_HOST) {
  TRUSTED_IPS.push(SERVER_HOST);
}

const EXCLUDED_PATHS = new Set([
  '/icons',
  '/assets',
  '/ngsw.json',
  '/runtime',
  '/polyfills',
  '/main',
  '/scripts',
  '/styles',
  '/manifest',
  // '/src_app_modules_auths_auths_module_ts',
  // '/.well-known/appspecific/com.chrome.devtools.json',
  '/favicon.ico',
  '/ngsw-worker.js',
  '/index.html',
  '/publics',
  '/fa-solid-900',

  '/auths/login',
  '/api/auths/login',

  '/auth-user/login',
  '/api/auth-user/login',

  "/configs/version",
  "/api/configs/version"
]);

/* ======================================================
 * Sécurité API (middleware)
 * ====================================================== */
const BASE_API = '/api';

const PUBLIC_ROUTES = ['/documentations', '/vaccine'];

const buildPublicPaths = (): string[] => {
  const result: string[] = [];

  for (const route of PUBLIC_ROUTES) {
    // Route brute
    result.push(route);

    // API brute
    result.push(`${BASE_API}${route}`);

    // JSON
    result.push(`${route}.json`);
    result.push(`${BASE_API}${route}.json`);

    // CSV
    result.push(`${route}.csv`);
    result.push(`${BASE_API}${route}.csv`);
  }

  return result;
};
const normalizedPath = (url: string): string => url.split('?')[0].replace(/\/+$/, '');

const validPaths = new Set<string>(buildPublicPaths());

const unsecurePath = ['/documentations', '/api/documentations',]

const { APP_AUTH_TOKEN, APP_SECRET_PRIVATE_KEY } = ENV;


const getActiveTokens = async (): Promise<ApiTokenAccess[]> => {
  const repo = await getApiTokenAccessRepository();
  const tokens = await repo.findBy({ isActive: true });
  return tokens.length ? tokens : [{ id: 1, token: 'AZERTY', isActive: true } as ApiTokenAccess];
};

export class Middelware {
  static authMiddleware = async (req: Request, res: Response, next: any) => {
    const { userId, privileges, appLoadToken } = req.body;

    const noPermissionsMsg = { status: 500, action: 'logout', data: 'Vous n\'navez pas les permissions necessaires' };
    const notAuthenticated = { status: 500, action: 'logout', data: 'Vous n\'êtes pas authentifié!' };

    if (privileges === true) return next();
    // if (appLoadToken !== APP_AUTH_TOKEN) return res.status(500).send(notAuthenticated);
    const authHeader = req.get('Authorization');

    if (!authHeader || !userId) return res.status(500).send(notAuthenticated);
    const token = authHeader.split(' ')[1];
    const _repo = await getUsersRepository();

    // if (!token || token=='' || token != user?.token) return res.status(500).send(notAuthenticated);
    if (!token || token == '') return res.status(500).send(notAuthenticated);
    const user = await _repo.findOneBy({ id: userId });
    if (!user) return res.status(500).send(noPermissionsMsg);

    jwt.verify(token, APP_SECRET_PRIVATE_KEY, function (err: any, decoded: any) {
      return err ? res.status(500).send(notAuthenticated) : next();
    });
  };

  static validateReportsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ status: 400, data: 'Aucun utilisateur sélectionné' });

      const _repo = await getUsersRepository();
      const user = await _repo.findOneBy({ id: userId });

      if (!user || !user.isActive || user.isDeleted) return res.status(403).json({ status: 403, data: 'Utilisateur non autorisé ou inactif' });

      const userToken = await userTokenGenerated(user);
      if (!userToken) return res.status(401).json({ status: 401, data: 'Non autorisé' });

      const role = roleAuthorizations(userToken.authorizations ?? [], userToken.routes ?? []);
      if (!role.canValidateData) return res.status(403).json({ status: 403, data: 'Accès refusé' });

      next();
    } catch (err) {
      console.error('Erreur middleware promotion-reports:', err);
      return res.status(500).json({ status: 500, data: 'Erreur serveur' });
    }
  };

  static sendReportsToDhis2Middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ status: 400, data: 'Aucun utilisateur sélectionné' });

      const _repo = await getUsersRepository();
      const user = await _repo.findOneBy({ id: userId });

      if (!user || !user.isActive || user.isDeleted) return res.status(403).json({ status: 403, data: 'Utilisateur non autorisé ou inactif' });

      const userToken = await userTokenGenerated(user);
      if (!userToken) return res.status(401).json({ status: 401, data: 'Non autorisé' });

      const role = roleAuthorizations(userToken.authorizations ?? [], userToken.routes ?? []);
      if (!role.canSendDataToDhis2) return res.status(403).json({ status: 403, data: 'Accès refusé' });

      next();
    } catch (err) {
      console.error('Erreur middleware promotion-reports:', err);
      return res.status(500).json({ status: 500, data: 'Erreur serveur' });
    }
  };

  static apiSecurity = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const apiKey = req.query.api_access_key || req.body?.api_access_key || req.params?.api_access_key;

      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed', allowedMethods: ['GET'] });
      }

      if (IS_SECURE_MODE && !req.secure) {
        return res.redirect(`https://${req.headers.host}${req.originalUrl}`);
      }

      if (!validPaths.has(req.path)) {
        return res.status(404).json({ error: 'Endpoint not allowed' });
      }

      if (!unsecurePath.includes(req.path)) {
        if (!apiKey) {
          return res.status(401).json({ error: 'api_access_key is required' });
        }
        const activeTokens = await getActiveTokens();
        const allowedKeys = activeTokens.map(t => t.token);

        if (!allowedKeys.includes(String(apiKey))) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  static userLoggerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    // skip static/public paths
    if (EXCLUDED_PATHS.has(normalizedPath(req.path))) {
      return next();
    }

    // method check
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // secure check
    if (IS_SECURE_MODE && !req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }

    // userId extraction
    const rawUserId = req.body?.userId || req.headers['x-user-id'];
    const userId = typeof rawUserId === 'string' && /^[a-zA-Z0-9\-]{10,}$/.test(rawUserId) ? rawUserId : null;

    if (!userId) {
      return next(); // pas de DB call si pas d'utilisateur
    }

    // async logging non bloquant
    setImmediate(async () => {
      try {
        const userRepo = await getUsersRepository();
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) return;

        const logRepo = await getUsersLogRepository();
        const agent = useragent.parse(req.headers['user-agent'] || '');

        const protocol = req.secure ? 'https' : 'http';
        const fullUrl = new URL(req.originalUrl, `${protocol}://${req.headers.host}`).href;

        const log = logRepo.create({
          userId: user,
          method,
          url: fullUrl,
          userAgent: req.headers['user-agent'],
          clientIp,
          referer: req.headers['referer'] || '',
          acceptLanguage: req.headers['accept-language'] || '',
          browser: agent.toString(),
          os: agent.os.toString(),
          device: agent.device.toString(),
        });

        await logRepo.save(log);
      } catch (err) {
        console.error('Logging error:', err);
      }
    });

    return next(); // 🚀 continue immédiatement
  };
}





// // src/middleware/logger.ts
// import { Request, Response, NextFunction } from 'express';
// import { getUsersLogRepository } from '../entities/UserLog';
// import { getUsersRepository } from '../entities/User';
// import { ENV } from '../providers/constantes';
// import useragent from 'useragent'; // Optional: For parsing user-agent string
// import { URL } from 'url'

// const { IS_SECURE_MODE, SERVER_HOST } = ENV;

// // 🔐 Liste d'IP autorisées (à personnaliser selon ton infra)
// const TRUSTED_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

// if (SERVER_HOST) {
//   TRUSTED_IPS.push(SERVER_HOST);
// }

// const EXCLUDED_ORIGIN = [
//   '/icons',
//   '/assets',
//   '/ngsw.json',
//   '/auths/login',
//   '/api/auth-user/login',
//   '/runtime',
//   '/polyfills',
//   '/main',
//   '/scripts',
//   '/styles',
//   '/manifest',
//   // '/src_app_modules_auths_auths_module_ts',
//   '/favicon.ico',
//   '/ngsw-worker.js',
//   '/index.html',
//   '/publics',
//   '/fa-solid-900'
// ];


// const PUBLIC_PATHS = [
//   '/.well-known/appspecific/com.chrome.devtools.json'
// ];


// export const userLoggerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   const method = req.method.toUpperCase();
//   const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
//   const clientIp: string = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
//   // Get user agent (browser info)
//   const userAgent = req.headers['user-agent'] || '';
//   // Additional info (can add more if needed)
//   const referer = req.headers['referer'] || 'unknown'; // For the referring page
//   const acceptLanguage = req.headers['accept-language'] || 'unknown'; // User language

//   const proceed = () => {
//     if (!allowedMethods.includes(method)) return res.status(405).json({ message: 'Method Not Allowed' });
//     if (!userAgent || userAgent.length < 3) return res.status(400).json({ message: 'Invalid User-Agent' });
//     if (IS_SECURE_MODE && !req.secure) return res.redirect(`https://${req.headers.host}${req.url}`);
//     return next();
//   };

//   if (PUBLIC_PATHS.includes(req.path) || req.path.startsWith('/.well-known/')) {
//     // return res.sendStatus(204); // No Content
//     return proceed();
//   }

//   const isExcludedUrl = (): boolean => {
//     return EXCLUDED_ORIGIN.some(path => req.originalUrl.includes(path));
//   }

//   try {
//     // 🔒 Vérifie si l'IP est autorisée
//     if (!TRUSTED_IPS.includes(clientIp)) {
//       if (!isExcludedUrl()) {
//         console.warn(`⛔ Unauthorized IP: ${clientIp}`);
//       }
//       return res.status(403).json({ message: 'Forbidden: Unauthorized IP' });
//     }

//     // 🔒 Vérifie le Content-Type sur les POST
//     if (method === 'POST' && req.headers['content-type'] !== 'application/json') {
//       if (!isExcludedUrl()) {
//         console.warn(`⛔ Invalid Content-Type: ${req.headers['content-type']}`);
//       }
//       return res.status(415).json({ message: 'Unsupported Media Type' });
//     }

//     // 🔒 Récupère userId de manière sécurisée
//     const rawUserId = req.body?.userId || req.headers['x-user-id'];
//     const userId = typeof rawUserId === 'string' && /^[a-zA-Z0-9\-]{10,}$/.test(rawUserId) ? rawUserId : null;

//     const logData = req.body?.noLogData != true;

//     if (!userId) {
//       if (!isExcludedUrl() && logData) {
//         console.warn(`⚠️ Invalid or missing userId | Method: ${method} | URL: ${req.originalUrl}`);
//       }
//       return proceed();
//     }

//     const userRepo = await getUsersRepository();
//     const user = await userRepo.findOne({ where: { id: userId } });

//     if (!user) {
//       if (!isExcludedUrl() && logData) {
//         console.warn(`⚠️ Unknown user with ID: ${userId} | Method: ${method} | URL: ${req.originalUrl}`);
//       }
//       return proceed();
//     }

//     if (!isExcludedUrl() && logData) {
//       // Parsing User-Agent information
//       const agent = useragent.parse(req.headers['user-agent']);
//       const deviceInfo = {
//         browser: agent.toString(),
//         os: agent.os.toString(),
//         // platform: agent.platform,
//         device: agent.device.toString(),
//       };


//       // Construct full URL
//       const protocol = req.secure ? 'https' : 'http';
//       const fullUrl = new URL(req.originalUrl, `${protocol}://${req.headers.host}`).href;



//       const logRepo = await getUsersLogRepository();
//       const log = logRepo.create({
//         userId: user,
//         method: method,
//         url: fullUrl,
//         userAgent: userAgent,
//         clientIp: clientIp,
//         referer: referer,
//         acceptLanguage: acceptLanguage,
//         browser: deviceInfo.browser,
//         os: deviceInfo.os,
//         // platform: deviceInfo.platform,
//         device: deviceInfo.device,
//       });

//       await logRepo.save(log);

//       // Log output for debugging (can be removed in production)
//       console.log(`
//       📥 Logged user action:
//       → ID: ${userId}
//       → Name: ${user.fullname ?? user.username}
//       → Method: ${method}
//       → URL: ${fullUrl}
//       → IP: ${clientIp}
//       → User-Agent: ${userAgent}
//       → Referer: ${referer}
//       → Accept-Language: ${acceptLanguage}
//       → Device: ${deviceInfo.device}
//       → Browser: ${deviceInfo.browser}
//       → OS: ${deviceInfo.os}
//     `);

//       return proceed();
//     } else {

//       return proceed();
//     }
//   } catch (error) {
//     console.error('❌ Logger Middleware Error:', {
//       message: (error as any)?.message,
//       stack: (error as any)?.stack,
//       method,
//       url: req.originalUrl,
//       ip: clientIp
//     });
//     return proceed();
//   }
// };
