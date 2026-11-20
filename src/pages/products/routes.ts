import { createAdminRoute, createMenuItem } from '@/shared/lib/admin-routing';

export const productsRoutes = [
  createAdminRoute('objects/products', () => import('./ui/ProductsPage')),
];

export const productsMenuItems = [
  createMenuItem('products', 'Продукция', 'objects/products'),
];
