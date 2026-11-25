import {
  CLIENTS_QUERY_ENTRY,
  daysUntil,
  decodePcData,
  fetchClients,
  filterUnboundLicences,
  formatDate,
  formatDateTime,
  formatSubscriptionText,
  useLicenceActions,
  useMactLicencesQuery,
  useMactPersonalAccountQuery,
  useMactSubscriptionQuery,
  useRegisteredClientsQuery,
  type DmcClient,
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
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Alert, Popconfirm, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

/**
 * Licences administration: DMC clients list and MACT licence refresh (Qt `tab_licences` parity).
 */
export default function LicencesPage() {
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

  // MACT snapshot loads on page open (Qt `refresh_licences` on tab switch).
  const licencesQuery = useMactLicencesQuery();
  const subscriptionQuery = useMactSubscriptionQuery();
  const accountQuery = useMactPersonalAccountQuery();

  const mactSnapshot = licencesQuery.data ?? null;
  // Licences already bound to a client are hidden (client-side filter).
  const availableLicences = useMemo(
    () => filterUnboundLicences(mactSnapshot?.available ?? [], registeredQuery.data ?? []),
    [mactSnapshot, registeredQuery.data],
  );
  const subscriptionText = subscriptionQuery.data
    ? formatSubscriptionText(subscriptionQuery.data)
    : 'Данные о подписке недоступны..';
  const personalAccountUrl = accountQuery.data?.url || null;
  const mactLoadError =
    licencesQuery.error ?? subscriptionQuery.error ?? accountQuery.error ?? null;
  const mactLoading =
    licencesQuery.isFetching || subscriptionQuery.isFetching || accountQuery.isFetching;

  const closeRegisterModal = useCallback(() => {
    setRegisterModalOpen(false);
    setRegisterClientId(null);
    setSelectedLicencePin(null);
  }, []);

  const {
    refreshMact,
    isRefreshingMact,
    refetchClients,
    isRefetchingClients,
    register,
    isRegistering,
    unregister,
    unregisteringId,
    deleteClient,
    deletingId,
    notifyNoAvailableLicences,
  } = useLicenceActions({ onRegistered: closeRegisterModal });

  const openHwInfo = useCallback((client: DmcClient) => {
    setHwModalText(decodePcData(client.pc_data));
    setHwModalOpen(true);
  }, []);

  const openRegisterModal = useCallback(
    (clientId: string) => {
      if (availableLicences.length === 0) {
        notifyNoAvailableLicences({ loading: mactLoading, error: mactLoadError });
        return;
      }
      setRegisterClientId(clientId);
      setSelectedLicencePin(availableLicences[0]?.pin ?? null);
      setRegisterModalOpen(true);
    },
    [availableLicences, mactLoadError, mactLoading, notifyNoAvailableLicences],
  );

  const handleRegister = useCallback(() => {
    if (!registerClientId || !selectedLicencePin) {
      return;
    }
    register(
      registerClientId,
      availableLicences.find((item) => item.pin === selectedLicencePin),
    );
  }, [registerClientId, selectedLicencePin, availableLicences, register]);

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
            <Space orientation="vertical" size={0}>
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
                  onConfirm={() => unregister(record.id)}
                >
                  <ButtonLoading
                    type="text"
                    size="small"
                    danger
                    loading={isUnregistering}
                    icon={<MinusCircleOutlined />}
                    aria-label="Отвязать лицензию"
                  />
                </Popconfirm>
              ) : (
                <ButtonLoading
                  type="text"
                  size="small"
                  icon={<PlusCircleOutlined />}
                  aria-label="Привязать лицензию"
                  onClick={() => openRegisterModal(record.id)}
                />
              )}
              <Popconfirm
                title={`Удалить запись о клиенте ${record.id}?`}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteClient(record.id)}
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
      unregister,
      deleteClient,
    ],
  );

  const licenceSummary = mactSnapshot
    ? `Всего: ${mactSnapshot.used.length + mactSnapshot.available.length} | Доступно: ${availableLicences.length}`
    : '—';

  return (
    <Space orientation="vertical" size="medium" style={{ width: '100%', paddingTop: 16 }}>
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

      {mactLoadError ? (
        <Alert
          type="warning"
          showIcon
          message="Не удалось загрузить данные лицензирования MACT"
          description={mactLoadError.message}
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
        toolbarExtra={
          <Space wrap>
            <ButtonLoading
              icon={<DatabaseOutlined />}
              loading={isRefetchingClients}
              onClick={refetchClients}
            >
              Обновить клиентов
            </ButtonLoading>
            <ButtonLoading
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={isRefreshingMact || mactLoading}
              onClick={refreshMact}
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
        confirmLoading={isRegistering}
        onSelectedLicencePinChange={setSelectedLicencePin}
        onCancel={closeRegisterModal}
        onRegister={handleRegister}
      />
    </Space>
  );
}
