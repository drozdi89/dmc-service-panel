import {
  SCALE_TYPE_CHECKWEIGHT_NEW,
  SCALE_TYPE_CHECKWEIR,
} from '@/entities/device';
import {
  applyOutputModeChange,
  type LineEditorFormState,
  type LineEditorVisibility
} from '@/entities/line';
import { Alert, Checkbox, Divider, Form, Radio, Tooltip } from 'antd';
import { LineResourcePickerField } from '../LineResourcePickerField';

/** Props for automated serialization fields. */
export interface LineSerializationFieldsProps {
  visibility: LineEditorVisibility;
}

/**
 * Output mode, subtype, cameras/printers/templates/controller pickers.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 * Output-mode changes migrate scale ids/labels via {@link applyOutputModeChange}.
 */
export function LineSerializationFields({ visibility }: LineSerializationFieldsProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  /** Previous output mode from last render — used when Form already wrote the new value. */

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
        <Form.Item name="outputMode" label="Сериализация" style={{ marginBottom: 0 }}>
          <Radio.Group
            style={{ marginBottom: 8 }}
            onChange={({ target: { value } }) => {
              if (value === 'printer') {
                form.setFieldValue('output', 0);
                form.setFieldValue('is_scale', false);
              } else if (value === 'checkweir') {
                form.setFieldValue('output', 1);
                form.setFieldValue('is_scale', false);
              } else if (value === 'scale') {
                form.setFieldValue('output', 1);
                form.setFieldValue('is_scale', true);
              }
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
            labelName="printedCodesCameraLabel"
            layout="horizontal"
          />
          <LineResourcePickerField
            label={
              visibility.useDoypackCameraLabels ? 'Чётная камера' : 'Камера сериализации'
            }
            kind="device"
            deviceType="camera"
            name="camera_id"
            labelName="cameraLabel"
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
                labelName="printerLabel"
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Второй принтер"
                kind="device"
                deviceType="printer"
                name="printer_2_id"
                labelName="printer2Label"
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Шаблон этикетки"
                kind="template"
                name="template_id"
                labelName="templateLabel"
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Шаблон без КМ"
                kind="template"
                name="plain_template_id"
                labelName="plainTemplateLabel"
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Контроллер"
                kind="device"
                deviceType="controller"
                name="controller_id"
                labelName="controllerLabel"
                layout="horizontal"
              />
              <LineResourcePickerField
                label="Новый ЧВ"
                kind="device"
                deviceType="scale"
                name="new_chw_scale_id"
                labelName="newChwScaleLabel"
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
              labelName="scaleLabel"
              scaleTypes={[SCALE_TYPE_CHECKWEIR]}
              defaultScaleType={SCALE_TYPE_CHECKWEIR}
              layout="horizontal"
            />
          )}
        </>
      ) }
    </>
  );
}
