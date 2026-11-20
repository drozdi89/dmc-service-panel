import {
  CODE_GENERATOR_OPTIONS,
  CODE_GENERATOR_SSCC,
  createAggregationClientKey,
  validateManualAggregationLevel,
  type AggregationLevelFormState,
} from '@/entities/line';
import { useSettingsBundleQuery } from '@/entities/parameters';
import { App, Form, Input, Modal, Select } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { LineResourcePickerField } from '../LineResourcePickerField';


/** Props for manual aggregation level modal. */
export interface ManualAggregationLevelModalProps {
  open: boolean;
  initialLevel?: AggregationLevelFormState;
  onCancel: () => void;
  onSave: (level: AggregationLevelFormState) => void;
}

const DEFAULT_LEVEL: AggregationLevelFormState = {
  clientKey: createAggregationClientKey(),
  name: '',
  level: 0,
  is_manual: true,
  use_count_method: false,
  template_id: null,
  plain_template_id: null,
  camera_id: null,
  print_camera_id: null,
  controller_id: null,
  divider_id: null,
  generator_type: 0,
  two_cam_mode: false,
  aggr_timeout_ms: 2000,
  print_on_error: false,
  unit_camera_ids: [],
  printer_ids: [],
  aggregation_type: 'manual',
};

/**
 * Applies printer/template pairing errors to the matching form fields.
 */
function applyManualPairingFieldErrors(
  form: ReturnType<typeof Form.useForm<AggregationLevelFormState>>[0],
  printerIds: number[],
  templateId: number | null,
): boolean {
  const pairingError = validateManualAggregationLevel({
    printer_ids: printerIds,
    template_id: templateId,
  });
  if (!pairingError) {
    form.setFields([
      { name: 'printer_ids', errors: [] },
      { name: 'template_id', errors: [] },
    ]);
    return false;
  }

  const hasPrinter = printerIds.length > 0;
  const hasTemplate = templateId !== null;
  if (hasTemplate && !hasPrinter) {
    form.setFields([
      { name: 'printer_ids', errors: [pairingError] },
      { name: 'template_id', errors: [] },
    ]);
    return true;
  }
  if (hasPrinter && !hasTemplate) {
    form.setFields([
      { name: 'template_id', errors: [pairingError] },
      { name: 'printer_ids', errors: [] },
    ]);
    return true;
  }
  return false;
}

/**
 * Renders Ant Design field error text for a registered form field.
 */
function FormFieldError({ fieldName }: { fieldName: 'printer_ids' | 'template_id' }) {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldError }) => {
        const error = getFieldError(fieldName)[0];
        return error ? (
          <div className="ant-form-item-explain ant-form-item-explain-error" style={{ marginTop: -8, marginBottom: 12 }}>
            {error}
          </div>
        ) : null;
      }}
    </Form.Item>
  );
}

/**
 * Modal editor for manual (TSD) aggregation level.
 */
export function ManualAggregationLevelModal({
  open,
  initialLevel,
  onCancel,
  onSave,
}: ManualAggregationLevelModalProps) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<AggregationLevelFormState>();
  const [templateLabel, setTemplateLabel] = useState<string | undefined>();
  const [printerLabel, setPrinterLabel] = useState<string | undefined>();

  const { data: settingsBundle } = useSettingsBundleQuery({
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (open) {
      const level = initialLevel ?? DEFAULT_LEVEL;
      form.setFieldsValue(level);
      const printerId = level.printer_ids[0];
      setTemplateLabel(level.templateLabel);
      setPrinterLabel(printerId ? level.printerLabels?.[printerId] : undefined);
    } else {
      form.resetFields();
      setTemplateLabel(undefined);
      setPrinterLabel(undefined);
    }
  }, [form, initialLevel, open]);

  const printerIds = Form.useWatch('printer_ids', form) ?? [];
  const templateId = Form.useWatch('template_id', form) ?? null;
  const printerId = printerIds[0] ?? null;

  const handleGeneratorChange = useCallback(
    (generatorType: number) => {
      if (generatorType !== CODE_GENERATOR_SSCC) {
        form.setFieldValue('generator_type', generatorType);
        return;
      }
      const gln = settingsBundle?.gln?.trim();
      if (!gln) {
        void modal.warning({
          title: 'Не задан GLN',
          content:
            'В настройках системы не указан GLN! Укажите GLN в настройках системы и повторите выбор.',
        });
        form.setFieldValue('generator_type', 0);
        return;
      }
      form.setFieldValue('generator_type', generatorType);
    },
    [form, modal, settingsBundle?.gln],
  );

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const printerIdsValue = values.printer_ids ?? [];
    const templateIdValue = values.template_id ?? null;
    if (applyManualPairingFieldErrors(form, printerIdsValue, templateIdValue)) {
      return;
    }

    const resolvedPrinterId = printerIdsValue[0];
    onSave({
      ...(initialLevel ?? DEFAULT_LEVEL),
      ...values,
      is_manual: true,
      aggregation_type: 'manual',
      printer_ids: printerIdsValue,
      template_id: templateIdValue,
      templateLabel: templateIdValue ? templateLabel ?? initialLevel?.templateLabel : undefined,
      printerLabels:
        resolvedPrinterId !== undefined
          ? {
              [resolvedPrinterId]:
                printerLabel ??
                initialLevel?.printerLabels?.[resolvedPrinterId] ??
                `#${resolvedPrinterId}`,
            }
          : undefined,
    });
  };

  return (
    <Modal
      open={open}
      title={initialLevel ? 'Изменение ручного уровня' : 'Новый ручной уровень'}
      width={1024}
      onCancel={onCancel}
      onOk={() => {
        void handleSubmit();
      }}
      style={{ top: '1rem' }}
      styles={{ body: { maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" initialValues={DEFAULT_LEVEL}>
        <Form.Item name="name" label="Наименование" rules={[{ required: true, message: 'Укажите название' }]}>
          <Input />
        </Form.Item>

        <Form.Item name="generator_type" label="Тип генератора">
          <Select
            options={CODE_GENERATOR_OPTIONS}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={handleGeneratorChange}
          />
        </Form.Item>

        <LineResourcePickerField
          label="Принтер"
          kind="device"
          deviceType="printer"
          value={printerId}
          valueLabel={printerLabel ?? (printerId ? initialLevel?.printerLabels?.[printerId] : undefined)}
          onChange={(id, label) => {
            const nextPrinterIds = id ? [id] : [];
            form.setFieldValue('printer_ids', nextPrinterIds);
            setPrinterLabel(label);
            applyManualPairingFieldErrors(form, nextPrinterIds, form.getFieldValue('template_id') ?? null);
          }}
        />
        <FormFieldError fieldName="printer_ids" />
        <Form.Item name="printer_ids" hidden>
          <Select mode="multiple" open={false} style={{ display: 'none' }} />
        </Form.Item>

        <LineResourcePickerField
          label="Шаблон"
          kind="template"
          value={templateId}
          valueLabel={templateLabel ?? initialLevel?.templateLabel}
          onChange={(id, label) => {
            form.setFieldValue('template_id', id);
            setTemplateLabel(label);
            applyManualPairingFieldErrors(form, form.getFieldValue('printer_ids') ?? [], id);
          }}
        />
        <FormFieldError fieldName="template_id" />
        <Form.Item name="template_id" hidden>
          <Select open={false} style={{ display: 'none' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

