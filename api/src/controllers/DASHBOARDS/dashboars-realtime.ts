import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { ChildrenVaccines, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '../../models/dashboards';

let Connection: DataSource = AppDataSource.manager.connection;

const paramettersErrorMsg = 'Les paramettres renseignés sont vides';
const notAuthorizedMsg = `Vous n'êtes pas autorisé à effectuer cette action!`;
const serverErrorMsg = (error: any) => `${error || 'Erreur Interne Du Serveur'}`;

export async function VACCINATION_NOT_DONE_DATA(params: { userId: string, recos: string[], months?: string[], year?: number, fullData: boolean, sync: boolean }): Promise<{ status: number; data: any }> {
    try {
        var { userId, recos, months, year, fullData, sync } = params;
        if (!userId) return { status: 201, data: notAuthorizedMsg }
        if (!recos) return { status: 201, data: paramettersErrorMsg };

        const recosArray = Array.isArray(recos) ? recos : [recos];
        const recosIdsList = recosArray.map((_: any, i: number) => `$${i + 1}`).join(',');
        const monthsArray = months ? (Array.isArray(months) ? months : [months]) : [];

        let datas: RecoVaccinationDashboardDbOutput[];

        let query = `
            SELECT * FROM dashboards_reco_vaccination_not_done_view
            WHERE (reco->>'id')::text IN (${recosIdsList})
        `;
        let queryParams = [...recosArray]


        if (year) {
            const yearPlaceholders = `$${recosArray.length + 1}`;
            query += ` AND year::text IN (${yearPlaceholders})`;
            queryParams = [...queryParams, `${year}`]
        }

        if (monthsArray.length > 0) {
            const monthsPlaceholders = monthsArray.map((_: any, i: number) => {
                return `$${recosArray.length + (year ? 2 : 1) + i}`
            }).join(',');
            query += ` AND month::text IN (${monthsPlaceholders})`;
            queryParams = [...queryParams, ...monthsArray ]
        }


        datas = await Connection.query(query,queryParams);

        if (fullData == true) {
            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
            return { status: 200, data: datas };
        } else {
            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of (vc.data ?? [])) {
                        // if (vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                        (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if (vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }
                if (vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }
            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
            return { status: 200, data: fanalData };
        }
    } catch (err: any) {
        return { status: 500, data: serverErrorMsg(err) };
    }
};
export async function GET_RECO_VACCINATION_NOT_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction, sendResponse: boolean = true) {
    var { userId, recos, fullData, sync } = req.body;
    const { status, data } = await VACCINATION_NOT_DONE_DATA({ userId, recos, fullData, sync });
    return res.status(status).json({ status, data });
}


export async function VACCINATION_ALL_DONE_DATA(params: { userId: string, recos: string[], months?: string[], year?: number, fullData: boolean, sync: boolean }): Promise<{ status: number; data: any }> {
    try {
        var { userId, recos, months, year, fullData, sync } = params;
        if (!userId) return { status: 201, data: notAuthorizedMsg };
        if (!recos) return { status: 201, data: paramettersErrorMsg };

        const recosArray = Array.isArray(recos) ? recos : [recos];
        const recosIdsList = recosArray.map((_: any, i: number) => `$${i + 1}`).join(',');
        const monthsArray = months ? (Array.isArray(months) ? months : [months]) : [];

        let datas: RecoVaccinationDashboardDbOutput[];

        let query = `
            SELECT * FROM dashboards_reco_vaccination_all_done_view
            WHERE (reco->>'id')::text IN (${recosIdsList})
        `;
        let queryParams = [...recosArray]


        if (year) {
            const yearPlaceholders = `$${recosArray.length + 1}`;
            query += ` AND year::text IN (${yearPlaceholders})`;
            queryParams = [...queryParams, `${year}`]
        }

        if (monthsArray.length > 0) {
            const monthsPlaceholders = monthsArray.map((_: any, i: number) => {
                return `$${recosArray.length + (year ? 2 : 1) + i}`
            }).join(',');
            query += ` AND month::text IN (${monthsPlaceholders})`;
            queryParams = [...queryParams, ...monthsArray ]
        }


        datas = await Connection.query(query,queryParams);


        if (fullData == true) {
            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
            return { status: 200, data: datas };
        } else {
            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of (vc.data ?? [])) {
                        // if (vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                        (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if (vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }

                if (vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }
            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
            return { status: 200, data: fanalData };
        }
    } catch (err: any) {
        return { status: 500, data: serverErrorMsg(err) };
    }
};
export async function GET_RECO_VACCINATION_ALL_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    var { userId, recos, fullData, sync } = req.body;
    const { status, data } = await VACCINATION_ALL_DONE_DATA({ userId, recos, fullData, sync });
    return res.status(status).json({ status, data });
}

export async function VACCINATION_PARTIAL_DONE_DATA(params: { userId: string, recos: string[], months?: string[], year?: number, fullData: boolean, sync: boolean }): Promise<{ status: number; data: any }> {
    try {
        var { userId, recos, months, year, fullData, sync } = params;
        if (!userId) return { status: 201, data: notAuthorizedMsg };
        if (!recos) return { status: 201, data: paramettersErrorMsg };

        const recosArray = Array.isArray(recos) ? recos : [recos];
        const recosIdsList = recosArray.map((_: any, i: number) => `$${i + 1}`).join(',');
        const monthsArray = months ? (Array.isArray(months) ? months : [months]) : [];

        let datas: RecoVaccinationDashboardDbOutput[];

        let query = `
            SELECT * FROM dashboards_reco_vaccination_partial_done_view
            WHERE (reco->>'id')::text IN (${recosIdsList})
        `;
        let queryParams = [...recosArray]


        if (year) {
            const yearPlaceholders = `$${recosArray.length + 1}`;
            query += ` AND year::text IN (${yearPlaceholders})`;
            queryParams = [...queryParams, `${year}`]
        }

        if (monthsArray.length > 0) {
            const monthsPlaceholders = monthsArray.map((_: any, i: number) => {
                return `$${recosArray.length + (year ? 2 : 1) + i}`
            }).join(',');
            query += ` AND month::text IN (${monthsPlaceholders})`;
            queryParams = [...queryParams, ...monthsArray ]
        }


        datas = await Connection.query(query,queryParams);

        if (fullData == true) {
            // const dataTransformed = sync === true ? datas : await TransformRecoVaccinationDashboard(datas);
            return { status: 200, data: datas };
        } else {
            let fanalData: RecoVaccinationDashboardDbOutput[] = [];

            for (const vacc of datas) {
                const vaccData = { ...vacc, children_vaccines: [] }
                for (const vc of vacc.children_vaccines) {
                    const vcData = { ...vc, data: [] };
                    for (const v of (vc.data ?? [])) {
                        // if (vaccine_VAR_2 != true) (vcData.data as RecoVaccinationDashboard[]).push(v)
                        (vcData.data as RecoVaccinationDashboard[]).push(v)
                    }
                    if (vcData.data.length > 0) (vaccData.children_vaccines as ChildrenVaccines[]).push(vcData)
                }

                if (vaccData.children_vaccines.length > 0) fanalData.push(vaccData)
            }
            // const dataTransformed = sync === true ? fanalData : await TransformRecoVaccinationDashboard(fanalData);
            return { status: 200, data: fanalData };
        }
    } catch (err: any) {
        return { status: 500, data: serverErrorMsg(err) };
    }
};
export async function GET_RECO_VACCINATION_PARTIAL_DONE_DASHBOARD(req: Request, res: Response, next: NextFunction) {
    var { userId, recos, fullData, sync } = req.body;
    const { status, data } = await VACCINATION_PARTIAL_DONE_DATA({ userId, recos, fullData, sync });
    return res.status(status).json({ status, data });
}

