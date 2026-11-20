import { EditOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import {
  useDeviceFormUiStore,
  type DeviceFormUiDeviceType,
  type ResourceFormConsumerId,
} from '../model/deviceFormUiStore';

export interface DeviceEditButtonProps {
  /** Device id to edit; button stays disabled when missing. */
  deviceId?: number | null;
  /** Device type required for detail load in Host. */
  deviceType: DeviceFormUiDeviceType;
  /**
   * When set, Host writes `lastSaved` for this field after save
   * so a matching picker can substitute the updated id/name.
   */
  consumerId?: ResourceFormConsumerId;
  /**
   * When `true`, disables type select.
   * @default true
   */
  lockDeviceType?: boolean;
  /**
   * Tooltip / accessible label.
   * @default "Изменить"
   */
  label?: string;
  disabled?: boolean;
  /**
   * Optional click override (tests / legacy local modal).
   * When omitted, dispatches `useDeviceFormUiStore.openEdit(...)`.
   */
  onClick?: () => void;
}

/**
 * Opens device edit via {@link useDeviceFormUiStore}.
 *
 * The form modal is rendered by `DeviceFormModalHost` (`widgets/device`),
 * mounted once in AppProviders — this button does not own modal state.
 */
export function DeviceEditButton({
  deviceId,
  deviceType,
  consumerId,
  lockDeviceType = true,
  label = 'Изменить',
  disabled,
  onClick,
}: DeviceEditButtonProps) {
  const openEdit = useDeviceFormUiStore((s) => s.openEdit);
  const canEdit =
    deviceId !== undefined && deviceId !== null && !Number.isNaN(deviceId);

  return (
    <Tooltip title={canEdit ? label : undefined}>
      <Button
        icon={<EditOutlined />}
        disabled={disabled || !canEdit}
        aria-label={label}
        onClick={() => {
          if (!canEdit) {
            return;
          }
          if (onClick) {
            onClick();
            return;
          }
          openEdit(deviceId, {
            deviceType,
            consumerId,
            lockDeviceType,
          });
        }}
      />
    </Tooltip>
  );
}
