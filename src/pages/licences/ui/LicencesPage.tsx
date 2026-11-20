import {
  CLIENTS_QUERY_ENTRY,
  REGISTERED_CLIENTS_QUERY_KEY,
  daysUntil,
  decodePcData,
  deleteClients,
  fetchClients,
  fetchMactPersonalAccount,
  formatDate,
  formatDateTime,
  formatSubscriptionText,
  refreshMactLicences,
  refreshMactSubscription,
  unregisterClientLicense,
  useRegisteredClientsQuery,
  type DmcClient,
  type MactLicenceList,
} from '@/entities/licence';
import { HardwareInfoModal } from '@/features/licence-hardware-info';
import { LicenceMactSummaryCard } from '@/features/licence-mact-summary';
import { RegisterLicenceModal } from '@/features/licence-register';
import { useIdempotentMutation } from '@/shared/hooks';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const idempotentMutation = useIdempotentMutation();

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
  const [refreshingClients, setRefreshingClients] = useState(false);
  const [unregisteringId, setUnregisteringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const registeredQuery = useRegisteredClientsQuery();

  const licenceByClientId = useMemo(() => {
    const map = new Map<string, { licence_key: string; valid_until: string | null }>();
    for (const row of registeredQuery.data ?? []) {
      if (row.licence_key) {
        map.set(row.client_id, {
          licence_key: row.licence_key,
          valid_until: row.valid_until,
        });
      }
    }
    return map;
  }, [registeredQuery.data]);

  const availableLicences = useMemo(
    () => mactSnapshot?.available ?? [],
    [mactSnapshot],
  );

  const mactRefreshMutation = useMutation({
    mutationFn: async () => {
      const [licences, subscription, account] = await Promise.all([
        refreshMactLicences(50),
        refreshMactSubscription(),
        fetchMactPersonalAccount(),
      ]);
      return { licences, subscription, account };
    },
    onSuccess: ({ licences, subscription, account }) => {
      setMactSnapshot(licences);
      setSubscriptionText(formatSubscriptionText(subscription));
      setPersonalAccountUrl(account.url || null);
      void queryClient.invalidateQueries({ queryKey: REGISTERED_CLIENTS_QUERY_KEY });
      message.success('Данные лицензирования обновлены');
    },
    onError: (error: Error) => {
      setMactSnapshot(null);
      setSubscriptionText('Данные о подписке недоступны..');
      setPersonalAccountUrl(null);
      message.error(error.message || 'Ошибка обновления лицензий MACT');
    },
  });

  const refreshClientsList = useCallback(async () => {
    setRefreshingClients(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: CLIENTS_QUERY_ENTRY }),
        queryClient.refetchQueries({ queryKey: REGISTERED_CLIENTS_QUERY_KEY }),
      ]);
      message.success('Список клиентов обновлён');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Ошибка обновления списка клиентов',
      );
    } finally {
      setRefreshingClients(false);
    }
  }, [queryClient]);

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

  const handleRegister = useCallback(async () => {
    if (!registerClientId || !selectedLicencePin) {
      return;
    }
    const licence = availableLicences.find((item) => item.pin === selectedLicencePin);
    if (!licence) {
      message.error('Выберите лицензию');
      return;
    }
    try {
      await idempotentMutation.mutateAsync({
        path: '/api/v2/client_licencing/register',
        method: 'POST',
        body: {
          client_id: registerClientId,
          licence_key: licence.pin,
          valid_until: licence.valid_until,
        },
      });
      setRegisterModalOpen(false);
      setRegisterClientId(null);
      setSelectedLicencePin(null);
      message.success('Лицензия привязана');
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_ENTRY });
      void queryClient.invalidateQueries({ queryKey: REGISTERED_CLIENTS_QUERY_KEY });
      mactRefreshMutation.mutate();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Ошибка привязки лицензии');
    }
  }, [
    registerClientId,
    selectedLicencePin,
    availableLicences,
    idempotentMutation,
    queryClient,
    mactRefreshMutation,
  ]);

  const handleUnregister = useCallback(
    async (clientId: string) => {
      setUnregisteringId(clientId);
      try {
        await unregisterClientLicense(clientId);
        message.success('Лицензия отвязана');
        void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_ENTRY });
        void queryClient.invalidateQueries({ queryKey: REGISTERED_CLIENTS_QUERY_KEY });
        mactRefreshMutation.mutate();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Ошибка отвязки лицензии');
      } finally {
        setUnregisteringId(null);
      }
    },
    [queryClient, mactRefreshMutation],
  );

  const handleDeleteClient = useCallback(
    async (clientId: string) => {
      setDeletingId(clientId);
      try {
        await deleteClients([clientId]);
        message.success('Клиент удалён');
        void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_ENTRY });
        void queryClient.invalidateQueries({ queryKey: REGISTERED_CLIENTS_QUERY_KEY });
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Ошибка удаления клиента');
      } finally {
        setDeletingId(null);
      }
    },
    [queryClient],
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
                  onConfirm={() => void handleUnregister(record.id)}
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
                onConfirm={() => void handleDeleteClient(record.id)}
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
              loading={refreshingClients}
              onClick={() => void refreshClientsList()}
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
        confirmLoading={idempotentMutation.isPending}
        onSelectedLicencePinChange={setSelectedLicencePin}
        onCancel={() => {
          setRegisterModalOpen(false);
          setRegisterClientId(null);
          setSelectedLicencePin(null);
        }}
        onRegister={() => void handleRegister()}
      />
    </Space>
  );
}
