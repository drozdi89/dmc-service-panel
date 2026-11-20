import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const templatesRoutes = [
  createAdminRoute('objects/templates', () => import('./ui/TemplatesPage')),
];

export const templatesMenuItems = [
  createMenuItem('templates', 'Шаблоны этикеток', 'objects/templates'),
];
