import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const printStationsRoutes = [
  createAdminRoute('objects/print-stations', () => import('./ui/PrintStationsPage')),
];

export const printStationsMenuItems = [
  createMenuItem('print-stations', 'Станции печати', 'objects/print-stations'),
];
