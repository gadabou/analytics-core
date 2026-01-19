
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getApiTokenAccessRepository, ApiTokenAccess } from '../entities/Api-token';
import { Repository } from 'typeorm';


export class ApiTokenUtils {

    private static readonly MIN_LENGTH = 10;
    private static readonly MAX_ATTEMPTS = 10;

    private static generateApiToken(length: number): string {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

    private static async isTokenUnique(apiRepo: Repository<ApiTokenAccess>, token: string): Promise<boolean> {
        const existing = await apiRepo.find({ where: { token } });
        return existing.length === 0;
    }

    static async generateUniqueApiToken(apiRepo: Repository<ApiTokenAccess>, length: number = ApiTokenUtils.MIN_LENGTH): Promise<string> {
        let tokenLen = Math.max(length, ApiTokenUtils.MIN_LENGTH);

        let token: string;
        let attempts = 0;

        do {
            if (attempts >= ApiTokenUtils.MAX_ATTEMPTS) {
                throw new Error('Impossible de générer un token unique après ' + ApiTokenUtils.MAX_ATTEMPTS + ' essais');
            }

            token = ApiTokenUtils.generateApiToken(tokenLen);
            attempts++;

        } while (!(await ApiTokenUtils.isTokenUnique(apiRepo, token)));

        return token;
    }
}



export class ApisController {

  static async AccessKeyList(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, id, tokenLen, isActive, action } = req.body;

      if (!userId) return res.status(400).json({ status: 400, data: 'Aucun utilisateur sélectionné' });

      const apiRepo = await getApiTokenAccessRepository();
      let success = false;

      switch (action) {
        case 'list':
          success = true;
          break;

        case 'create':
        case 'refresh': {
          let api: ApiTokenAccess;
          if (id) {
            api = (await apiRepo.findOneBy({ id })) ?? new ApiTokenAccess();
          } else {
            api = new ApiTokenAccess();
          }

          // Génération du token unique
          api.token = await ApiTokenUtils.generateUniqueApiToken(apiRepo, tokenLen);

          // Définition du statut actif
          api.isActive = action === 'create' ? true : !!isActive;

          await apiRepo.save(api);
          success = true;
          break;
        }

        case 'update': {
          if (!id) break;
          const api = await apiRepo.findOneBy({ id });
          if (!api) break;

          api.isActive = !!isActive;
          await apiRepo.update(id, api);
          success = true;
          break;
        }

        case 'delete': {
          if (!id) break;
          const api = await apiRepo.findOneBy({ id });
          if (!api) break;

          await apiRepo.delete(id);
          success = true;
          break;
        }

        default:
          return res.status(400).json({ status: 400, data: 'Action inconnue' });
      }

      if (success) {
        const apis = await apiRepo.find();
        return res.status(200).json({ status: 200, data: apis });
      }

      return res.status(400).json({ status: 400, data: 'Impossible de réaliser l’action demandée' });

    } catch (err: any) {
      console.error('ApisController AccessKeyList error:', err);
      return res.status(500).json({ status: 500, data: 'Erreur serveur: ' + err.message || err });
    }
  }
}
