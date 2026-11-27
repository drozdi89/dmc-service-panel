import { deviceDetailQueryOptions } from '@/entities/device';
import {
  DEFAULT_PRINT_STATION_FORM_VALUES,
  selectFormData,
  printStationQueries,
  type CreatePrintStationPayload,
  type PrintStationResourceLabels,
} from '@/entities/print-station';
import { printTemplateQueries } from '@/entities/print-template';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { LoadingOverlay } from '@/shared/ui/loading';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Modal, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PrintStationFormFields } from './PrintStationFormFields';

/**
 * Props for print station create/edit modal.
 *
 * Preferred contract (Host / pages):
 * - `mode` + `stationId` (edit loads detail via {@link printStationQueries.useDetailQuery})
 * - stable `onSubmit` / `submitting` / `onCancel`
 *
 * Device/template Select+Add pickers are embedded here (app-level Hosts handle nested CRUD).
 */
export interface PrintStationFormModalProps {
  open: boolean;
  title?: string;
  /** Preferred create/edit mode. */
  mode?: 'create' | 'edit';
  /** Station id for `mode='edit'` when the modal loads detail itself. */
  stationId?: number | null;
  /** External loading overlay when the parent fetches detail. */
  loading?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: CreatePrintStationPayload,
    options: ResourceFormSubmitOptions,
  ) => void;
}

/**
 * Modal form for print station CRUD.
 *
 * Printer / camera / template fields use entity ResourcePickers; nested create/edit
 * goes through app-mounted Device/Template Hosts.
 */
export function PrintStationFormModal({
  open,
  title,
  mode,
  stationId = null,
  loading = false,
  submitting = false,
  onCancel,
  onSubmit,
}: PrintStationFormModalProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CreatePrintStationPayload>();
  const [resourceLabels, setResourceLabels] = useState<PrintStationResourceLabels>({});
  const resourceLabelsRef = useRef(resourceLabels);
  resourceLabelsRef.current = resourceLabels;

  const resolvedMode: 'create' | 'edit' =
    mode ?? (stationId !== null && stationId !== undefined ? 'edit' : 'create');
  const isEdit = resolvedMode === 'edit';
  const resolvedStationId =
    typeof stationId === 'number' ? stationId : undefined;

  const resolvedTitle =
    title ?? (isEdit ? 'Изменение станции печати' : 'Создание станции печати');

  const {
    data: loadedStation,
    isLoading: isLoadingStation,
    isError: isLoadError,
  } = printStationQueries.useDetailQuery(resolvedStationId ?? 0, {
    enabled: open && isEdit && resolvedStationId !== undefined,
  });

  const hasResolvedName = (name: string | undefined, id: number): boolean =>
    name != null && name.length > 0 && name !== `#${id}`;

  const resolveResourceLabels = useCallback(
    async (station: NonNullable<typeof loadedStation>) => {
      const prev = resourceLabelsRef.current;
      const nextLabels: PrintStationResourceLabels = { ...prev };
      const tasks: Promise<void>[] = [];

      if (station.printer && station.printer > 0) {
        if (!hasResolvedName(prev.printerName, station.printer)) {
          tasks.push(
            queryClient
              .fetchQuery(deviceDetailQueryOptions('printer', station.printer))
              .then((device) => {
                nextLabels.printerName = device.name;
              })
              .catch(() => {
                nextLabels.printerName = `#${station.printer}`;
              }),
          );
        }
      }

      if (station.camera && station.camera > 0) {
        if (!hasResolvedName(prev.cameraName, station.camera)) {
          tasks.push(
            queryClient
              .fetchQuery(deviceDetailQueryOptions('camera', station.camera))
              .then((device) => {
                nextLabels.cameraName = device.name;
              })
              .catch(() => {
                nextLabels.cameraName = `#${station.camera}`;
              }),
          );
        }
      }

      if (station.template_id) {
        if (!hasResolvedName(prev.templateName, station.template_id)) {
          tasks.push(
            queryClient
              .fetchQuery(
                printTemplateQueries.detailQueryOptions(station.template_id),
              )
              .then((template) => {
                nextLabels.templateName = template.name;
              })
              .catch(() => {
                nextLabels.templateName = `#${station.template_id}`;
              }),
          );
        }
      }

      await Promise.all(tasks);
      setResourceLabels(nextLabels);
    },
    [queryClient],
  );

  useEffect(() => {
    if (!open) {
      setResourceLabels({});
      return;
    }

    if (!isEdit) {
      form.setFieldsValue(DEFAULT_PRINT_STATION_FORM_VALUES);
      setResourceLabels({});
      return;
    }

    if (loadedStation) {
      form.setFieldsValue(selectFormData(loadedStation));
      void resolveResourceLabels(loadedStation);
    }
  }, [form, isEdit, loadedStation, open, resolveResourceLabels]);

  const fieldsDisabled = isLoadError;
  const modalLoading = loading || (isEdit && isLoadingStation);
  const submitDisabled =
    submitting || (isEdit && (isLoadingStation || isLoadError || !loadedStation));

  return (
    <Modal
      open={open}
      destroyOnHidden={false}
      title={resolvedTitle}
      width={560}
      onCancel={onCancel}
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
        submitDisabled,
        onCancel,
        onSubmit: (options) => {
          void (async () => {
            try {
              const values = await form.validateFields();
              onSubmit(values, options);
            } catch {
              // Validation errors are shown on form fields.
            }
          })();
        },
      })}
    >
      <LoadingOverlay loading={modalLoading}>
        {isLoadError ? (
          <Typography.Text type="danger">
            Не удалось загрузить станцию печати. Закройте окно и попробуйте снова.
          </Typography.Text>
        ) : (
          <PrintStationFormFields
            form={form}
            fieldsDisabled={fieldsDisabled}
            resourceLabels={resourceLabels}
            onResourceLabelsChange={setResourceLabels}
          />
        )}
      </LoadingOverlay>
    </Modal>
  );
}
