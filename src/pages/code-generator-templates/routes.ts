import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const codeGeneratorTemplatesRoutes = [
  createAdminRoute(
    'objects/code-generator-templates',
    () => import('./ui/CodeGeneratorTemplatesPage'),
  ),
];

export const codeGeneratorTemplatesMenuItems = [
  createMenuItem(
    'code-generator-templates',
    'Генераторы кодов',
    'objects/code-generator-templates',
  ),
];
