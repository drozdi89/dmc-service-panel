import {
  DEFAULT_DEVICE_TYPE,
  isSameDeviceFormDialog,
  resetDeviceFormUiStore,
  useDeviceActions,
  useDeviceFormUiStore,
  type DeviceFormValues,
} from '@/entities/device';
import { DeviceFormModal } from '@/features/device-form';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { RESOURCE_FORM_SUBMIT_SAVE } from '@/shared/model/resourceFormUiBridge';
import { useCallback, useEffect, useRef } from 'react';


/**
 * App-level host for device create/edit.
 *
 * Subscribes to {@link useDeviceFormUiStore}, renders {@link DeviceFormModal},
 * saves via {@link useDeviceActions} (invalidates list/lookup), writes
 * `lastSaved` when `consumerId` is set, then closes on «Сохранить» or keeps open
 * on «Применить» (create → edit). Mount once in {@link import('@/App').AppProviders}.
 *
 * Orphan create/edit (no `consumerId`, e.g. DevicesPage) shows
 * «Устройство сохранено»; nested picker/list saves stay silent.
 * Type-lock / `defaultScaleType` come from the dialog (line Select+Add).
 * After await, `setLastSaved`/`close`/`openEdit` run only if this Host mount is
 * still alive (generation) and `dialog` still matches the submitted snapshot.
 * On unmount bumps generation and resets the store.
 */
export function DeviceFormModalHost() {
  const dialog = useDeviceFormUiStore((state) => state.dialog);
  const close = useDeviceFormUiStore((state) => state.close);
  const setLastSaved = useDeviceFormUiStore((state) => state.setLastSaved);
  const setCreateDeviceType = useDeviceFormUiStore((state) => state.setCreateDeviceType);
  const mountGenerationRef = useRef(0);


  const showSuccessMessage =
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId == null;
  const { saveDevice, isPending } = useDeviceActions({ showSuccessMessage });


  const open = dialog.kind !== 'none';
  const mode = dialog.kind === 'edit' ? 'edit' : 'create';
  const deviceId = dialog.kind === 'edit' ? dialog.deviceId : undefined;
  const deviceType =
    dialog.kind === 'create' || dialog.kind === 'edit'
      ? dialog.deviceType
      : undefined;
  const lockDeviceType =
    dialog.kind === 'create'
      ? (dialog.lockDeviceType ?? false)
      : dialog.kind === 'edit'
        ? (dialog.lockDeviceType ?? true)
        : false;
  const defaultScaleType =
    dialog.kind === 'create' ? dialog.defaultScaleType : undefined;


  useEffect(() => {
    return () => {
      mountGenerationRef.current += 1;
      resetDeviceFormUiStore();
    };
  }, []);


  const handleSubmit = useCallback(
    async (
      values: DeviceFormValues,
      options: ResourceFormSubmitOptions = RESOURCE_FORM_SUBMIT_SAVE,
    ) => {
      const submittedGeneration = mountGenerationRef.current;
      const submitted = useDeviceFormUiStore.getState().dialog;
      if (submitted.kind === 'none') {
        return;
      }


      const submittedType = submitted.deviceType ?? DEFAULT_DEVICE_TYPE;

      try {
        const editId =
          submitted.kind === 'edit' ? submitted.deviceId : undefined;
        const saved = await saveDevice({
          deviceType: submittedType,
          values,
          editId,
        });


        if (mountGenerationRef.current !== submittedGeneration) {
          return;
        }


        const current = useDeviceFormUiStore.getState().dialog;
        if (!isSameDeviceFormDialog(submitted, current)) {
          return;
        }


        if (submitted.consumerId) {
          setLastSaved({
            consumerId: submitted.consumerId,
            id: saved.id,
            name: saved.name,
          });
        }


        if (options.close) {
          close();
        } else if (submitted.kind === 'create') {
          useDeviceFormUiStore.getState().openEdit(saved.id, {
            consumerId: submitted.consumerId,
            deviceType: submittedType,
            lockDeviceType: submitted.lockDeviceType ?? true,
          });
        }
      } catch {
        // Errors are surfaced by useDeviceActions save handler.
      }
    },
    [close, saveDevice, setLastSaved],
  );


  return (
    <DeviceFormModal
      open={open}
      mode={mode}
      deviceType={deviceType}
      deviceId={deviceId}
      lockDeviceType={lockDeviceType}
      defaultScaleType={defaultScaleType}
      submitting={isPending}
      onDeviceTypeChange={setCreateDeviceType}
      onCancel={close}
      onSubmit={(values, options) => {
        void handleSubmit(values, options);
      }}
    />
  );
}

