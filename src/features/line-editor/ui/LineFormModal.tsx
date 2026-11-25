import {
  createDefaultLineEditorLabels,
  createDefaultLineFormState,
  mapLineConfigurationToForm,
  mapLineConfigurationToLabels,
  useLineAllowPrintedDmQuery,
  useLineConfigurationQuery,
  type LineEditorFormState,
  type LineEditorResourceLabels,
} from '@/entities/line';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { LoadingOverlay } from '@/shared/ui/loading';
import type { FormInstance } from 'antd';
import { Alert, Form, Modal } from 'antd';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { LineEditorForm } from './LineEditorForm';

function LineModalTitleName({
  form,
  fallback,
}: {
  form: FormInstance<LineEditorFormState>;
  fallback: string;
}) {
  const name = Form.useWatch('linename', form);
  return <>Линия: {name?.trim() ? name : fallback}</>;
}

/** Dialog state submitted alongside the form object. */
export interface LineFormSubmitContext {
  /** Persisted aggregation levels removed in the editor. */
  deletedAggregationLevelIds: number[];
}

/**
 * Props for line create/edit modal (ResourcePicker-ready).
 *
 * Preferred contract:
 * - `mode` + `lineId` (edit loads config via {@link useLineConfigurationQuery})
 * - stable `onSubmit` / `submitting` / `onCancel`
 * Save orchestration lives in {@link import('@/widgets/line').LineFormModalHost}.
 */
export interface LineFormModalProps {
  open: boolean;
  title?: string;
  mode: 'create' | 'edit';
  /** Line id for `mode='edit'` when the modal loads configuration itself. */
  lineId?: number;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: LineEditorFormState,
    options: ResourceFormSubmitOptions,
    context: LineFormSubmitContext,
  ) => void;
}

/**
 * Line create/edit modal wrapping {@link LineEditorForm}.
 *
 * Hydrates once per open/`lineId` (create defaults or mapped configuration).
 * Does not persist — Host owns {@link import('@/services/line-service').saveLineConfiguration}.
 */
export function LineFormModal({
  open,
  title,
  mode,
  lineId,
  submitting = false,
  onCancel,
  onSubmit,
}: LineFormModalProps) {
  const isEdit = mode === 'edit';
  const isExisting = isEdit && lineId !== undefined;
  const lineKey = isExisting ? String(lineId) : 'new';

  const [editorForm, setEditorForm] = useState<FormInstance<LineEditorFormState> | null>(
    null,
  );
  const [deletedLevelIds, setDeletedLevelIds] = useState<number[]>([]);
  /**
   * Hydrated defaults for the current `lineKey` only.
   * Intentionally not recomputed on React Query refetch (avoids wiping dirty fields).
   */
  const [hydrated, setHydrated] = useState<{
    key: string;
    values: LineEditorFormState;
    resourceLabels: LineEditorResourceLabels;
  } | null>(null);

  const initialValues = hydrated?.key === lineKey ? hydrated.values : null;
  const initialResourceLabels =
    hydrated?.key === lineKey ? hydrated.resourceLabels : null;

  const configQuery = useLineConfigurationQuery(lineId ?? 0, {
    enabled: open && isExisting,
  });
  const allowPrintedQuery = useLineAllowPrintedDmQuery(lineId ?? 0, {
    enabled: open && isExisting,
  });

  const isLoading = isExisting
    ? configQuery.isLoading || allowPrintedQuery.isLoading
    : false;
  const isFetching = isExisting
    ? configQuery.isFetching || allowPrintedQuery.isFetching
    : false;
  const isError = isExisting
    ? configQuery.isError || allowPrintedQuery.isError
    : false;
  const error = configQuery.error ?? allowPrintedQuery.error;

  useEffect(() => {
    if (!open) {
      setHydrated(null);
      setEditorForm(null);
      return;
    }

    if (hydrated?.key === lineKey) {
      return;
    }

    if (!isExisting) {
      setHydrated({
        key: lineKey,
        values: createDefaultLineFormState(),
        resourceLabels: createDefaultLineEditorLabels(),
      });
      return;
    }

    if (configQuery.isSuccess && allowPrintedQuery.isSuccess) {
      setHydrated({
        key: lineKey,
        values: mapLineConfigurationToForm(configQuery.data, allowPrintedQuery.data),
        resourceLabels: mapLineConfigurationToLabels(configQuery.data),
      });
    }
  }, [
    allowPrintedQuery.data,
    allowPrintedQuery.isSuccess,
    configQuery.data,
    configQuery.isSuccess,
    hydrated?.key,
    isExisting,
    lineKey,
    open,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setEditorForm(null);
    setDeletedLevelIds([]);
  }, [lineKey, open]);

  const handleFormReady = useCallback(
    (form: FormInstance<LineEditorFormState> | null) => {
      setEditorForm(form);
    },
    [],
  );

  const loadErrorMessage =
    error instanceof Error ? error.message : 'Не удалось загрузить линию';
  const showFatalLoadError = isError && !initialValues;
  const showRefetchError = isError && Boolean(initialValues);

  const resolvedTitle: ReactNode =
    title ??
    (isEdit
      ? editorForm
        ? (
            <LineModalTitleName
              form={editorForm}
              fallback={initialValues?.linename?.trim() || '…'}
            />
          )
        : `Линия: ${initialValues?.linename?.trim() || '…'}`
      : 'Новая линия');

  const canSave =
    Boolean(editorForm && initialValues) &&
    !submitting &&
    !showFatalLoadError &&
    !(isExisting && (isLoading || !initialValues));

  return (
    <Modal
      open={open}
      destroyOnHidden={false}
      title={resolvedTitle}
      width={1000}
      onCancel={submitting ? () => undefined : onCancel}
      closable={!submitting}
      keyboard={!submitting}
      style={{ top: '1rem' }}
      styles={{
        body: {
          height: 'calc(100vh - 10rem)',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
      }}
      footer={resourceFormModalFooter({
        submitting,
        submitDisabled: !canSave,
        onCancel,
        onSubmit: (options) => {
          if (!editorForm) {
            return;
          }
          const values = editorForm.getFieldsValue(true) as LineEditorFormState;
          onSubmit(values, options, { deletedAggregationLevelIds: deletedLevelIds });
        },
      })}
    >
      <LoadingOverlay loading={isExisting && (isLoading || isFetching)}>
        {showFatalLoadError ? (
          <Alert
            type="error"
            showIcon
            message={loadErrorMessage}
            description="Сохранение недоступно. Закройте окно и попробуйте снова."
          />
        ) : initialValues && initialResourceLabels ? (
          <>
            {showRefetchError ? (
              <Alert
                type="error"
                showIcon
                message={loadErrorMessage}
                style={{ marginBottom: 16 }}
              />
            ) : null}
            <LineEditorForm
              key={lineKey}
              isNew={!isExisting}
              initialValues={initialValues}
              initialResourceLabels={initialResourceLabels}
              deletedLevelIds={deletedLevelIds}
              onDeletedLevelIdsChange={setDeletedLevelIds}
              onFormReady={handleFormReady}
            />
          </>
        ) : null}
      </LoadingOverlay>
    </Modal>
  );
}
