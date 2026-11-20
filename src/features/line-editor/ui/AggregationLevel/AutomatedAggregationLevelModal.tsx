import { DeviceResourceListEditor } from '@/entities/device';
import {
  AGGREGATION_LOGIC_TYPE,
  CODE_GENERATOR_SSCC,
  createAggregationClientKey,
  formatAggregationModeLabel,
  getAggrLogicType,
  SelectCodeGenerator,
  type AggregationLevelFormState,
  type AggregationLogicInput
} from '@/entities/line';
import { useSettingsBundleQuery } from '@/entities/parameters';
import lineImage from '@/shared/assets/line.png';
import { StepperNumberInput } from '@/shared/ui/StepperNumberInput';
import { NumberInput } from '@/shared/ui/input';
import { App, Checkbox, Divider, Flex, Form, Image, Input, Modal, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineResourcePickerField } from '../LineResourcePickerField';

/** Props for automated aggregation level modal. */
export interface AutomatedAggregationLevelModalProps {
  open: boolean;
  initialLevel?: AggregationLevelFormState;
  onCancel: () => void;
  onSave: (level: AggregationLevelFormState) => void;
}

const DEFAULT_LEVEL: AggregationLevelFormState = {
  clientKey: createAggregationClientKey(),
  name: '',
  level: 0,
  is_manual: false,
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
  aggregation_type: 'automated',
};

type ResourceLabelsState = Pick<
  AggregationLevelFormState,
  | 'templateLabel'
  | 'plainTemplateLabel'
  | 'cameraLabel'
  | 'printCameraLabel'
  | 'controllerLabel'
  | 'dividerLabel'
  | 'unitCameraLabels'
  | 'printerLabels'
>;

const EMPTY_LABELS: ResourceLabelsState = {
  unitCameraLabels: {},
  printerLabels: {},
};

/**
 * Modal editor for automated aggregation level (Qt AggregationLevel parity).
 */
export function AutomatedAggregationLevelModal({
  open,
  initialLevel,
  onCancel,
  onSave,
}: AutomatedAggregationLevelModalProps) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<AggregationLevelFormState>();
  const [resourceLabels, setResourceLabels] = useState<ResourceLabelsState>(EMPTY_LABELS);

  const {
    data: settingsBundle,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
  } = useSettingsBundleQuery({
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (open) {
      const level = initialLevel ?? DEFAULT_LEVEL;
      form.setFieldsValue(level);
      setResourceLabels({
        templateLabel: level.templateLabel,
        plainTemplateLabel: level.plainTemplateLabel,
        cameraLabel: level.cameraLabel,
        printCameraLabel: level.printCameraLabel,
        controllerLabel: level.controllerLabel,
        dividerLabel: level.dividerLabel,
        unitCameraLabels: { ...level.unitCameraLabels },
        printerLabels: { ...level.printerLabels },
      });
    } else {
      form.resetFields();
      setResourceLabels(EMPTY_LABELS);
    }
  }, [form, initialLevel, open]);

  const watched = Form.useWatch([], form) as AggregationLevelFormState | undefined;

  const logicInput = useMemo((): AggregationLogicInput => {
    const values = watched ?? initialLevel ?? DEFAULT_LEVEL;
    return {
      name: values.name ?? '',
      level: values.level ?? 0,
      use_count_method: values.use_count_method ?? false,
      two_cam_mode: values.two_cam_mode ?? false,
      aggr_timeout_ms: values.aggr_timeout_ms ?? 0,
      camera_id: values.camera_id ?? null,
      print_camera_id: values.print_camera_id ?? null,
      unit_camera_ids: values.unit_camera_ids ?? [],
    };
  }, [initialLevel, watched]);

  const modeLabel = useMemo(() => formatAggregationModeLabel(logicInput), [logicInput]);

  const showPrintCamera = useMemo(() => {
    try {
      return getAggrLogicType(logicInput).value === AGGREGATION_LOGIC_TYPE.CAM_FULL_SCAN.value;
    } catch {
      return false;
    }
  }, [logicInput]);

  useEffect(() => {
    if (showPrintCamera) {
      return;
    }
    if ((watched?.print_camera_id ?? null) !== null) {
      form.setFieldValue('print_camera_id', null);
    }
    setResourceLabels((prev) =>
      prev.printCameraLabel !== undefined ? { ...prev, printCameraLabel: undefined } : prev,
    );
  }, [form, showPrintCamera, watched?.print_camera_id]);

  const handleGeneratorChange = useCallback(
    (generatorType: number) => {
      if (generatorType !== CODE_GENERATOR_SSCC) {
        form.setFieldValue('generator_type', generatorType);
        return;
      }
      if (isSettingsLoading) {
        return;
      }
      if (isSettingsError) {
        void modal.error({
          title: 'Ошибка загрузки настроек',
          content: 'Не удалось загрузить настройки системы. Повторите попытку позже.',
        });
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
    [form, isSettingsError, isSettingsLoading, modal, settingsBundle?.gln],
  );

  const handleSubmit = async () => {
    if (!modeLabel.isValid) {
      void modal.warning({
        title: 'Некорректные настройки',
        content:
          modeLabel.text || 'Некорректно настроена агрегация! Проверьте настройки агрегации!',
      });
      return;
    }
    const values = await form.validateFields();
    onSave({
      ...(initialLevel ?? DEFAULT_LEVEL),
      ...values,
      is_manual: false,
      aggregation_type: 'automated',
      ...resourceLabels,
    });
  };

  return (
    <Modal
      open={open}
      title={initialLevel ? 'Изменение уровня агрегации' : 'Новый уровень агрегации'}
      width={1024}
      onCancel={onCancel}
      onOk={() => {
        void handleSubmit();
      }}
      style={{ top: '1rem' }}
      styles={{ 
        body: { 
          maxHeight: 'calc(100vh - 10rem)', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          marginRight: '-24px',
          paddingRight: '24px',
        } 
      }}
    >
      <Form form={form} layout="vertical" initialValues={DEFAULT_LEVEL}>
        <Flex align="start" orientation='horizontal' justify='space-between' gap='1rem'>
          <Form.Item
            name="name"
            label="Наименование"
            layout='horizontal'
            rules={[{ required: true, message: 'Укажите название' }]}
            style={{ flex: 1, marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item name="level" label="Уровень" layout='horizontal' rules={[{ required: true }]} style={{ marginBottom: 4 }}>
            <StepperNumberInput min={0} max={9} step={1} />
          </Form.Item>
        </Flex>

        <Form.Item name="generator_type" label="Тип генератора" layout='horizontal' style={{ marginBottom: 4 }}>
          <SelectCodeGenerator
            showSearch
            loading={isSettingsLoading}
            disabled={isSettingsLoading}
            onChange={handleGeneratorChange}
          />
        </Form.Item>
        <Flex justify='space-between' align='flex-start' gap='1rem'>
            <div style={{ maxWidth: '50%', flex: 1 }}>
              <Image
                alt="line image"
                src={lineImage}
                width='100%'
              />
            </div>
            <div style={{ flex: 1 }}>
              <Divider style={{ margin: '0' }} titlePlacement='start'>
                <Form.Item name="two_cam_mode" valuePropName="checked" noStyle>
                  <Checkbox>Две камеры</Checkbox>
                </Form.Item>
              </Divider>
              <Form.Item label="Таймаут агрегации, сек" layout='horizontal' name="aggr_timeout_ms" style={{ marginBottom: 4 }}>
                <NumberInput
                  min={0}
                  max={60}
                  step={250}
                  round={1000}
                />
              </Form.Item>
              <Form.Item name="aggr_timeout_ms" hidden>
                <Input />
              </Form.Item>
              <Divider style={{ margin: '0' }} titlePlacement='start'>
                <Form.Item name="use_count_method" valuePropName="checked" noStyle>
                  <Checkbox>Метод подсчёта</Checkbox>
                </Form.Item>
              </Divider>
              <Form.Item label="Камеры единиц">
                <DeviceResourceListEditor
                  deviceType="camera"
                  ids={watched?.unit_camera_ids ?? []}
                  labels={resourceLabels.unitCameraLabels ?? {}}
                  onChange={(ids) => {
                    form.setFieldValue('unit_camera_ids', ids);
                    setResourceLabels((prev) => {
                      const idSet = new Set(ids);
                      const unitCameraLabels = Object.fromEntries(
                        Object.entries(prev.unitCameraLabels ?? {}).filter(([key]) =>
                          idSet.has(Number(key)),
                        ),
                      );
                      return { ...prev, unitCameraLabels };
                    });
                  }}
                  onLabelChange={(id, label) => {
                    setResourceLabels((prev) => ({
                      ...prev,
                      unitCameraLabels: { ...prev.unitCameraLabels, [id]: label },
                    }));
                  }}
                />
              </Form.Item>
              <Form.Item name="unit_camera_ids" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="Принтеры">
                <DeviceResourceListEditor
                  deviceType="printer"
                  enableReorder
                  ids={watched?.printer_ids ?? []}
                  labels={resourceLabels.printerLabels ?? {}}
                  onChange={(ids) => {
                    form.setFieldValue('printer_ids', ids);
                    setResourceLabels((prev) => {
                      const idSet = new Set(ids);
                      const printerLabels = Object.fromEntries(
                        Object.entries(prev.printerLabels ?? {}).filter(([key]) =>
                          idSet.has(Number(key)),
                        ),
                      );
                      return { ...prev, printerLabels };
                    });
                  }}
                  onLabelChange={(id, label) => {
                    setResourceLabels((prev) => ({
                      ...prev,
                      printerLabels: { ...prev.printerLabels, [id]: label },
                    }));
                  }}
                />
              </Form.Item>
              <Form.Item name="printer_ids" hidden>
                <Input />
              </Form.Item>
              <Divider style={{ margin: '0' }} titlePlacement='start'>
                <Form.Item name="print_on_error" valuePropName="checked" noStyle>
                  <Checkbox>Печать пустой этикетки при ошибке</Checkbox>
                </Form.Item>
              </Divider>

              <LineResourcePickerField
                name="template_id"
                label="Шаблон"
                kind="template"
                valueLabel={resourceLabels.templateLabel}
                onChange={(_id, nextLabel) => {
                  setResourceLabels((prev) => ({ ...prev, templateLabel: nextLabel }));
                }}
              />

              {showPrintCamera ? (
                <LineResourcePickerField
                  name="print_camera_id"
                  label="Камера печати кода агрегата"
                  kind="device"
                  deviceType="camera"
                  valueLabel={resourceLabels.printCameraLabel}
                  onChange={(_id, nextLabel) => {
                    setResourceLabels((prev) => ({
                      ...prev,
                      printCameraLabel: nextLabel,
                    }));
                  }}
                />
              ) : null}

              <LineResourcePickerField
                name="camera_id"
                label="Камера агрегации"
                kind="device"
                deviceType="camera"
                valueLabel={resourceLabels.cameraLabel}
                onChange={(_id, nextLabel) => {
                  setResourceLabels((prev) => ({ ...prev, cameraLabel: nextLabel }));
                }}
              />
          </div>
        </Flex>

        <LineResourcePickerField
          name="controller_id"
          layout="horizontal"
          label="Контроллер"
          kind="device"
          deviceType="controller"
          valueLabel={resourceLabels.controllerLabel}
          onChange={(_id, nextLabel) => {
            setResourceLabels((prev) => ({ ...prev, controllerLabel: nextLabel }));
          }}
        />
        <LineResourcePickerField
          name="divider_id"
          layout="horizontal"
          label="Делитель"
          kind="device"
          deviceType="divider"
          valueLabel={resourceLabels.dividerLabel}
          onChange={(_id, nextLabel) => {
            setResourceLabels((prev) => ({ ...prev, dividerLabel: nextLabel }));
          }}
        />
        <Typography.Text
          style={{
            display: 'block',
            border: '1px solid var(--ant-color-border, #d9d9d9)',
            borderRadius: 6,
            padding: '6px 12px',
            margin: 0,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            color: modeLabel.isValid ? '#008800' : '#880000',
          }}
        >
          {modeLabel.text || '\u00a0'}
        </Typography.Text>
      </Form>
    </Modal>
  );
}
