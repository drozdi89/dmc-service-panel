import { adminPath, createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';
import { createElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

const linesListPath = adminPath('objects/lines');

export const linesRoutes: RouteObject[] = [
  createAdminRoute('objects/lines', () => import('./ui/LinesListPage')),
  {
    path: 'objects/lines/new',
    element: createElement(Navigate, { to: linesListPath, replace: true }),
  },
  {
    path: 'objects/lines/:id',
    element: createElement(Navigate, { to: linesListPath, replace: true }),
  },
];

export const linesMenuItems = [
  createMenuItem('lines', 'Линии производства', 'objects/lines'),
];
