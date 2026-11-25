import {
  useCrptOrganizationsActions,
  useCrptOrganizationsListQuery,
  type CrptOrganization,
} from '@/entities/integration';
import { useDmcCompSizeQuery } from '@/entities/parameters';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CrptOrganizationFormModal } from './CrptOrganizationFormModal';

type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; inn: string };

/**
 * CRPT organizations table with server-side search, sort, pagination and CRUD modal.
 */
export function CrptOrganizationsSection() {
  const [modalState, setModalState] = useState<ModalState>({ open: false });
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

  const closeModal = useCallback(() => {
    cancelEditPrefetch();
    setModalState({ open: false });
    setEditOrg(null);
  }, [cancelEditPrefetch]);

  const { loadForEdit, save, remove, isSaving, deletingInn } = useCrptOrganizationsActions({
    onSaved: closeModal,
  });

  const openEdit = useCallback(async (row: CrptOrganization) => {
    cancelEditPrefetch();
    const requestId = editRequestIdRef.current;
    const abortController = new AbortController();
    editAbortControllerRef.current = abortController;

    setLoadingEditInn(row.inn);
    const detail = await loadForEdit(row.inn, abortController.signal);
    if (requestId !== editRequestIdRef.current) {
      return;
    }
    setLoadingEditInn(null);
    editAbortControllerRef.current = null;
    if (detail) {
      setEditOrg(detail);
      setModalState({ open: true, mode: 'edit', inn: row.inn });
    }
  }, [cancelEditPrefetch, loadForEdit]);

  const handleSave = useCallback(
    (values: CrptOrganization) => {
      save(modalState.open && modalState.mode === 'edit' ? 'edit' : 'create', values);
    },
    [modalState, save],
  );

  const handleDelete = useCallback(
    (row: CrptOrganization) => {
      remove(row.inn);
    },
    [remove],
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
              onConfirm={() => handleDelete(record)}
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
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
        saving={isSaving}
        onCancel={closeModal}
        onSubmit={handleSave}
      />
    </>
  );
}
