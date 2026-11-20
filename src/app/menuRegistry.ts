import { parametersMenuItems, parametersRoutes } from '@/pages/parameters';
import { integrationsMenuItems, integrationsRoutes } from '@/pages/integrations';import { managerMenuItems, managerRoutes } from '@/pages/manager';
import { productsMenuItems, productsRoutes } from '@/pages/products';
import { devicesMenuItems, devicesRoutes } from '@/pages/devices';
import { templatesMenuItems, templatesRoutes } from '@/pages/templates';
import {
  codeGeneratorTemplatesMenuItems,
  codeGeneratorTemplatesRoutes,
} from '@/pages/code-generator-templates';
import { linesMenuItems, linesRoutes } from '@/pages/lines';
import { printStationsMenuItems, printStationsRoutes } from '@/pages/print-stations';
import { licencesMenuItems, licencesRoutes } from '@/pages/licences';
import type { RouteObject } from 'react-router-dom';
import type { MenuItemDefinition } from '@/shared/lib/admin-routing';

export type { AdminModuleDefinition, MenuItemDefinition } from '@/shared/lib/admin-routing';
export { ADMIN_SECTION_TITLE } from '@/shared/lib/admin-routing';
export { ADMIN_BASE_PATH, adminPath } from '@/shared/lib/admin-routing';

/** Aggregated lazy admin routes from all page slices. */
export const adminModuleRoutes: RouteObject[] = [
  ...parametersRoutes,
  ...integrationsRoutes,
  ...managerRoutes,
  ...productsRoutes,
  ...devicesRoutes,
  ...templatesRoutes,
  ...codeGeneratorTemplatesRoutes,
  ...linesRoutes,
  ...printStationsRoutes,
  ...licencesRoutes,
];

/** Aggregated sidebar menu for «Администрирование». */
export const adminMenuItems: MenuItemDefinition[] = [
  ...parametersMenuItems,
  ...integrationsMenuItems,
  ...managerMenuItems,
  ...productsMenuItems,
  ...devicesMenuItems,
  ...templatesMenuItems,
  ...codeGeneratorTemplatesMenuItems,
  ...linesMenuItems,
  ...printStationsMenuItems,
  ...licencesMenuItems,
];
