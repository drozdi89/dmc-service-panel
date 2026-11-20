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

/** Props for marking options form section. */
export interface MarkingOptionsSectionProps {
  form: FormInstance<ParametersSettingsBundle>;
  initialValues: ParametersSettingsBundle | undefined;
  isSlaveMode: boolean;
  saving: boolean;
  onSave: (values: ParametersSettingsBundle) => void;
}

/**
 * Settings bundle with UI defaults for empty values.
 *
 * @param bundle - Settings bundle from API.
 */
export function bundleToMarkingFormValues(
  bundle: ParametersSettingsBundle,
): ParametersSettingsBundle {
  return {
    ...bundle,
    minimal_culling_grade: bundle.minimal_culling_grade || 'E',
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
