/** Single admin menu entry. */
export interface MenuItemDefinition {
  key: string;
  label: string;
  path: string;
  /** Optional nested items (e.g. objects group). */
  children?: MenuItemDefinition[];
}

/** Module export: routes and menu items. */
export interface AdminModuleDefinition {
  routes: import('react-router-dom').RouteObject[];
  menuItems: MenuItemDefinition[];
}

/** Top-level admin section title. */
export const ADMIN_SECTION_TITLE = 'Администрирование';
