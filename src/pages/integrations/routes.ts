import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const integrationsRoutes = [
  createAdminRoute('integrations', () => import('./ui/IntegrationsPage')),
];

export const integrationsMenuItems = [
  createMenuItem('integrations', 'Интеграции', 'integrations'),
];
