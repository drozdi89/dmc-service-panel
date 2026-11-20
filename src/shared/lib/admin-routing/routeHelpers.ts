import { createElement, lazy, type ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';

import { adminPath } from './paths';
import type { MenuItemDefinition } from './types';

/**
 * Creates a lazy route definition for an admin module page.
 *
 * @param path - Relative path under `/admin`.
 * @param importer - Dynamic import of the page component.
 */
export function createAdminRoute(
  path: string,
  importer: () => Promise<{ default: ComponentType }>,
): RouteObject {
  const Page = lazy(importer);
  return { path, element: createElement(Page) };
}

/**
 * Creates a menu item for the admin sidebar.
 *
 * @param key - Unique menu key.
 * @param label - Visible label.
 * @param pathSegment - Path segment under `/admin`.
 */
export function createMenuItem(
  key: string,
  label: string,
  pathSegment: string,
): MenuItemDefinition {
  return { key, label, path: adminPath(pathSegment) };
}
