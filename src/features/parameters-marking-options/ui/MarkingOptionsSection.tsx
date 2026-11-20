import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import { useEffect, useRef } from 'react';
import { MINIMAL_GRADE_OPTIONS, type ParametersSettingsBundle } from '@/entities/parameters';
import { ButtonLoading } from '@/shared/ui/loading';

/** Form values for marking options section. */
export interface MarkingOptionsFormValues {
  use_special_numbers: boolean;
  batch_number_mandatory: boolean;
  export_data_path: string;
  use_batch_number_template: boolean;
  batch_template: string;
  use_vsd_import: boolean;
  vsd_import_path: string;
  dm_lifetime_days: number;
  dm_lifetime_warning_days: number;
  gln: string;
  tasks_limit: number;
  man_date_switch_time: string;
  minimal_culling_grade: string;
  man_date_switch_enabled: boolean;
  sscc_with_ai00_enabled: boolean;
  store_pdf_on_task_finish: boolean;
  sscc_generate_on_new_task: boolean;
  dm_is_introduced_option: boolean;
  calculate_mandate_by_days: boolean;
  subacc_products_archived: boolean;
}

/** Props for marking options form section. */
export interface MarkingOptionsSectionProps {
  form: FormInstance<MarkingOptionsFormValues>;
  initialValues: ParametersSettingsBundle | undefined;
  isSlaveMode: boolean;
  saving: boolean;
  onSave: (values: MarkingOptionsFormValues) => void;
}

/**
 * Converts bundle API data to form initial values.
 *
 * @param bundle - Settings bundle from API.
 */
export function bundleToMarkingFormValues(
  bundle: ParametersSettingsBundle,
): MarkingOptionsFormValues {
  return {
    use_special_numbers: bundle.use_special_numbers,
    batch_number_mandatory: bundle.batch_number_mandatory,
    export_data_path: bundle.export_data_path,
    use_batch_number_template: bundle.use_batch_number_template,
    batch_template: bundle.batch_template,
    use_vsd_import: bundle.use_vsd_import,
    vsd_import_path: bundle.vsd_import_path,
    dm_lifetime_days: bundle.dm_lifetime_days,
    dm_lifetime_warning_days: bundle.dm_lifetime_warning_days,
    gln: bundle.gln,
    tasks_limit: bundle.tasks_limit,
    man_date_switch_time: bundle.man_date_switch_time,
    minimal_culling_grade: bundle.minimal_culling_grade || 'E',
    man_date_switch_enabled: bundle.man_date_switch_enabled,
    sscc_with_ai00_enabled: bundle.sscc_with_ai00_enabled,
    store_pdf_on_task_finish: bundle.store_pdf_on_task_finish,
    sscc_generate_on_new_task: bundle.sscc_generate_on_new_task,
    dm_is_introduced_option: bundle.dm_is_introduced_option,
    calculate_mandate_by_days: bundle.calculate_mandate_by_days,
    subacc_products_archived: bundle.subacc_products_archived,
  };
}

/**
 * Marking options form — parity with Qt `mark_settings.py`.
 */
export function MarkingOptionsSection({
  form,
  initialValues,
  isSlaveMode,
  saving,
  onSave,
}: MarkingOptionsSectionProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initialValues && !initializedRef.current) {
      form.setFieldsValue(bundleToMarkingFormValues(initialValues));
      initializedRef.current = true;
    }
  }, [form, initialValues]);

  const useBatchTemplate = Form.useWatch('use_batch_number_template', form);
  const useVsdImport = Form.useWatch('use_vsd_import', form);
  const manDateSwitchEnabled = Form.useWatch('man_date_switch_enabled', form);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSave}
      initialValues={initialValues ? bundleToMarkingFormValues(initialValues) : undefined}
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="minimal_culling_grade"
            label="Минимальный грейд кода для валидации"
          >
            <Select
              options={MINIMAL_GRADE_OPTIONS.map((grade) => ({
                value: grade,
                label: grade,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="gln" label="GLN организации (SSCC коды)">
            <Input maxLength={13} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="dm_lifetime_days"
            label="Не использовать КМ старше"
            tooltip="Не резервировать коды в задание если остаточный срок жизни кода меньше этого значения."
          >
            <InputNumber min={1} max={60} addonAfter="дней" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="dm_lifetime_warning_days"
            label="Предупреждать об истекающих КМ за"
            tooltip="За сколько дней до окончания срока жизни кода в задании показывать предупреждение."
          >
            <InputNumber min={1} max={60} addonAfter="дней" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="tasks_limit" label="Ограничение количества заданий">
        <InputNumber min={0} max={9_999_999} style={{ width: '100%' }} />
      </Form.Item>

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Form.Item name="use_special_numbers" valuePropName="checked" noStyle>
          <Checkbox>Использовать номера партии и варки в заданиях</Checkbox>
        </Form.Item>
        <Form.Item name="batch_number_mandatory" valuePropName="checked" noStyle>
          <Checkbox>Обязательное указание номера партии</Checkbox>
        </Form.Item>
        <Form.Item name="sscc_with_ai00_enabled" valuePropName="checked" noStyle>
          <Checkbox>Выгружать коды SSCC с AI00</Checkbox>
        </Form.Item>
        <Form.Item name="sscc_generate_on_new_task" valuePropName="checked" noStyle>
          <Checkbox>Генерировать SSCC при создании задания</Checkbox>
        </Form.Item>
        <Form.Item name="subacc_products_archived" valuePropName="checked" noStyle>
          <Checkbox>Карточки контрактного производства загружать архивными</Checkbox>
        </Form.Item>
        <Form.Item name="dm_is_introduced_option" valuePropName="checked" noStyle>
          <Checkbox>
            Штучные КМ уже введены в оборот, работает только агрегация
          </Checkbox>
        </Form.Item>
        <Form.Item name="calculate_mandate_by_days" valuePropName="checked" noStyle>
          <Checkbox>Срок годности рассчитывать в днях</Checkbox>
        </Form.Item>
      </Space>

      <Typography.Title level={5} style={{ marginTop: 16 }}>
        Номер партии
      </Typography.Title>
      <Form.Item name="use_batch_number_template" valuePropName="checked">
        <Checkbox>Генерировать номер партии по шаблону</Checkbox>
      </Form.Item>
      <Form.Item name="batch_template" label="Шаблон номера партии">
        <Input disabled={!useBatchTemplate} placeholder="{mandate}-{serial}" />
      </Form.Item>

      <Typography.Title level={5}>Смена даты производства</Typography.Title>
      <Form.Item name="man_date_switch_enabled" valuePropName="checked">
        <Checkbox>
          Смена даты производства исходя из времени сканирования
        </Checkbox>
      </Form.Item>
      <Form.Item name="man_date_switch_time" label="Время смены даты">
        <Input
          type="time"
          step={1}
          disabled={!manDateSwitchEnabled}
          style={{ width: 160 }}
        />
      </Form.Item>

      {!isSlaveMode ? (
        <>
          <Typography.Title level={5}>Импорт ВСД</Typography.Title>
          <Form.Item name="use_vsd_import" valuePropName="checked">
            <Checkbox>Загружать ВСД из файлов</Checkbox>
          </Form.Item>
          <Form.Item name="vsd_import_path" label="Папка импорта ВСД">
            <Input disabled={!useVsdImport} />
          </Form.Item>

          <Typography.Title level={5}>Выгрузка данных заданий</Typography.Title>
          <Form.Item name="export_data_path" label="Папка для выгрузки данных">
            <Input />
          </Form.Item>
          <Form.Item name="store_pdf_on_task_finish" valuePropName="checked" noStyle>
            <Checkbox>
              Сохранять PDF с изображением КМ после завершения задания
            </Checkbox>
          </Form.Item>
        </>
      ) : null}

      <Form.Item style={{ marginTop: 16 }}>
        <ButtonLoading type="primary" htmlType="submit" loading={saving}>
          Сохранить настройки маркировки
        </ButtonLoading>
      </Form.Item>
    </Form>
  );
}
