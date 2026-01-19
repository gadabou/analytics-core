import { axiosInstance } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from '@/types';

// ============================================
// GENERIC API SERVICE CLASS
// ============================================
class ApiService {
  // Generic GET request
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await axiosInstance.get<T>(url, { params });
    return response.data;
  }

  // Generic POST request
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.post<T>(url, data);
    return response.data;
  }

  // Generic PUT request
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.put<T>(url, data);
    return response.data;
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data);
    return response.data;
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await axiosInstance.delete<T>(url);
    return response.data;
  }

  // Paginated GET request
  async getPaginated<T>(
    url: string,
    params?: PaginationParams & Record<string, unknown>
  ): Promise<PaginatedResponse<T>> {
    const response = await axiosInstance.get<PaginatedResponse<T>>(url, { params });
    return response.data;
  }

  // Upload file
  async uploadFile<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Download file
  async downloadFile(url: string, filename: string): Promise<void> {
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const apiService = new ApiService();

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get user ID from localStorage
const getUserId = (): string | null => {
  try {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.state?.user?.id || null;
    }
  } catch {
    return null;
  }
  return null;
};

// Add userId to params
const withUserId = <T extends object>(params: T): T & { userId: string | null } => {
  return { ...params, userId: getUserId() };
};

// Generic API response type
interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  message?: string;
}

// ============================================
// AUTH API
// ============================================
export const AuthApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/login', {
      credential: credentials.username,
      password: credentials.password,
      loginModeCredents: true,
    });
    return response.data;
  },

  register: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/register', withUserId(user));
    return response.data;
  },

  refreshToken: async (updateReload = false) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/new-token', withUserId({ updateReload }));
    return response.data;
  },

  getUsers: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/users', withUserId({}));
    return response.data;
  },

  updateProfile: async (params: { id: string; fullname: string; email: string; phone: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-user-profile', withUserId(params));
    return response.data;
  },

  updateUser: async (user: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-user', withUserId(user));
    return response.data;
  },

  updatePassword: async (params: { id: string; oldPassword: string; newPassword: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-user-password', withUserId(params));
    return response.data;
  },

  deleteUser: async (user: Record<string, unknown>, permanentDelete = false) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/delete-user', withUserId({ ...user, permanentDelete }));
    return response.data;
  },

  getRoles: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/roles', withUserId({}));
    return response.data;
  },

  createRole: async (role: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/create-role', withUserId(role));
    return response.data;
  },

  updateRole: async (role: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/update-role', withUserId(role));
    return response.data;
  },

  deleteRole: async (role: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/delete-role', withUserId(role));
    return response.data;
  },

  getAuthorizations: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/authorizations', withUserId({}));
    return response.data;
  },

  getRoutes: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/routes', withUserId({}));
    return response.data;
  },

  apiTokenAction: async (params: { action: string; id?: number; token?: string; isActive?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/api-access-key', withUserId(params));
    return response.data;
  },
};

// ============================================
// REPORTS API
// ============================================
export const ReportsApi = {
  getPromotionReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/promotion-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/family-planning-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getMorbidityReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/morbidity-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/household-recaps-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getPcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/pcime-newborn-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getChwsRecoReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/chws-reco-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/reco-meg-situation-reports', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  // Validation endpoints
  validatePromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/promotion-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidatePromotionReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-promotion-reports-validation', withUserId(params));
    return response.data;
  },

  validateFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/family-planning-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateFamilyPlanningReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-family-planning-reports-validation', withUserId(params));
    return response.data;
  },

  validateMorbidityReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/morbidity-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateMorbidityReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-morbidity-reports-validation', withUserId(params));
    return response.data;
  },

  validateHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[]; dataIds: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/household-recaps-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateHouseholdRecapReports: async (params: { months: string[]; year: number; recos: string[]; dataIds: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-household-recaps-reports-validation', withUserId(params));
    return response.data;
  },

  validatePcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/pcime-newborn-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidatePcimneNewbornReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-pcime-newborn-reports-validation', withUserId(params));
    return response.data;
  },

  validateChwsRecoReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/chws-reco-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateChwsRecoReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-chws-reco-reports-validation', withUserId(params));
    return response.data;
  },

  validateRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/reco-meg-situation-reports-validation', withUserId(params));
    return response.data;
  },

  cancelValidateRecoMegSituationReports: async (params: { months: string[]; year: number; recos: string[] }) => {
    const response = await axiosInstance.post<ApiResponse>('/reports/cancel-reco-meg-situation-reports-validation', withUserId(params));
    return response.data;
  },
};

// ============================================
// DASHBOARDS API
// ============================================
export const DashboardsApi = {
  getRecoVaccinationNotDone: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-vaccination-not-done-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoVaccinationPartialDone: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-vaccination-partial-done-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoVaccinationAllDone: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-vaccination-all-done-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoPerformance: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-performance-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getActiveReco: async (params: { year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/active-reco-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },

  getRecoTasksState: async (params: { start_date: string; end_date: string; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/dashboards/reco-tasks-state-dashboards', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },
};

// ============================================
// MAPS API
// ============================================
export const MapsApi = {
  getRecoDataMaps: async (params: { months: string[]; year: number; recos: string[]; sync?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/maps/reco-data-maps', withUserId({ ...params, sync: params.sync ?? false }));
    return response.data;
  },
};

// ============================================
// ORG UNITS API
// ============================================
export const OrgUnitsApi = {
  getCountries: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/countries', withUserId(params || {}));
    return response.data;
  },

  getRegions: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/regions', withUserId(params || {}));
    return response.data;
  },

  getPrefectures: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/prefectures', withUserId(params || {}));
    return response.data;
  },

  getCommunes: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/communes', withUserId(params || {}));
    return response.data;
  },

  getHospitals: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/hospitals', withUserId(params || {}));
    return response.data;
  },

  getDistrictQuartiers: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/district-quartiers', withUserId(params || {}));
    return response.data;
  },

  getVillageSecteurs: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/village-secteurs', withUserId(params || {}));
    return response.data;
  },

  getFamilies: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/families', withUserId(params || {}));
    return response.data;
  },

  getChws: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/chws', withUserId(params || {}));
    return response.data;
  },

  getRecos: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/recos', withUserId(params || {}));
    return response.data;
  },

  getPatients: async (params?: Record<string, unknown>) => {
    const response = await axiosInstance.post<ApiResponse>('/org-units/patients', withUserId(params || {}));
    return response.data;
  },
};

// ============================================
// DATABASE API
// ============================================
export const DatabaseApi = {
  getDataToDeleteFromCouchDb: async (params: { cible: string[]; start_date: string; end_date: string; type: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/list-data-to-delete', withUserId(params));
    return response.data;
  },

  deleteDataFromCouchDb: async (data: { _deleted: boolean; _id: string; _rev: string; _table: string }[], typeOfData: string) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/detele-data', withUserId({ data_to_delete: data, type: typeOfData }));
    return response.data;
  },

  updateUserFacilityContactPlace: async (params: { contact: string; parent: string; new_parent: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/update-user-facility-contact-place', withUserId(params));
    return response.data;
  },

  getDatabaseEntities: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/entities', withUserId({}));
    return response.data;
  },

  truncateDatabase: async (params: { procide: boolean; entities: { name: string; table: string }[]; action: 'TRUNCATE' | 'DROP' }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/truncate', withUserId(params));
    return response.data;
  },
};

// ============================================
// DHIS2 API
// ============================================
interface Dhis2Params {
  username: string;
  password: string;
  data: unknown;
  period: string;
  months: string[];
  year: number;
  recos: string[];
  orgunit: string;
}

export const Dhis2Api = {
  sendChwsRecoReports: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/monthly-activity', withUserId(params));
    return response.data;
  },

  sendFamilyPlanningActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/family-planning-activity', withUserId(params));
    return response.data;
  },

  sendHouseholdActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/household-activity', withUserId(params));
    return response.data;
  },

  sendMorbidityActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/morbidity-activity', withUserId(params));
    return response.data;
  },

  sendPcimneNewbornActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/pcimne-newborn-activity', withUserId(params));
    return response.data;
  },

  sendPromotionActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/promotional-activity', withUserId(params));
    return response.data;
  },

  sendRecoMegSituationActivities: async (params: Dhis2Params) => {
    const response = await axiosInstance.post<ApiResponse>('/dhis2/send/reco-meg-situation-activity', withUserId(params));
    return response.data;
  },
};

// ============================================
// SMS API
// ============================================
export const SmsApi = {
  sendSms: async (params: { phoneNumbers: string[]; message: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/sms/send-sms', withUserId(params));
    return response.data;
  },

  sendCustomSms: async (params: { phone: string; message: string }[]) => {
    const response = await axiosInstance.post<ApiResponse>('/sms/send-coustom-sms', withUserId({ phoneNumbersMessage: params }));
    return response.data;
  },
};

// ============================================
// CONFIG API
// ============================================
export const ConfigApi = {
  getConfigs: async () => {
    const response = await axiosInstance.post<ApiResponse>('/configs', withUserId({ noLogData: true }));
    return response.data;
  },

  getAppVersion: async () => {
    const response = await axiosInstance.post<ApiResponse>('/configs/version', withUserId({ noLogData: true }));
    return response.data;
  },
};

// ============================================
// SQL MIGRATIONS API
// ============================================
export const MigrationsApi = {
  getAllMigrations: async () => {
    const response = await axiosInstance.post<ApiResponse>('/sql/getall', withUserId({}));
    return response.data;
  },

  runAllMigrations: async (runAllMigrations = true) => {
    const response = await axiosInstance.post<ApiResponse>('/sql/runall', withUserId({ runAllMigrations }));
    return response.data;
  },

  getOneMigration: async (migrationName: string) => {
    const response = await axiosInstance.post<ApiResponse>('/sql/getone', withUserId({ migrationName }));
    return response.data;
  },

  runOneMigration: async (migrationName: string, runOneMigrations = true) => {
    const response = await axiosInstance.post<ApiResponse>('/sql/runone', withUserId({ migrationName, runOneMigrations }));
    return response.data;
  },
};

// ============================================
// SURVEY API
// ============================================
export const SurveyApi = {
  saveSurvey: async (survey: unknown) => {
    const response = await axiosInstance.post<ApiResponse>('/survey/save', { survey, userId: null });
    return response.data;
  },

  getAverages: async () => {
    const response = await axiosInstance.post<ApiResponse>('/survey/get-averages', { userId: null });
    return response.data;
  },
};

// ============================================
// ADMIN API
// ============================================
export const AdminApi = {
  // API Token Management
  getApiTokens: async () => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/api-access-key', withUserId({ action: 'list' }));
    return response.data;
  },

  manageApiToken: async (params: { action: string; id?: string; token?: string; isActive?: boolean }) => {
    const response = await axiosInstance.post<ApiResponse>('/auth-user/api-access-key', withUserId(params));
    return response.data;
  },

  // Database Management
  syncDatabase: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/sync', withUserId({}));
    return response.data;
  },

  rebuildIndexes: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/rebuild-indexes', withUserId({}));
    return response.data;
  },

  vacuumDatabase: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/vacuum', withUserId({}));
    return response.data;
  },

  checkDatabaseHealth: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/health', withUserId({}));
    return response.data;
  },

  // CouchDB Data Management
  getDataToDeleteFromCouchDb: async (params: { cible: string[]; start_date: string; end_date: string; type: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/list-data-to-delete', withUserId(params));
    return response.data;
  },

  deleteDataFromCouchDb: async (data: { _deleted: boolean; _id: string; _rev: string; _table: string }[], typeOfData: string) => {
    const response = await axiosInstance.post<ApiResponse>('/database/couchdb/detele-data', withUserId({ data_to_delete: data, type: typeOfData }));
    return response.data;
  },

  // Database Entities Management
  getDatabaseEntities: async () => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/entities', withUserId({}));
    return response.data;
  },

  truncateDatabase: async (params: { procide: boolean; entities: { name: string; table: string }[]; action: 'TRUNCATE' | 'DROP' }) => {
    const response = await axiosInstance.post<ApiResponse>('/database/postgres/truncate', withUserId(params));
    return response.data;
  },

  // PDF Generator
  generatePdf: async (params: { templateId: string; config: Record<string, unknown> }) => {
    const response = await axiosInstance.post<ApiResponse>('/admin/generate-pdf', withUserId(params));
    return response.data;
  },

  // Signature Management
  getSignatures: async () => {
    const response = await axiosInstance.post<ApiResponse>('/admin/signatures', withUserId({ action: 'list' }));
    return response.data;
  },

  saveSignature: async (params: { name: string; dataUrl: string }) => {
    const response = await axiosInstance.post<ApiResponse>('/admin/signatures', withUserId({ action: 'create', ...params }));
    return response.data;
  },

  deleteSignature: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>('/admin/signatures', withUserId({ action: 'delete', id }));
    return response.data;
  },
};

// ============================================
// EXPORT ALL APIs
// ============================================
export const Api = {
  auth: AuthApi,
  reports: ReportsApi,
  dashboards: DashboardsApi,
  maps: MapsApi,
  orgUnits: OrgUnitsApi,
  database: DatabaseApi,
  dhis2: Dhis2Api,
  sms: SmsApi,
  config: ConfigApi,
  migrations: MigrationsApi,
  survey: SurveyApi,
  admin: AdminApi,
};

export default Api;
