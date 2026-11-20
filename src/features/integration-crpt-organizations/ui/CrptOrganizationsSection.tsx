import {
  CRPT_ORGS_QUERY_KEY,
  createCrptOrganization,
  deleteCrptOrganizations,
  fetchCrptOrganization,
  saveOrgCrptTemplateIdx,
  updateCrptOrganization,
  useCrptOrganizationsListQuery,
  type CrptOrganization,
  type CrptOrganizationFormValues,
} from '@/entities/integration';
import { useDmcCompSizeQuery } from '@/entities/parameters';
import { ApiError } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { App, Button, Popconfirm, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CrptOrganizationFormModal } from './CrptOrganizationFormModal';

type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; inn: string };

/**
 * Maps form values to API create/update payloads.
 */
function formValuesToPayload(values: CrptOrganizationFormValues) {
  return {
    inn: values.inn.trim(),
    name: values.name.trim(),
    kpp: values.kpp?.trim() || null,
    thumbprint: values.thumbprint.trim(),
    is_demo: values.is_demo,
    oms_id: values.oms_id.trim(),
    oms_connection: values.oms_connection.trim(),
    load_wares: values.load_wares,
    auto_bill: values.auto_bill,
    bill_sum: values.bill_sum,
    bill_min: values.bill_min,
    bill_email: values.bill_email?.trim() || null,
    mods_list: values.mods_list ?? '',
  };
}

/**
 * CRPT organizations table with server-side search, sort, pagination and CRUD modal.
 */
export function CrptOrganizationsSection() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deletingInn, setDeletingInn] = useState<string | null>(null);
  const [loadingEditInn, setLoadingEditInn] = useState<string | null>(null);
  const [editOrg, setEditOrg] = useState<CrptOrganization | null>(null);

  const editAbortControllerRef = useRef<AbortController | null>(null);
  const editRequestIdRef = useRef(0);

  const compSizeQuery = useDmcCompSizeQuery();
  const [listParams, setListParams] = useState<ListQueryParams | null>(null);

  const orgsQuery = useCrptOrganizationsListQuery(
    listParams ?? { size: 20, number: 0 },
    { enabled: listParams != null },
  );

  const handleListParamsChange = useCallback((params: ListQueryParams) => {
    setListParams(params);
  }, []);

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CRPT_ORGS_QUERY_KEY });
  }, [queryClient]);

  const cancelEditPrefetch = useCallback(() => {
    editAbortControllerRef.current?.abort();
    editAbortControllerRef.current = null;
    editRequestIdRef.current += 1;
  }, []);

  const openCreate = useCallback(() => {
    cancelEditPrefetch();
    setEditOrg(null);
    setModalState({ open: true, mode: 'create' });
  }, [cancelEditPrefetch]);

  const openEdit = useCallback(async (row: CrptOrganization) => {
    cancelEditPrefetch();
    const requestId = editRequestIdRef.current;
    const abortController = new AbortController();
    editAbortControllerRef.current = abortController;

    setLoadingEditInn(row.inn);
    try {
      const detail = await fetchCrptOrganization(row.inn, abortController.signal);
      if (requestId !== editRequestIdRef.current) {
        return;
      }
      setEditOrg(detail);
      setModalState({ open: true, mode: 'edit', inn: row.inn });
    } catch (error) {
      if (abortController.signal.aborted || requestId !== editRequestIdRef.current) {
        return;
      }
      message.error(error instanceof Error ? error.message : 'Ошибка загрузки организации');
    } finally {
      if (requestId === editRequestIdRef.current) {
        setLoadingEditInn(null);
        editAbortControllerRef.current = null;
      }
    }
  }, [cancelEditPrefetch, message]);

  const closeModal = useCallback(() => {
    cancelEditPrefetch();
    setModalState({ open: false });
    setEditOrg(null);
  }, [cancelEditPrefetch]);

  const handleSave = useCallback(
    async (values: CrptOrganizationFormValues) => {
      setSaving(true);
      const key = createIdempotencyKey();
      const payload = formValuesToPayload(values);
      const templateIdx = values.short_template ? 1 : 0;

      try {
        if (modalState.open && modalState.mode === 'edit') {
          const { inn, ...updateBody } = payload;
          await updateCrptOrganization(inn, updateBody, key);
          try {
            await saveOrgCrptTemplateIdx(inn, templateIdx);
          } catch (templateError) {
            invalidateList();
            message.error(
              templateError instanceof ApiError
                ? `Организация сохранена, но шаблон CRPT не обновлён: ${templateError.message}`
                : 'Организация сохранена, но не удалось сохранить шаблон CRPT. Повторите сохранение.',
            );
            return;
          }
          message.success('Организация обновлена');
        } else {
          await createCrptOrganization(payload, key);
          try {
            await saveOrgCrptTemplateIdx(payload.inn, templateIdx);
          } catch (templateError) {
            invalidateList();
            message.error(
              templateError instanceof ApiError
                ? `Организация добавлена, но шаблон CRPT не сохранён: ${templateError.message}`
                : 'Организация добавлена, но не удалось сохранить шаблон CRPT. Откройте запись и повторите сохранение.',
            );
            return;
          }
          message.success('Организация добавлена');
        }
        closeModal();
        invalidateList();
      } catch (error) {
        message.error(error instanceof ApiError ? error.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
    },
    [closeModal, invalidateList, message, modalState],
  );

  const handleDelete = useCallback(
    async (row: CrptOrganization) => {
      setDeletingInn(row.inn);
      try {
        await deleteCrptOrganizations([row.inn], createIdempotencyKey());
        message.success('Организация удалена');
        invalidateList();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Ошибка удаления');
      } finally {
        setDeletingInn(null);
      }
    },
    [invalidateList, message],
  );

  const columns = useMemo<ColumnsType<CrptOrganization>>(
    () => [
      { title: 'ИНН', dataIndex: 'inn', key: 'inn', sorter: true },
      { title: 'Наименование', dataIndex: 'name', key: 'name', sorter: true },
      {
        title: 'Контур',
        dataIndex: 'is_demo',
        key: 'is_demo',
        render: (value: boolean) => (value ? 'Демо' : 'Боевой'),
      },
      {
        title: 'OMS ID',
        dataIndex: 'oms_id',
        key: 'oms_id',
        ellipsis: true,
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 90,
        render: (_value, record) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Изменить ${record.name}`}
              loading={loadingEditInn === record.inn}
              onClick={() => void openEdit(record)}
            />
            <Popconfirm
              title="Удалить организацию?"
              description={record.name}
              onConfirm={() => void handleDelete(record)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Удалить ${record.name}`}
                loading={deletingInn === record.inn}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deletingInn, handleDelete, loadingEditInn, openEdit],
  );

  const orgCountLabel = useMemo(() => {
    if (!orgsQuery.isSuccess || !compSizeQuery.isSuccess) {
      return null;
    }
    return `Организаций: ${orgsQuery.data.total_records} из ${compSizeQuery.data}`;
  }, [compSizeQuery.data, compSizeQuery.isSuccess, orgsQuery.data, orgsQuery.isSuccess]);

  const atOrgLimit = useMemo(() => {
    if (!orgsQuery.isSuccess || !compSizeQuery.isSuccess) {
      return false;
    }
    return orgsQuery.data.total_records >= compSizeQuery.data;
  }, [compSizeQuery.data, compSizeQuery.isSuccess, orgsQuery.data, orgsQuery.isSuccess]);

  return (
    <>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {orgCountLabel ? (
          <Typography.Text type="secondary">{orgCountLabel}</Typography.Text>
        ) : null}
        <ServerDataTable<CrptOrganization>
          controlledList={{
            data: orgsQuery.data,
            isFetching: orgsQuery.isFetching,
            isLoading: orgsQuery.isLoading,
            error: orgsQuery.error,
          }}
          onListParamsChange={handleListParamsChange}
          columns={columns}
          rowKey="inn"
          searchPlaceholder="Поиск по ИНН или наименованию…"
          toolbarExtra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={atOrgLimit}
              onClick={openCreate}
            >
              Добавить
            </Button>
          }
          useTemplateFooter={false}
        />
      </Space>

      <CrptOrganizationFormModal
        open={modalState.open}
        mode={modalState.open ? modalState.mode : 'create'}
        initialOrg={modalState.open && modalState.mode === 'edit' ? editOrg : null}
        saving={saving}
        onCancel={closeModal}
        onSubmit={(values) => void handleSave(values)}
      />
    </>
  );
}
