import {
  SCALE_TYPE_CHECKWEIGHT_NEW,
  SCALE_TYPE_CHECKWEIR,
} from '@/entities/device';
import {
  LINE_TYPE,
  outputModeToFields,
  resolveAutomatedSubtype,
  resolveOutputMode,
  type AutomatedLineSubtype,
  type LineEditorFormState,
  type LineEditorResourceLabels,
  type LineEditorVisibility,
  type LineOutputMode,
} from '@/entities/line';
import { Alert, Checkbox, Divider, Form, Radio, Tooltip } from 'antd';
import { LineResourcePickerField } from '../LineResourcePickerField';

/** Props for automated serialization fields. */
export interface LineSerializationFieldsProps {
  visibility: LineEditorVisibility;
  resourceLabels: LineEditorResourceLabels;
  onResourceLabelsChange: (next: LineEditorResourceLabels) => void;
}

function patchTopLevelLabel(
  labels: LineEditorResourceLabels,
  patch: Partial<Omit<LineEditorResourceLabels, 'scale_stations' | 'aggregation_levels'>>,
): LineEditorResourceLabels {
  return { ...labels, ...patch };
}

/** Subtype radio ↔ `line_type` DOYPACK / DEFAULT. */
const automatedSubtypeProps = {
  getValueProps: (lineType: string | null | undefined) => ({
    value: resolveAutomatedSubtype(lineType),
  }),
  normalize: (subtype: AutomatedLineSubtype): string =>
    subtype === 'doypack' ? LINE_TYPE.DOYPACK : LINE_TYPE.DEFAULT,
} as const;

/**
 * Output mode, subtype, cameras/printers/templates/controller pickers.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 * The output mode radio writes API `output` / `is_scale`; one `scale_id` backs
 * both the «Новый ЧВ» (printer mode) and «Весы» (checkweir mode) pickers.
 */
export function LineSerializationFields({
  visibility,
  resourceLabels,
  onResourceLabelsChange,
}: LineSerializationFieldsProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const output = Form.useWatch('output', form);
  const isScale = Form.useWatch('is_scale', form);
  const outputMode = resolveOutputMode({ output: output ?? 0, is_scale: Boolean(isScale) });

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
        <Form.Item label="Сериализация" style={{ marginBottom: 0 }}>
          <Radio.Group
            style={{ marginBottom: 8 }}
            value={outputMode}
            onChange={({ target: { value } }) => {
              form.setFieldsValue(outputModeToFields(value as LineOutputMode));
            }}
          >
            <Radio.Button value="printer">Принтер</Radio.Button>
            <Radio.Button value="checkweir">Чеквейр</Radio.Button>
            <Tooltip title="Использование ручного взвешивания и нанесения кодов агрегации на продукцию">
              <Radio.Button value="scale">Станция взвешивания</Radio.Button>
            </Tooltip>
          </Radio.Group>
        </Form.Item>
      ) : null}

      {visibility.showSerializationSubtype && (
        <>
          <Form.Item label="Тип линии" style={{ marginBottom: 0 }}>
            <Form.Item name="line_type" {...automatedSubtypeProps} noStyle>
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
            name="printed_camera_id"
            valueLabel={resourceLabels.printedCameraLabel}
            onChange={(_id, label) => {
              onResourceLabelsChange(
                patchTopLevelLabel(resourceLabels, { printedCameraLabel: label }),
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
                name="printer_id_s"
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
                name="scale_id"
                valueLabel={resourceLabels.scaleLabel}
                onChange={(_id, label) => {
                  onResourceLabelsChange(patchTopLevelLabel(resourceLabels, { scaleLabel: label }));
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
              name="scale_id"
              valueLabel={resourceLabels.scaleLabel}
              onChange={(_id, label) => {
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
