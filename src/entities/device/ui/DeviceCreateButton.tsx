import { PlusOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import {
  useDeviceFormUiStore,
  type DeviceFormUiDeviceType,
  type ResourceFormConsumerId,
} from '../model/deviceFormUiStore';

export interface DeviceCreateButtonProps {
  /**
   * When set, `DeviceFormModalHost` writes `lastSaved` for this field after save
   * so a matching picker can substitute the new id/name.
   * Omit for orphan create (no field substitution).
   */
  consumerId?: ResourceFormConsumerId;
  /** Device type preselected in the create form. */
  deviceType?: DeviceFormUiDeviceType;
  /**
   * When `true`, disables type select (line / typed picker create).
   * @default false
   */
  lockDeviceType?: boolean;
  /** Pre-selects scale model when creating a scale from a filtered picker. */
  defaultScaleType?: number;
  /**
   * Tooltip / accessible label.
   * @default "Добавить"
   */
  label?: string;
  disabled?: boolean;
  /**
   * Optional click override (tests / legacy local modal).
   * When omitted, dispatches `useDeviceFormUiStore.openCreate(...)`.
   */
  onClick?: () => void;
}

/**
 * Opens device create via {@link useDeviceFormUiStore}.
 *
 * The form modal is rendered by `DeviceFormModalHost` (`widgets/device`),
 * mounted once in AppProviders — this button does not own modal state.
 */
export function DeviceCreateButton({
  consumerId,
  deviceType,
  lockDeviceType,
  defaultScaleType,
  label = 'Добавить',
  disabled,
  onClick,
}: DeviceCreateButtonProps) {
  const openCreate = useDeviceFormUiStore((s) => s.openCreate);

  return (
    <Tooltip title={label}>
      <Button
        icon={<PlusOutlined />}
        disabled={disabled}
        aria-label={label}
        onClick={() => {
          if (onClick) {
            onClick();
            return;
          }
          openCreate({
            consumerId,
            deviceType,
            lockDeviceType,
            defaultScaleType,
          });
        }}
      />
    </Tooltip>
  );
}
