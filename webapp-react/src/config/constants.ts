// Application constants

export const APP_NAME = 'Kendeya Analytics';
export const APP_VERSION = '1.0.0';

// API
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const API_TIMEOUT = 30000;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'kendeya_token',
  REFRESH_TOKEN: 'kendeya_refresh_token',
  USER: 'kendeya_user',
  THEME: 'kendeya_theme',
  SIDEBAR_COLLAPSED: 'kendeya_sidebar_collapsed',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const MONTH_YEAR_FORMAT = 'MMMM yyyy';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auths/login',
  CHANGE_PASSWORD: '/auths/change-default-password',
  REPORTS: '/reports',
  DASHBOARDS: '/dashboards',
  DASHBOARDS_MONTHLY: '/dashboards/monthly',
  DASHBOARDS_REALTIME: '/dashboards/realtime',
  MAPS: '/maps',
  USERS: '/users',
  USERS_LIST: '/users/list',
  USERS_ROLES: '/users/roles',
  ADMIN: '/administration',
  DOCUMENTATION: '/documentations',
  ERROR_401: '/errors/401',
  ERROR_404: '/errors/404',
  ERROR_500: '/errors/500',
} as const;

// Toast/Alert durations (ms)
export const ALERT_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
} as const;
