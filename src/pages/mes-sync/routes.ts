import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const mesSyncRoutes = [
  createAdminRoute('mes-sync', () => import('./ui/MesSyncPage')),
];

export const mesSyncMenuItems = [
  createMenuItem('mes-sync', 'MES Sync', 'mes-sync'),
];
