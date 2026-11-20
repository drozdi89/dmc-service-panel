import { Navigate, type RouteObject } from 'react-router-dom';
import { AdminShell } from './AdminShell';
import { adminModuleRoutes } from './menuRegistry';
import { PlaceholderPage } from '@/shared/ui/PlaceholderPage';

/** Root application routes with admin shell and lazy module pages. */
export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/admin/parameters" replace />,
  },
  {
    path: '/admin',
    element: <AdminShell />,
    children: [
      {
        index: true,
        element: <Navigate to="parameters" replace />,
      },
      ...adminModuleRoutes,
      {
        path: '*',
        element: <PlaceholderPage title="Страница не найдена" />,
      },
    ],
  },
];
