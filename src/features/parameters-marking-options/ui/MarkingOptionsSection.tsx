import {
  MINIMAL_GRADE_OPTIONS,
  bundleToMarkingFormValues,
  useMarkingSettings,
  type ParametersSettingsBundle,
} from '@/entities/parameters';
import { ButtonLoading, QueryStateBoundary } from '@/shared/ui/loading';
import {
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { useEffect, useRef } from 'react';

const { Text } = Typography;

interface MarkingOptionsFieldsProps {
  isSlaveMode: boolean;
  isSaving: boolean;
}

function MarkingOptionsFields({ isSlaveMode, isSaving }: MarkingOptionsFieldsProps) {
  const form = Form.useFormInstance<ParametersSettingsBundle>();
  const useBatchTemplate = Form.useWatch('use_batch_number_template', form);
  const useVsdImport = Form.useWatch('use_vsd_import', form);
  const manDateSwitchEnabled = Form.useWatch('man_date_switch_enabled', form);
  const storePdfOnTaskFinish = Form.useWatch('store_pdf_on_task_finish', form);

  return (
      <>
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
              <Input readOnly maxLength={13} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Не использовать КМ старше"
              tooltip="Не резервировать коды в задание если остаточный срок жизни кода меньше этого значения."
            >
              <Space.Compact block>
                <Form.Item name="dm_lifetime_days" noStyle>
                  <InputNumber min={1} max={60} style={{ width: '100%' }} />
                </Form.Item>
                <Space.Addon style={{ backgroundColor: 'transparent' }}>
                  <Text>
                    дней
                  </Text>
                </Space.Addon>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Предупреждать об истекающих КМ за"
              tooltip="За сколько дней до окончания срока жизни кода в задании показывать предупреждение."
            >
              <Space.Compact block style={{ width: '100%' }}>
                <Form.Item name="dm_lifetime_warning_days" noStyle>
                  <InputNumber min={1} max={60} style={{ width: '100%' }} />
                </Form.Item>
                <Space.Addon style={{ backgroundColor: 'transparent' }}>
                  <Text>
                    дней
                  </Text>
                </Space.Addon>
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Ограничение количества заданий">
          <Space.Compact block>
            <Form.Item name="tasks_limit" noStyle>
              <InputNumber min={0} max={9_999_999} style={{ width: '100%' }} />
            </Form.Item>
            <Space.Addon style={{ backgroundColor: 'transparent' }}>
              ед. продукции
            </Space.Addon>
          </Space.Compact>
        </Form.Item>

        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
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

        <Divider titlePlacement='start' style={{ margin: '16px 0 0 0' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Номер партии
          </Typography.Title>
        </Divider>
        <Flex align='center'>
          <Form.Item name="use_batch_number_template" noStyle valuePropName="checked">
            <Checkbox>Генерировать номер партии по шаблону:</Checkbox>
          </Form.Item>
          <Form.Item name="batch_template" style={{ width: '100%', margin: 0, flex: 1 }}>
            <Input disabled={!useBatchTemplate} style={{ width: '100%' }} placeholder="{mandate}-{serial}" />
          </Form.Item>
        </Flex>

        <Divider titlePlacement='start' style={{ margin: '16px 0 0 0' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Смена даты производства
          </Typography.Title>
        </Divider>
        <Flex align='center'>
          <Form.Item name="man_date_switch_enabled" noStyle valuePropName="checked">
            <Checkbox>Смена даты производства исходя из времени сканирования</Checkbox>
          </Form.Item>
          <Form.Item name="man_date_switch_time" style={{ width: '100%', margin: 0, flex: 1 }}>
            <Input type="time" step={1} disabled={!manDateSwitchEnabled} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>

        {!isSlaveMode ? (
          <>
            <Divider titlePlacement='start' style={{ margin: '16px 0 0 0' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>Импорт ВСД</Typography.Title>
            </Divider>
            <Flex align='center'>
              <Form.Item name="use_vsd_import" noStyle valuePropName="checked">
                <Checkbox>Загружать ВСД из файлов</Checkbox>
              </Form.Item>
              <Form.Item name="vsd_import_path" label="папка импорта ВСД" style={{ margin: 0, width: '100%', flex: 1 }}>
                <Input disabled={!useVsdImport} />
              </Form.Item>
            </Flex>
            

            <Divider titlePlacement='start' style={{ margin: '16px 0 0 0' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>Выгрузка данных заданий</Typography.Title>
            </Divider>
            <Flex align='center'>
              <Form.Item name="store_pdf_on_task_finish" valuePropName="checked" noStyle>
                <Checkbox>
                  Сохранять PDF с изображением КМ после завершения задания
                </Checkbox>
              </Form.Item>
              <Form.Item name="export_data_path" label="папка для выгрузки данных" style={{ margin: 0, width: '100%', flex: 1 }}>
                <Input disabled={!storePdfOnTaskFinish} />
              </Form.Item>
            </Flex>
          </>
        ) : null}

        <Form.Item style={{ marginTop: 16 }}>
          <ButtonLoading type="primary" htmlType="submit" loading={isSaving}>
            Сохранить настройки маркировки
          </ButtonLoading>
        </Form.Item>
      </>
  );
}

/**
 * Marking options form — parity with Qt `mark_settings.py`.
 * Loads and saves its own data; validation and toasts come from the entity hook.
 */
export function MarkingOptionsSection() {
  const [form] = Form.useForm<ParametersSettingsBundle>();
  const { values, isSlaveMode, isLoading, error, save, isSaving } = useMarkingSettings();
  const initializedRef = useRef(false);
  // Fill once: other sections (statistics) invalidate the same bundle and must not reset unsaved edits.
  useEffect(() => {
    if (!isLoading && values && !initializedRef.current) {
      form.setFieldsValue(bundleToMarkingFormValues(values));
      initializedRef.current = true;
    }
  }, [form, isLoading, values]);

  return (
    <QueryStateBoundary
      loading={isLoading}
      error={error}
      errorTitle="Не удалось загрузить настройки маркировки"
    >
      <Form form={form} onFinish={save} layout='horizontal' >
        <MarkingOptionsFields isSlaveMode={isSlaveMode} isSaving={isSaving} />
      </Form>
    </QueryStateBoundary>
  );
}
