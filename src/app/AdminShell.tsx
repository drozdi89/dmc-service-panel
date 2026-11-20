import { AdminLayout } from '@/layouts/admin-layout';
import { ADMIN_SECTION_TITLE, adminMenuItems } from './menuRegistry';

/** Wires app menu registry into the admin layout shell. */
export function AdminShell() {
  return (
    <AdminLayout menuItems={adminMenuItems} sectionTitle={ADMIN_SECTION_TITLE} />
  );
}
