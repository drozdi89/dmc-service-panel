import { printTemplateQueries } from '@/entities/print-template';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { LoadingOverlay } from '@/shared/ui/loading';
import { Alert, Form, Modal } from 'antd';
import { useEffect, useMemo } from 'react';
import {
  EMPTY_TEMPLATE_FORM_VALUES,
  type TemplateFormValues,
} from '../model/types';
import {
  TemplateFormFields,
  type TemplatePrintPreviewValues,
} from './TemplateFormFields';

/**
 * Props for print template create/edit modal (ResourcePicker-ready, aligned with DeviceFormModal).
 *
 * Preferred contract for pages and future widgets:
 * - `mode` + `templateId` (edit loads detail via {@link printTemplateQueries.useDetailQuery})
 * - stable `onSubmit` / `submitting` / `onCancel`
 *
 * Legacy nesting injectors (line-editor / print-station until widgets #5–#7) may omit `mode`
 * and pass `initialValues` + `loading` instead; both paths keep the same `onSubmit` shape.
 */
export interface TemplateFormModalProps {
  open: boolean;
  title?: string;
  /** Preferred create/edit mode (like DeviceFormModal). */
  mode?: 'create' | 'edit';
  /** Template id for `mode='edit'` when the modal loads detail itself. */
  templateId?: number;
  /**
   * Prefill when the parent owns loading (legacy nesting).
   * Also used as create defaults when `mode` is omitted or `'create'`.
   */
  initialValues?: Partial<TemplateFormValues>;
  /** External loading overlay when the parent fetches detail (legacy nesting). */
  loading?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: TemplateFormValues,
    options: ResourceFormSubmitOptions,
  ) => void;
}

/**
 * Modal form for print template CRUD (name + multiline template body).
 */
export function TemplateFormModal({
  open,
  title,
  mode,
  templateId,
  initialValues,
  loading: externalLoading = false,
  submitting = false,
  onCancel,
  onSubmit,
}: TemplateFormModalProps) {
  const [form] = Form.useForm<TemplateFormValues>();
  const [printingForm] = Form.useForm<TemplatePrintPreviewValues>();

  const resolvedMode: 'create' | 'edit' =
    mode ?? (templateId != null || initialValues?.id != null ? 'edit' : 'create');

  const resolvedTemplateId =
    templateId ?? (typeof initialValues?.id === 'number' ? initialValues.id : undefined);

  /** Self-load detail only when caller opted into the preferred `mode` contract. */
  const canLoad =
    open && mode === 'edit' && resolvedTemplateId !== undefined;

  const {
    data: loadedTemplate,
    isLoading: isLoadingTemplate,
    isError: isLoadError,
  } = printTemplateQueries.useDetailQuery(resolvedTemplateId ?? 0, {
    enabled: canLoad,
  });

  const resolvedTitle =
    title ?? (resolvedMode === 'edit' ? 'Изменение шаблона' : 'Новый шаблон');

  const createDefaults = useMemo(
    (): TemplateFormValues => ({
      ...EMPTY_TEMPLATE_FORM_VALUES,
      ...initialValues,
      id: undefined,
    }),
    [initialValues],
  );

  const overlayLoading = canLoad ? isLoadingTemplate : externalLoading;

  const submitDisabled =
    submitting ||
    (canLoad && (isLoadingTemplate || isLoadError || !loadedTemplate)) ||
    (!canLoad && mode === undefined && externalLoading);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      printingForm.resetFields();
      return;
    }

    if (canLoad) {
      if (loadedTemplate) {
        form.setFieldsValue({
          id: loadedTemplate.id,
          name: loadedTemplate.name,
          template: loadedTemplate.template ?? '',
        });
      }
      return;
    }

    form.setFieldsValue({
      ...EMPTY_TEMPLATE_FORM_VALUES,
      ...initialValues,
    });
  }, [canLoad, form, initialValues, loadedTemplate, open, printingForm]);

  return (
    <Modal
      open={open}
      title={resolvedTitle}
      width={720}
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
              onSubmit(
                {
                  id: values.id,
                  name: values.name,
                  template: values.template,
                },
                options,
              );
            } catch {
              // Validation errors are shown on form fields.
            }
          })();
        },
      })}
    >
      <LoadingOverlay loading={overlayLoading}>
        {isLoadError && canLoad ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить данные шаблона"
            description="Сохранение недоступно. Закройте окно и попробуйте снова."
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <TemplateFormFields
          form={form}
          printingForm={printingForm}
          disabled={Boolean(isLoadError && canLoad)}
          initialValues={!canLoad ? createDefaults : undefined}
        />
      </LoadingOverlay>
    </Modal>
  );
}

export type { TemplateFormValues } from '../model/types';

