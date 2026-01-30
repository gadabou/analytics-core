import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { ChildrenVaccines, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '../../models/dashboards';

let Connection: DataSource = AppDataSource.manager.connection;

const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;

interface VaccineParams {
    userId: string;
    recos: string[];
    months?: string[];
    year?: number;
    fullData: boolean;
    sync: boolean;
}

interface VaccineDataOutput {
    status: number;
    data: string | RecoVaccinationDashboardDbOutput[]
}



async function VACCINATION_DATA_EXPORT(params: VaccineParams, viewName:string): Promise<VaccineDataOutput> {
    try {
        /* VALIDATIONS */
        const { userId, recos, months, year, fullData } = params;

        if (!userId || !viewName) return { status: 401, data: notAuthorizedMsg };

        if (!Array.isArray(recos) || recos.length === 0) return { status: 400, data: paramettersErrorMsg };

        const recosArray = recos.map(String);
        const monthsArray = Array.isArray(months) ? months.map(String) : months ? [String(months)] : [];

        /* SQL BUILDING (SAFE) */
        const queryParams: any[] = [];
        let paramIndex = 1;

        const recoPlaceholders = recosArray.map(() => `$${paramIndex++}`).join(',');
        queryParams.push(...recosArray);

        let query = `
            SELECT *
            FROM ${viewName}
            WHERE (reco->>'id') IN (${recoPlaceholders})
        `;

        if (year !== undefined) {
            query += ` AND year = $${paramIndex++}`;
            queryParams.push(year);
        }

        if (monthsArray.length > 0) {
            const monthPlaceholders = monthsArray.map(() => `$${paramIndex++}`).join(',');
            query += ` AND month IN (${monthPlaceholders})`;
            queryParams.push(...monthsArray);
        }

        /* QUERY EXECUTION */
        const datas: RecoVaccinationDashboardDbOutput[] = await Connection.query(query, queryParams);

        if (fullData !== true) return { status: 200, data: datas };

        /* DATA FILTERING (OPTIMIZED) */
        const finalData: RecoVaccinationDashboardDbOutput[] = [];

        for (const vacc of datas) {
            if (!Array.isArray(vacc.children_vaccines)) continue;

            const filteredChildren: ChildrenVaccines[] = [];
            for (const vc of vacc.children_vaccines) {
                if (!Array.isArray(vc.data) || vc.data.length === 0) continue;

                const validData: RecoVaccinationDashboard[] = [];
                for (const v of vc.data) {
                    // 👉 Logique métier conservée (aucun filtre actif)
                    validData.push(v);
                }

                if (validData.length > 0) filteredChildren.push({ ...vc, data: validData });
            }

            if (filteredChildren.length > 0) finalData.push({ ...vacc, children_vaccines: filteredChildren });
        }

        return { status: 200, data: finalData };

    } catch (err: any) {
        console.error('error:', err);
        return { status: 500, data: serverErrorMsg(err) };
    }
}

export async function VACCINATION_NOT_DONE_DATA(params: VaccineParams): Promise<VaccineDataOutput> {
    return await VACCINATION_DATA_EXPORT(params, 'dashboards_reco_vaccination_not_done_view');
}
export async function GET_RECO_VACCINATION_NOT_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction, sendResponse: boolean = true) {
    var { userId, recos, fullData, sync } = req.body;
    const { status, data } = await VACCINATION_NOT_DONE_DATA({ userId, recos, fullData, sync });
    return res.status(status).json({ status, data });
}


export async function VACCINATION_ALL_DONE_DATA(params: VaccineParams): Promise<VaccineDataOutput> {
    return await VACCINATION_DATA_EXPORT(params, 'dashboards_reco_vaccination_all_done_view');
};
export async function GET_RECO_VACCINATION_ALL_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    var { userId, recos, fullData, sync } = req.body;
    const { status, data } = await VACCINATION_ALL_DONE_DATA({ userId, recos, fullData, sync });
    return res.status(status).json({ status, data });
}


export async function VACCINATION_PARTIAL_DONE_DATA(params: VaccineParams): Promise<VaccineDataOutput> {
    return await VACCINATION_DATA_EXPORT(params, 'dashboards_reco_vaccination_partial_done_view');
};
export async function GET_RECO_VACCINATION_PARTIAL_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    var { userId, recos, fullData, sync } = req.body;
    const { status, data } = await VACCINATION_PARTIAL_DONE_DATA({ userId, recos, fullData, sync });
    return res.status(status).json({ status, data });
}

