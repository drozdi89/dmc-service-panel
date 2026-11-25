import {
  IntegrationActionsCard,
  type IntegrationDrawerKey,
} from '@/features/integration-actions';
import { AutoorderSettingsDrawer } from '@/features/integration-autoorder';
import { AutosendSettingsDrawer } from '@/features/integration-autosend';
import { CrptOrganizationsSection } from '@/features/integration-crpt-organizations';
import { CrptTemplatesDrawer } from '@/features/integration-crpt-templates';
import { DataMarkSettingsDrawer } from '@/features/integration-datamark';
import { LineTaskTypeDrawer } from '@/features/integration-line-task-type';
import { OneCExchangeSettingsDrawer } from '@/features/integration-one-c-exchange';
import { UtraceSettingsDrawer } from '@/features/integration-utrace';
import { WmsEfkoSettingsDrawer } from '@/features/integration-wms-efko';
import { Template } from '@/shared/model';
import { Card, Space, Typography } from 'antd';
import { useState } from 'react';

/**
 * Integrations admin page — CRPT organizations and integration settings drawers.
 */
export default function IntegrationsPage() {
  const [openDrawer, setOpenDrawer] = useState<IntegrationDrawerKey | null>(null);

  return (
    <Space orientation="vertical" size="medium" style={{ width: '100%', paddingTop: '1rem' }}>
      <Template.Title>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Интеграции
        </Typography.Title>
      </Template.Title>

      <Card title="Организации">
        <CrptOrganizationsSection />
      </Card>

      <IntegrationActionsCard onOpen={(key) => setOpenDrawer(key)} />

      {openDrawer === 'datamark' ? (
        <DataMarkSettingsDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'utrace' ? (
        <UtraceSettingsDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'one-c-exchange' ? (
        <OneCExchangeSettingsDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'wms-efko' ? (
        <WmsEfkoSettingsDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'autoorder' ? (
        <AutoorderSettingsDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'autosend' ? (
        <AutosendSettingsDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'crpt-templates' ? (
        <CrptTemplatesDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
      {openDrawer === 'line-task-types' ? (
        <LineTaskTypeDrawer open onClose={() => setOpenDrawer(null)} />
      ) : null}
    </Space>
  );
}
