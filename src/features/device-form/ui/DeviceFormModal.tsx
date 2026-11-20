import {
  createDefaultFormValues,
  mapDeviceDetailToFormValues,
  useDeviceDetailQuery,
  type DeviceFormValues,
  type DeviceType,
} from '@/entities/device';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { LoadingOverlay } from '@/shared/ui/loading';
import { Alert, Form, Modal } from 'antd';
import { useEffect, useMemo } from 'react';
import { DeviceFormFields } from './DeviceFormFields';

/** Props for device create/edit modal (ResourcePicker-ready). */
export interface DeviceFormModalProps {
  open: boolean;
  title?: string;
  mode: 'create' | 'edit';
  deviceType?: DeviceType;
  deviceId?: number;
  /** Disables device type select (edit mode or fixed picker context). */
  lockDeviceType?: boolean;
  /** Pre-selects scale model when creating a scale from a filtered picker. */
  defaultScaleType?: number;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: DeviceFormValues,
    options: ResourceFormSubmitOptions,
  ) => void;
}

/**
 * Modal form for device CRUD with type-specific fields.
 *
 * Public API of `device-form`: one modal for all device types. Create from a
 * line/picker field should pass `lockDeviceType` and optional `defaultScaleType`.
 */
export function DeviceFormModal({
  open,
  title,
  mode,
  deviceType,
  deviceId,
  lockDeviceType = mode === 'edit',
  defaultScaleType,
  submitting = false,
  onCancel,
  onSubmit,
}: DeviceFormModalProps) {
  const [form] = Form.useForm<DeviceFormValues>();

  const resolvedTitle =
    title ?? (mode === 'edit' ? 'Редактирование устройства' : 'Новое устройство');

  const canLoad = open && mode === 'edit' && deviceId !== undefined && deviceType !== undefined;

  const {
    data: loadedDevice,
    isLoading: isLoadingDevice,
    isError: isLoadError,
  } = useDeviceDetailQuery(deviceType, deviceId, {
    enabled: canLoad,
  });

  const submitDisabled =
    submitting || (mode === 'edit' && canLoad && (isLoadingDevice || isLoadError || !loadedDevice));

  const initialCreateValues = useMemo(
    () =>
      createDefaultFormValues(deviceType ?? 'camera', {
        scaleType: defaultScaleType,
      }),
    [deviceType, defaultScaleType],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'create') {
      form.setFieldsValue(initialCreateValues);
      return;
    }

    if (loadedDevice && deviceType) {
      form.setFieldsValue(mapDeviceDetailToFormValues(deviceType, loadedDevice));
    }
  }, [open, mode, form, initialCreateValues, loadedDevice, deviceType]);

  return (
    <Modal
      open={open}
      destroyOnHidden={false}
      title={resolvedTitle}
      width={760}
      onCancel={onCancel}
      keyboard={!submitting}
      style={{ top: '1rem' }}
      styles={{
        body: {
          height: 'calc(100vh - 10rem)',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
      }}
      footer={resourceFormModalFooter({
        submitting,
        submitDisabled,
        onCancel,
        onSubmit: (options) => {
          void (async () => {
            try {
              const values = await form.validateFields();
              onSubmit(values, options);
            } catch {
              // Validation errors are shown on form fields.
            }
          })();
        },
      })}
    >
      <LoadingOverlay loading={isLoadingDevice}>
        {isLoadError && canLoad ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить данные устройства"
            description="Сохранение недоступно. Закройте окно и попробуйте снова."
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form
          form={form}
          initialValues={mode === 'create' ? initialCreateValues : undefined}
          disabled={isLoadError && canLoad}
          layout="horizontal"
        >
          <DeviceFormFields
            deviceType={deviceType}
            lockDeviceType={lockDeviceType}
            defaultScaleType={defaultScaleType}
          />
        </Form>
      </LoadingOverlay>
    </Modal>
  );
}
