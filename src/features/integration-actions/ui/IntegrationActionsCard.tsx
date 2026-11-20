import { Button, Card, Space } from 'antd';

/** Drawer keys opened from the integrations actions card. */
export type IntegrationDrawerKey =
  | 'datamark'
  | 'utrace'
  | 'autoorder'
  | 'autosend'
  | 'crpt-templates'
  | 'line-task-types'
  | 'one-c-exchange'
  | 'wms-efko';

/** Props for integration action buttons card. */
export interface IntegrationActionsCardProps {
  onOpen: (key: IntegrationDrawerKey) => void;
}

const ACTIONS: Array<{ key: IntegrationDrawerKey; label: string }> = [
  { key: 'datamark', label: 'Настройки интеграции DataMark (Электронный Знак)' },
  { key: 'utrace', label: 'Настройки интеграции UTrace' },
  { key: 'one-c-exchange', label: 'Настройка обмена с 1С' },
  { key: 'wms-efko', label: 'Интеграция с WMS (ЭФКО)' },
  { key: 'autoorder', label: 'Настройка параметров автозаказа…' },
  { key: 'autosend', label: 'Настройка автоотправки документов…' },
  { key: 'crpt-templates', label: 'Групповая корректировка шаблона КМ…' },
  { key: 'line-task-types', label: 'Групповая настройка типа задания по линиям…' },
];

/**
 * Card with buttons opening integration settings drawers (Qt tab_crpt parity).
 */
export function IntegrationActionsCard({ onOpen }: IntegrationActionsCardProps) {
  return (
    <Card title="Интеграции и автоматизация">
      <Space orientation="vertical" style={{ width: '100%' }}>
        {ACTIONS.map((action) => (
          <Button key={action.key} block onClick={() => onOpen(action.key)}>
            {action.label}
          </Button>
        ))}
      </Space>
    </Card>
  );
}
