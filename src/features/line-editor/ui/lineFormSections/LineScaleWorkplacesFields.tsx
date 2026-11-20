import { SCALE_TYPE_CHECKWEIR } from '@/entities/device';
import type { LineEditorResourceLabels, LineEditorVisibility } from '@/entities/line';
import { Divider } from 'antd';
import { LineResourcePickerField } from '../LineResourcePickerField';

/** Props for scale workplace pickers. */
export interface LineScaleWorkplacesFieldsProps {
  visibility: LineEditorVisibility;
  resourceLabels: LineEditorResourceLabels;
  onResourceLabelsChange: (next: LineEditorResourceLabels) => void;
}

const WORKPLACE_KEYS = ['first', 'second'] as const;

type WorkplaceKey = (typeof WORKPLACE_KEYS)[number];

/**
 * Scale workplace panels (`scale_stations.first|second.*`).
 *
 * Must render inside an antd Form bound to line editor values.
 */
export function LineScaleWorkplacesFields({
  visibility,
  resourceLabels,
  onResourceLabelsChange,
}: LineScaleWorkplacesFieldsProps) {
  if (!visibility.showScaleWorkplacesPanel) {
    return null;
  }

  const patchWorkplaceLabel = (
    workplaceKey: WorkplaceKey,
    field: 'scaleLabel' | 'printerLabel' | 'templateLabel',
    label?: string,
  ) => {
    onResourceLabelsChange({
      ...resourceLabels,
      scale_stations: {
        ...resourceLabels.scale_stations,
        [workplaceKey]: {
          ...resourceLabels.scale_stations[workplaceKey],
          [field]: label,
        },
      },
    });
  };

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
            valueLabel={resourceLabels.scale_stations[workplaceKey].scaleLabel}
            onChange={(_id, label) => patchWorkplaceLabel(workplaceKey, 'scaleLabel', label)}
            excludeScaleTypes={[SCALE_TYPE_CHECKWEIR]}
            layout="horizontal"
          />
          <LineResourcePickerField
            label="Принтер"
            kind="device"
            deviceType="printer"
            name={['scale_stations', workplaceKey, 'printer_id']}
            valueLabel={resourceLabels.scale_stations[workplaceKey].printerLabel}
            onChange={(_id, label) => patchWorkplaceLabel(workplaceKey, 'printerLabel', label)}
            layout="horizontal"
          />
          <LineResourcePickerField
            label="Шаблон"
            kind="template"
            name={['scale_stations', workplaceKey, 'template_id']}
            valueLabel={resourceLabels.scale_stations[workplaceKey].templateLabel}
            onChange={(_id, label) => patchWorkplaceLabel(workplaceKey, 'templateLabel', label)}
            layout="horizontal"
          />
        </div>
      ))}
    </>
  );
}