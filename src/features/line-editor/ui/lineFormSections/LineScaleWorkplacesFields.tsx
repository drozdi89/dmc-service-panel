import { SCALE_TYPE_CHECKWEIR } from '@/entities/device';
import type { LineEditorVisibility } from '@/entities/line';
import { Divider } from 'antd';
import { LineResourcePickerField } from '../LineResourcePickerField';

/** Props for scale workplace pickers. */
export interface LineScaleWorkplacesFieldsProps {
  visibility: LineEditorVisibility;
}

const WORKPLACE_KEYS = ['first', 'second'] as const;

/**
 * Scale workplace panels (`scale_stations.first|second.*`).
 *
 * Must render inside an antd Form bound to line editor values.
 */
export function LineScaleWorkplacesFields({ visibility }: LineScaleWorkplacesFieldsProps) {
  if (!visibility.showScaleWorkplacesPanel) {
    return null;
  }

  return (
    <>
      {WORKPLACE_KEYS.map((workplaceKey, index) => (
        <div key={workplaceKey}>
          <Divider titlePlacement="start" style={{ margin: 0 }}>
            Рабочее место {index + 1}
          </Divider>
          <LineResourcePickerField
            label="Весы"
            kind="device"
            deviceType="scale"
            name={['scale_stations', workplaceKey, 'scale_id']}
            labelName={['scale_stations', workplaceKey, 'scaleLabel']}
            excludeScaleTypes={[SCALE_TYPE_CHECKWEIR]}
            layout="horizontal"
          />
          <LineResourcePickerField
            label="Принтер"
            kind="device"
            deviceType="printer"
            name={['scale_stations', workplaceKey, 'printer_id']}
            labelName={['scale_stations', workplaceKey, 'printerLabel']}
            layout="horizontal"
          />
          <LineResourcePickerField
            label="Шаблон"
            kind="template"
            name={['scale_stations', workplaceKey, 'template_id']}
            labelName={['scale_stations', workplaceKey, 'templateLabel']}
            layout="horizontal"
          />
        </div>
      ))}
    </>
  );
}
