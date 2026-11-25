import {
  useEnsureMesSyncServerNodeId,
  useMesSyncBindingActions,
  useMesSyncBindingsQuery,
  useNotifyCredentialsQuery,
  type CreateMesSyncBindingPayload,
  type MesSyncBinding,
  type MesSyncBindingCreated,
} from '@/entities/mes-sync';
import { QueryStateBoundary } from '@/shared/ui/loading';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { CopyOnceTokenModal } from './CopyOnceTokenModal';
import { CreateBindingModal } from './CreateBindingModal';
import { EditBindingLinesModal } from './EditBindingLinesModal';

function fingerprintSuffix(fingerprint: string): string {
  if (!fingerprint) {
    return '—';
  }
  return `…${fingerprint.slice(-8)}`;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Central MES Sync administration for DataManager Service tokens.
 *
 * Desktop parity: `apps/service_panel/mes_sync_settings.py`
 * (tokens are pasted into DataManager → «Обмен MES»).
 */
export function MesSyncSettingsPanel() {
  const { serverNodeId, isLoading: serverLoading, error: serverError } =
    useEnsureMesSyncServerNodeId();
  const bindingsQuery = useMesSyncBindingsQuery();
  const notifyQuery = useNotifyCredentialsQuery();
  const {
    createBinding,
    updateLines,
    rotateBinding,
    confirmRevoke,
    copyToken,
    isCreating,
    isUpdatingLines,
    isRotating,
  } = useMesSyncBindingActions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editBinding, setEditBinding] = useState<MesSyncBinding | null>(null);
  const [tokenResult, setTokenResult] = useState<MesSyncBindingCreated | null>(null);

  const columns = useMemo<ColumnsType<MesSyncBinding>>(
    () => [
      { title: 'Метка', dataIndex: 'label', key: 'label', ellipsis: true },
      {
        title: 'node_id',
        dataIndex: 'node_id',
        key: 'node_id',
        ellipsis: true,
        width: 280,
      },
      {
        title: 'Линии',
        dataIndex: 'line_ids',
        key: 'line_ids',
        render: (ids: number[]) => (ids ?? []).join(', ') || '—',
      },
      {
        title: 'Создана',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 150,
        render: (value: string) => formatCreatedAt(value),
      },
      {
        title: 'Токен',
        dataIndex: 'fingerprint',
        key: 'fingerprint',
        width: 110,
        render: (value: string) => fingerprintSuffix(value),
      },
      {
        title: 'Статус',
        key: 'status',
        width: 110,
        render: (_, row) =>
          row.is_active ? <Tag color="success">Активна</Tag> : <Tag>Отозвана</Tag>,
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 280,
        render: (_, row) =>
          row.is_active ? (
            <Space size="small" wrap>
              <Button type="link" size="small" onClick={() => setEditBinding(row)}>
                Линии
              </Button>
              <Button
                type="link"
                size="small"
                loading={isRotating}
                onClick={() => {
                  void rotateBinding(row.id).then((created) => {
                    if (created) {
                      setTokenResult(created);
                    }
                  });
                }}
              >
                Ротация
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => confirmRevoke(row.id, row.label)}
              >
                Отозвать
              </Button>
            </Space>
          ) : null,
      },
    ],
    [confirmRevoke, isRotating, rotateBinding],
  );

  const handleCreate = async (payload: CreateMesSyncBindingPayload) => {
    const created = await createBinding(payload);
    if (created) {
      setCreateOpen(false);
      setTokenResult(created);
    }
  };

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Идентификатор сервера (server_node_id)" size="small">
        <QueryStateBoundary
          loading={serverLoading}
          error={serverError}
          errorTitle="Не удалось загрузить server_node_id"
        >
          <Typography.Text code copyable={Boolean(serverNodeId)}>
            {serverNodeId || '—'}
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            Устойчивый UUID центрального узла MES Sync. Создаётся автоматически при первом
            открытии, если ещё не задан.
          </Typography.Paragraph>
        </QueryStateBoundary>
      </Card>

      <Card title="Notify (WebSocket)" size="small">
        <QueryStateBoundary
          loading={notifyQuery.isLoading}
          error={notifyQuery.error}
          errorTitle="Не удалось загрузить notify credentials"
        >
          <Space orientation="vertical" size="small">
            <Typography.Text>
              Signing secret:{' '}
              {notifyQuery.data?.auth_configured ? (
                <Tag color="success">настроен</Tag>
              ) : (
                <Tag color="warning">не настроен</Tag>
              )}
            </Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Ротация глобального notify_token выполняется только в desktop Service Panel
              (запись в srv_cfg.ini). В веб-админке доступен только просмотр статуса.
            </Typography.Paragraph>
          </Space>
        </QueryStateBoundary>
      </Card>

      <Card
        title="Привязки DataManager (Service token)"
        size="small"
        extra={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Создать привязку
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          Создайте привязку и один раз скопируйте Service token в DataManager на линии (раздел
          «Обмен MES»).
        </Typography.Paragraph>
        <QueryStateBoundary
          loading={bindingsQuery.isLoading}
          error={bindingsQuery.error}
          errorTitle="Не удалось загрузить привязки"
        >
          <Table<MesSyncBinding>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={bindingsQuery.data ?? []}
            pagination={false}
          />
        </QueryStateBoundary>
      </Card>

      <CreateBindingModal
        open={createOpen}
        confirming={isCreating}
        onCancel={() => setCreateOpen(false)}
        onSubmit={(payload) => void handleCreate(payload)}
      />

      <EditBindingLinesModal
        open={Boolean(editBinding)}
        binding={editBinding}
        confirming={isUpdatingLines}
        onCancel={() => setEditBinding(null)}
        onSubmit={(lineIds) => {
          if (!editBinding) {
            return;
          }
          updateLines(editBinding.id, { line_ids: lineIds });
          setEditBinding(null);
        }}
      />

      <CopyOnceTokenModal
        open={Boolean(tokenResult)}
        token={tokenResult?.token ?? null}
        onCopy={(token) => void copyToken(token)}
        onClose={() => setTokenResult(null)}
      />
    </Space>
  );
}
