import {
  SCALE_TYPE_CHECKWEIGHT_NEW,
  SCALE_TYPE_CHECKWEIR,
} from '@/entities/device';
import {
  applyOutputModeChange,
  applyOutputModeLabelsChange,
  type LineEditorFormState,
  type LineEditorResourceLabels,
  type LineEditorVisibility,
  type LineOutputMode,
} from '@/entities/line';
import { Alert, Checkbox, Divider, Form, Radio, Tooltip } from 'antd';
import { useEffect, useRef } from 'react';
import { LineResourcePickerField } from '../LineResourcePickerField';

/** Props for automated serialization fields. */
export interface LineSerializationFieldsProps {
  visibility: LineEditorVisibility;
  resourceLabels: LineEditorResourceLabels;
  onResourceLabelsChange: (next: LineEditorResourceLabels) => void;
}

function FormStoreField(_props: {
  value?: unknown;
  onChange?: (value: unknown) => void;
}): null {
  return null;
}

function patchTopLevelLabel(
  labels: LineEditorResourceLabels,
  patch: Partial<Omit<LineEditorResourceLabels, 'scale_stations' | 'aggregation_levels'>>,
): LineEditorResourceLabels {
  return { ...labels, ...patch };
}

/**
 * Output mode, subtype, cameras/printers/templates/controller pickers.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 * Output-mode changes migrate scale ids/labels via {@link applyOutputModeChange}.
 */
export function LineSerializationFields({
  visibility,
  resourceLabels,
  onResourceLabelsChange,
}: LineSerializationFieldsProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const outputMode = Form.useWatch('outputMode', form) as LineOutputMode | undefined;
  const watchedNewChwScaleId = Form.useWatch('new_chw_scale_id', form) as number | null | undefined;
  const watchedScaleId = Form.useWatch('scale_id', form) as number | null | undefined;
  const prevOutputModeRef = useRef<LineOutputMode | undefined>(outputMode);
  const resourceLabelsRef = useRef(resourceLabels);
  const scaleIdsRef = useRef({
    new_chw_scale_id: null as number | null,
    scale_id: null as number | null,
  });
  resourceLabelsRef.current = resourceLabels;

  useEffect(() => {
    if (watchedNewChwScaleId !== undefined) {
      scaleIdsRef.current.new_chw_scale_id = watchedNewChwScaleId;
    }
    if (watchedScaleId !== undefined) {
      scaleIdsRef.current.scale_id = watchedScaleId;
    }
  }, [watchedNewChwScaleId, watchedScaleId]);

  useEffect(() => {
    if (!visibility.showAutomatedSerialization) {
      return;
    }
    const values = form.getFieldsValue(true) as LineEditorFormState;
    scaleIdsRef.current = {
      new_chw_scale_id: values.new_chw_scale_id ?? null,
      scale_id: values.scale_id ?? null,
    };
  }, [form, visibility.showAutomatedSerialization]);

  const handleOutputSideFields = (newOutputMode: LineOutputMode) => {
    if (newOutputMode === 'printer') {
      form.setFieldsValue({ output: 0, is_scale: false });
      return;
    }
    if (newOutputMode === 'checkweir') {
      form.setFieldsValue({ output: 1, is_scale: false });
      return;
    }
    form.setFieldsValue({ output: 1, is_scale: true });
  };

  useEffect(() => {
    const previousMode = prevOutputModeRef.current;
    const nextMode = outputMode;
    if (previousMode === undefined || nextMode === undefined || previousMode === nextMode) {
      prevOutputModeRef.current = nextMode;
      return;
    }

    const state = {
      ...(form.getFieldsValue(true) as LineEditorFormState),
      outputMode: previousMode,
      new_chw_scale_id: scaleIdsRef.current.new_chw_scale_id,
      scale_id: scaleIdsRef.current.scale_id,
    };
    const formPatch = applyOutputModeChange(state, nextMode);
    const labelsPatch = applyOutputModeLabelsChange(
      resourceLabelsRef.current,
      previousMode,
      nextMode,
    );

    form.setFieldsValue(formPatch);
    if (Object.keys(labelsPatch).length > 0) {
      onResourceLabelsChange(patchTopLevelLabel(resourceLabelsRef.current, labelsPatch));
    }
    prevOutputModeRef.current = nextMode;
  }, [form, onResourceLabelsChange, outputMode]);

  return (
    <>
      {visibility.showManualLineNotice ? (
        <Alert
          type="info"
          showIcon
          message="Принтеры и шаблоны для печати кодов агрегации настраиваются в уровнях агрегации"
        />
      ) : null}

      {visibility.showAutomatedSerialization ? (
        <>
        <Form.Item name="scale_id" hidden preserve noStyle>
          <FormStoreField />
        </Form.Item>
        <Form.Item name="new_chw_scale_id" hidden preserve noStyle>
          <FormStoreField />
        </Form.Item>
        <Form.Item name="outputMode" label="Сериализация" style={{ marginBottom: 0 }}>
          <Radio.Group
            style={{ marginBottom: 8 }}
            onChange={({ target: { value } }) => {
              handleOutputSideFields(value as LineOutputMode);
            }}
          >
            <Radio.Button value="printer">Принтер</Radio.Button>
            <Radio.Button value="checkweir">Чеквейр</Radio.Button>
            <Tooltip title="Использование ручного взвешивания и нанесения кодов агрегации на продукцию">
              <Radio.Button value="scale">Станция взвешивания</Radio.Button>
            </Tooltip>
          </Radio.Group>
        </Form.Item>
        </>
      ) : null}

      {visibility.showSerializationSubtype && (
        <>
          <Form.Item label="Тип линии" style={{ marginBottom: 0 }}>
            <Form.Item name="automatedSubtype" noStyle>
              <Radio.Group style={{ marginBottom: 8 }}>
                <Radio.Button value="default">Стандартная</Radio.Button>
                <Radio.Button value="doypack">Дойпак</Radio.Button>
              </Radio.Group>
            </Form.Item>
            {visibility.showGroupScan && (
              <Form.Item name="group_scan" valuePropName="checked" noStyle>
                <Checkbox style={{ marginLeft: 8 }}>Групповое сканирование</Checkbox>
              </Form.Item>
            )}
          </Form.Item>
          <LineResourcePickerField
            label={
              visibility.useDoypackCameraLabels ? 'Нечётная камера' : 'Камера размотки'
            }
            kind="device"
            deviceType="camera"
            name="printed_codes_camera_id"
            valueLabel={resourceLabels.printedCodesCameraLabel}
            onChange={(_id, label) => {
              onResourceLabelsChange(
                patchTopLevelLabel(resourceLabels, { printedCodesCameraLabel: label }),
              );
            }}
            layout="horizontal"
          />
          <LineResourcePickerField
            label={
              visibility.useDoypackCameraLabels ? 'Чётная камера' : 'Камера сериализации'
            }
            kind="device"
            deviceType="camera"
            name="camera_id"
            valueLabel={resourceLabels.cameraLabel}
            onChange={(_id, label) => {
              onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { cameraLabel: label }));
            }}
            layout="horizontal"
          />
        </>
      )}

      {(visibility.showPrinterSerialization || visibility.showCheckweirPicker) && (
        <>
          <Divider titlePlacement="start" style={{ margin: 0 }}>
            Печать
          </Divider>
          {visibility.showPrinterSerialization && (
            <>
              <LineResourcePickerField
                label="Принтер сериализации"
                kind="device"
                deviceType="printer"
                name="printer_id"
                valueLabel={resourceLabels.printerLabel}
                onChange={(_id, label) => {
                  onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { printerLabel: label }));
                }}
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Второй принтер"
                kind="device"
                deviceType="printer"
                name="printer_2_id"
                valueLabel={resourceLabels.printer2Label}
                onChange={(_id, label) => {
                  onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { printer2Label: label }));
                }}
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Шаблон этикетки"
                kind="template"
                name="template_id"
                valueLabel={resourceLabels.templateLabel}
                onChange={(_id, label) => {
                  onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { templateLabel: label }));
                }}
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Шаблон без КМ"
                kind="template"
                name="plain_template_id"
                valueLabel={resourceLabels.plainTemplateLabel}
                onChange={(_id, label) => {
                  onResourceLabelsChange(
                    patchTopLevelLabel(resourceLabels, { plainTemplateLabel: label }),
                  );
                }}
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Контроллер"
                kind="device"
                deviceType="controller"
                name="controller_id"
                valueLabel={resourceLabels.controllerLabel}
                onChange={(_id, label) => {
                  onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { controllerLabel: label }));
                }}
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Новый ЧВ"
                kind="device"
                deviceType="scale"
                value={watchedNewChwScaleId ?? null}
                valueLabel={resourceLabels.newChwScaleLabel}
                onChange={(id, label) => {
                  form.setFieldValue('new_chw_scale_id', id);
                  onResourceLabelsChange(
                    patchTopLevelLabel(resourceLabels, { newChwScaleLabel: label }),
                  );
                }}
                scaleTypes={[SCALE_TYPE_CHECKWEIGHT_NEW]}
                defaultScaleType={SCALE_TYPE_CHECKWEIGHT_NEW}
                layout="horizontal"
              />
            </>
          )}
          {visibility.showCheckweirPicker && (
            <LineResourcePickerField
              label="Весы"
              kind="device"
              deviceType="scale"
              value={watchedScaleId ?? null}
              valueLabel={resourceLabels.scaleLabel}
              onChange={(id, label) => {
                form.setFieldValue('scale_id', id);
                onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { scaleLabel: label }));
              }}
              scaleTypes={[SCALE_TYPE_CHECKWEIR]}
              defaultScaleType={SCALE_TYPE_CHECKWEIR}
              layout="horizontal"
            />
          )}
        </>
      )}
    </>
  );
}