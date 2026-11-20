import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const parametersRoutes = [
  createAdminRoute('parameters', () => import('./ui/ParametersPage')),
];

export const parametersMenuItems = [
  createMenuItem('parameters', 'Параметры', 'parameters'),
];
