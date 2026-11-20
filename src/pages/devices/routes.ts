import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const devicesRoutes = [
  createAdminRoute('objects/devices', () => import('./ui/DevicesPage')),
];

export const devicesMenuItems = [
  createMenuItem('devices', 'Устройства', 'objects/devices'),
];
