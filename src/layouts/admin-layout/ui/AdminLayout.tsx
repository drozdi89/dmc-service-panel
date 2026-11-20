import { ADMIN_BASE_PATH, type MenuItemDefinition } from '@/shared/lib/admin-routing';
import { Template } from '@/shared/model';
import { PageSpinner } from '@/shared/ui/loading';
import {
  AppstoreOutlined,
  ClusterOutlined,
  FileTextOutlined,
  LinkOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  SettingOutlined,
  TabletOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Typography } from 'antd';
import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MENU_ICONS: Record<string, ReactNode> = {
  parameters: <SettingOutlined />,
  integrations: <LinkOutlined />,
  products: <TagsOutlined />,
  devices: <TabletOutlined />,
  templates: <FileTextOutlined />,
  'code-generator-templates': <QrcodeOutlined />,
  lines: <ClusterOutlined />,
  'print-stations': <PrinterOutlined />,
  licences: <AppstoreOutlined />,
};

/** Props for the admin shell layout. */
export interface AdminLayoutProps {
  /** Sidebar menu tree. */
  menuItems: MenuItemDefinition[];
  /** Title shown above the sidebar menu. */
  sectionTitle: string;
}

/**
 * Converts declarative menu definitions to Ant Design menu items.
 *
 * @param items - Menu definitions from module registry.
 */
function toAntMenuItems(items: MenuItemDefinition[]): MenuProps['items'] {
  return items.map((item) => ({
    key: item.path,
    icon: MENU_ICONS[item.key],
    label: item.label,
    children: item.children ? toAntMenuItems(item.children) : undefined,
  }));
}

/**
 * Flattens menu paths for active key detection.
 *
 * @param items - Menu tree.
 */
function flattenMenuPaths(items: MenuItemDefinition[]): string[] {
  return items.flatMap((item) => [
    item.path,
    ...(item.children ? flattenMenuPaths(item.children) : []),
  ]);
}

import {
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Button } from 'antd';
import { Footer } from 'antd/es/layout/layout';

/** Admin shell with sidebar navigation and lazy route outlet. */
export function AdminLayout({ menuItems, sectionTitle }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const antMenuItems = useMemo(() => toAntMenuItems(menuItems), [menuItems]);

  const selectedKeys = useMemo(() => {
    const flatPaths = flattenMenuPaths(menuItems);
    const match = flatPaths.find(
      (path) =>
        location.pathname === path ||
        (path !== ADMIN_BASE_PATH && location.pathname.startsWith(`${path}/`)),
    );
    return match ? [match] : [location.pathname];
  }, [location.pathname, menuItems]);

  return (
    <Layout style={{ height: '100vh', margin: -8 }}>
      <Sider breakpoint="lg" collapsedWidth={64} width={260} collapsed={collapsed} onCollapse={setCollapsed}>
        {!collapsed && <div style={{ padding: '16px 12px' }}>
          <Typography.Title level={5} style={{ color: '#fff', margin: 0 }}>
            {sectionTitle}
          </Typography.Title>
        </div>}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={antMenuItems}
          aria-label="Разделы администрирования"
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', height: 48, lineHeight: '48px' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 32,
              height: 32,
              marginInlineStart: -16,
            }}
          />
          <Template.Slot name="title" level={3} type="secondary" style={{ margin: 0, display: 'inline-block' }}>
            <Typography.Title>Service Panel Web UI</Typography.Title>
          </Template.Slot>
          <Template.Slot name="header" style={{ float: 'right' }}></Template.Slot>
        </Header>
        <Content
          role="main"
          aria-label="Содержимое раздела"
          style={{ padding: '0 1rem 1rem', overflow: 'auto', position: 'relative' }}
        >
          <Suspense fallback={<PageSpinner tip="Загрузка страницы…" />}>
            <Outlet />
          </Suspense>
        </Content>
        <Template.Has name="footer">
          <Footer style={{ padding: 0, background: '#fff', borderTop: '1px solid #e8e8e8', boxShadow: '0 -1px 10px 0 rgba(0, 0, 0, 0.15)', zIndex: 1000 }}>
            <Template.Slot name="footer" style={{ padding: '12px 16px' }} />
          </Footer>
        </Template.Has>
      </Layout>
    </Layout>
  );
}
