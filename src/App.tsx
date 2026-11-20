import { CodeGeneratorTemplateFormModalHost } from '@/widgets/code-generator-template';
import { DeviceFormModalHost } from '@/widgets/device';
import { LineFormModalHost } from '@/widgets/line';
import { PrintStationFormModalHost } from '@/widgets/print-station';
import { ProductFormModalHost } from '@/widgets/product';
import { TemplateFormModalHost } from '@/widgets/template';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';
import { useRoutes } from 'react-router-dom';
import { appRoutes } from './app/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Root application component with providers and router. */
export function App() {
  const routes = useRoutes(appRoutes);
  return routes;
}

/**
 * Application providers wrapper.
 *
 * Mounts each objects CRUD `*FormModalHost` once (template, device, product,
 * print-station, code-generator-template, line). Pages only dispatch entity
 * FormUiStores — do not remount Hosts on list pages.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ruRU}>
        <AntApp>
          {children}
          <TemplateFormModalHost />
          <DeviceFormModalHost />
          <ProductFormModalHost />
          <PrintStationFormModalHost />
          <CodeGeneratorTemplateFormModalHost />
          <LineFormModalHost />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
