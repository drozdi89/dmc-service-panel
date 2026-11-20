import {
  CLIENTS_QUERY_ENTRY,
  daysUntil,
  decodePcData,
  fetchClients,
  formatDate,
  formatDateTime,
  formatSubscriptionText,
  useDeleteClientMutation,
  useRefetchClientsMutation,
  useRefreshMactMutation,
  useRegisterClientLicenceMutation,
  useRegisteredClientsQuery,
  useUnregisterClientLicenceMutation,
  type DmcClient,
  type MactLicenceList,
} from '@/entities/licence';
import { HardwareInfoModal } from '@/features/licence-hardware-info';
import { LicenceMactSummaryCard } from '@/features/licence-mact-summary';
import { RegisterLicenceModal } from '@/features/licence-register';
import { Template } from '@/shared/model';
import { ButtonLoading } from '@/shared/ui/loading';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import {
  CloudSyncOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Popconfirm,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

/**
 * Licences administration: DMC clients list and MACT licence refresh (Qt `tab_licences` parity).
 */
export default function LicencesPage() {
  const [mactSnapshot, setMactSnapshot] = useState<MactLicenceList | null>(null);
  const [subscriptionText, setSubscriptionText] = useState<string>(
    'Данные о подписке недоступны..',
  );
  const [personalAccountUrl, setPersonalAccountUrl] = useState<string | null>(null);

  const [hwModalOpen, setHwModalOpen] = useState(false);
  const [hwModalText, setHwModalText] = useState('');

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerClientId, setRegisterClientId] = useState<string | null>(null);
  const [selectedLicencePin, setSelectedLicencePin] = useState<string | null>(null);
  const registeredQuery = useRegisteredClientsQuery();

  const licenceByClientId = useMemo(() => {
    const map = new Map<string, { licence_key: string; valid_until: string | null }>();
    for (const row of registeredQuery.data ?? []) {
      if (row.licence_key) {
        map.set(row.client_id, {
          licence_key: row.licence_key,
          valid_until: row.valid_until ?? null,
        });
      }
    }
    return map;
  }, [registeredQuery.data]);

  const availableLicences = useMemo(
    () => mactSnapshot?.available ?? [],
    [mactSnapshot],
  );

  const mactRefreshMutation = useRefreshMactMutation({
    onSuccess: ({ licences, subscription, account }) => {
      setMactSnapshot(licences);
      setSubscriptionText(formatSubscriptionText(subscription));
      setPersonalAccountUrl(account.url || null);
      message.success('Данные лицензирования обновлены');
    },
    onError: (error: Error) => {
      setMactSnapshot(null);
      setSubscriptionText('Данные о подписке недоступны..');
      setPersonalAccountUrl(null);
      message.error(error.message || 'Ошибка обновления лицензий MACT');
    },
  });

  const refetchClientsMutation = useRefetchClientsMutation({
    onSuccess: () => {
      message.success('Список клиентов обновлён');
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка обновления списка клиентов');
    },
  });

  const registerMutation = useRegisterClientLicenceMutation({
    onSuccess: () => {
      setRegisterModalOpen(false);
      setRegisterClientId(null);
      setSelectedLicencePin(null);
      message.success('Лицензия привязана');
      mactRefreshMutation.mutate();
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка привязки лицензии');
    },
  });

  const unregisterMutation = useUnregisterClientLicenceMutation({
    onSuccess: () => {
      message.success('Лицензия отвязана');
      mactRefreshMutation.mutate();
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка отвязки лицензии');
    },
  });
  const unregisteringId = unregisterMutation.isPending ? unregisterMutation.variables : null;

  const deleteClientMutation = useDeleteClientMutation({
    onSuccess: () => {
      message.success('Клиент удалён');
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка удаления клиента');
    },
  });
  const deletingId = deleteClientMutation.isPending ? deleteClientMutation.variables : null;

  const openHwInfo = useCallback((client: DmcClient) => {
    setHwModalText(decodePcData(client.pc_data));
    setHwModalOpen(true);
  }, []);

  const openRegisterModal = useCallback(
    (clientId: string) => {
      if (availableLicences.length === 0) {
        message.warning(
          'Нет доступных лицензий. Нажмите «Обновить лицензии» для загрузки с MACT.',
        );
        return;
      }
      setRegisterClientId(clientId);
      setSelectedLicencePin(availableLicences[0]?.pin ?? null);
      setRegisterModalOpen(true);
    },
    [availableLicences],
  );

  const handleRegister = useCallback(() => {
    if (!registerClientId || !selectedLicencePin) {
      return;
    }
    const licence = availableLicences.find((item) => item.pin === selectedLicencePin);
    if (!licence) {
      message.error('Выберите лицензию');
      return;
    }
    registerMutation.mutate({
      client_id: registerClientId,
      licence_key: licence.pin,
      valid_until: licence.valid_until,
    });
  }, [registerClientId, selectedLicencePin, availableLicences, registerMutation]);

  const handleUnregister = useCallback(
    (clientId: string) => {
      unregisterMutation.mutate(clientId);
    },
    [unregisterMutation],
  );

  const handleDeleteClient = useCallback(
    (clientId: string) => {
      deleteClientMutation.mutate(clientId);
    },
    [deleteClientMutation],
  );

  const columns = useMemo<ColumnsType<DmcClient>>(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        ellipsis: true,
      },
      {
        title: 'Имя',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: true,
      },
      {
        title: 'Тип',
        dataIndex: 'type',
        key: 'type',
        sorter: true,
      },
      {
        title: 'Версия',
        dataIndex: 'version',
        key: 'version',
        ellipsis: true,
      },
      {
        title: 'Последняя сессия',
        dataIndex: 'last_session',
        key: 'last_session',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: 'Лицензия',
        key: 'licence',
        render: (_value, record) => {
          if (registeredQuery.isLoading) {
            return <Text type="secondary">—</Text>;
          }
          const lic = licenceByClientId.get(record.id);
          if (!lic) {
            return <Tag color="error">Нет лицензии</Tag>;
          }
          const days = daysUntil(lic.valid_until);
          return (
            <Space direction="vertical" size={0}>
              <Tag color="success">Активна</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                до {formatDate(lic.valid_until)}
                {days !== null ? ` (${days} дн.)` : ''}
              </Text>
            </Space>
          );
        },
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 104,
        render: (_value, record) => {
          const hasLicence = licenceByClientId.has(record.id);
          const isUnregistering = unregisteringId === record.id;
          const isDeleting = deletingId === record.id;
          return (
            <Space size="small" wrap>
              <ButtonLoading
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                aria-label="Информация об оборудовании"
                onClick={() => openHwInfo(record)}
              />
              {hasLicence ? (
                <Popconfirm
                  title={`Отвязать лицензию от клиента ${record.id}?`}
                  okText="Отвязать"
                  cancelText="Отмена"
                  onConfirm={() => handleUnregister(record.id)}
                >
                  <ButtonLoading
                    type="text"
                    size="small"
                    danger
                    loading={isUnregistering}
                    icon={<KeyOutlined />}
                    aria-label="Отвязать лицензию"
                  />
                </Popconfirm>
              ) : (
                <ButtonLoading
                  type="text"
                  size="small"
                  icon={<KeyOutlined />}
                  aria-label="Привязать лицензию"
                  onClick={() => openRegisterModal(record.id)}
                />
              )}
              <Popconfirm
                title={`Удалить запись о клиенте ${record.id}?`}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDeleteClient(record.id)}
              >
                <ButtonLoading
                  type="text"
                  size="small"
                  danger
                  loading={isDeleting}
                  icon={<DeleteOutlined />}
                  aria-label="Удалить клиента"
                />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [
      licenceByClientId,
      registeredQuery.isLoading,
      unregisteringId,
      deletingId,
      openHwInfo,
      openRegisterModal,
      handleUnregister,
      handleDeleteClient,
    ],
  );

  const licenceSummary = mactSnapshot
    ? `Всего: ${mactSnapshot.used.length + mactSnapshot.available.length} | Доступно: ${mactSnapshot.available.length}`
    : '—';

  return (
    <Space direction="vertical" size="medium" style={{ width: '100%', paddingTop: 16 }}>
        <Template.Title>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Лицензии
          </Typography.Title>
        </Template.Title>

      {registeredQuery.error ? (
        <Alert
          type="warning"
          showIcon
          message="Не удалось загрузить статусы лицензий"
          description={registeredQuery.error.message}
        />
      ) : null}

      <LicenceMactSummaryCard
        licenceSummary={licenceSummary}
        subscriptionText={subscriptionText}
        personalAccountUrl={personalAccountUrl}
      />

      <ServerDataTable<DmcClient>
        queryKey={CLIENTS_QUERY_ENTRY}
        fetchFn={fetchClients}
        columns={columns}
        rowKey="id"
        searchPlaceholder="Поиск по ID или имени…"
        scroll={{ x: 1100 }}
        toolbarExtra={
          <Space wrap>
            <ButtonLoading
              icon={<DatabaseOutlined />}
              loading={refetchClientsMutation.isPending}
              onClick={() => refetchClientsMutation.mutate()}
            >
              Обновить клиентов
            </ButtonLoading>
            <ButtonLoading
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={mactRefreshMutation.isPending}
              onClick={() => mactRefreshMutation.mutate()}
            >
              Обновить лицензии
            </ButtonLoading>
          </Space>
        }
      />

      <HardwareInfoModal
        open={hwModalOpen}
        text={hwModalText}
        onClose={() => setHwModalOpen(false)}
      />

      <RegisterLicenceModal
        open={registerModalOpen}
        clientId={registerClientId}
        availableLicences={availableLicences}
        selectedLicencePin={selectedLicencePin}
        confirmLoading={registerMutation.isPending}
        onSelectedLicencePinChange={setSelectedLicencePin}
        onCancel={() => {
          setRegisterModalOpen(false);
          setRegisterClientId(null);
          setSelectedLicencePin(null);
        }}
        onRegister={handleRegister}
      />
    </Space>
  );
}
