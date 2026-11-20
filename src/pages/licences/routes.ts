import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const licencesRoutes = [
  createAdminRoute('licences', () => import('./ui/LicencesPage')),
];

export const licencesMenuItems = [
  createMenuItem('licences', 'Лицензии', 'licences'),
];
