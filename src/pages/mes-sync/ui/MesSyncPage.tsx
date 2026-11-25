import { MesSyncSettingsPanel } from '@/features/mes-sync-settings';
import { Space, Typography } from 'antd';

/**
 * MES Sync central admin — credentials for edge DataManager.
 *
 * Desktop parity: Service Panel tab driven by `mes_sync_settings.py`.
 */
export default function MesSyncPage() {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        MES Sync
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Управление идентификатором сервера и Service token для узлов DataManager.
      </Typography.Paragraph>
      <MesSyncSettingsPanel />
    </Space>
  );
}
