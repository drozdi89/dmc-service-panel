import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const managerRoutes = [
  createAdminRoute('manager/tasks', () => import('./ui/TasksListPage')),
];

export const managerMenuItems = [
  createMenuItem('manager-tasks', 'Задания', 'manager/tasks'),
];
