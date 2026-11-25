import type {
  ResourceFormConsumerId,
  ResourceFormLastSaved,
} from '@/shared/model';
import { create } from 'zustand';
import type { DeviceType } from './types';

export type { ResourceFormConsumerId, ResourceFormLastSaved } from '@/shared/model';

/**
 * @deprecated Prefer {@link DeviceType}. Kept as alias for form UI call-sites.
 */
export type DeviceFormUiDeviceType = DeviceType;

/** Closed device form dialog. */
export type DeviceFormDialogNone = { kind: 'none' };

/**
 * Create dialog; optional `consumerId` for Select+Add substitution.
 * Type-lock / default scale come from the opening picker (line create).
 */
export type DeviceFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
  deviceType?: DeviceType;
  lockDeviceType?: boolean;
  defaultScaleType?: number;
};

/** Edit dialog for an existing device (`deviceType` required for detail load). */
export type DeviceFormDialogEdit = {
  kind: 'edit';
  deviceId: number;
  deviceType: DeviceType;
  consumerId?: ResourceFormConsumerId;
  lockDeviceType?: boolean;
};

export type DeviceFormDialog =
  | DeviceFormDialogNone
  | DeviceFormDialogCreate
  | DeviceFormDialogEdit;

/** Options for {@link DeviceFormUiActions.openCreate}. */
export type DeviceFormOpenCreateOptions = {
  consumerId?: ResourceFormConsumerId;
  deviceType?: DeviceType;
  lockDeviceType?: boolean;
  defaultScaleType?: number;
};

/** Options for {@link DeviceFormUiActions.openEdit}. */
export type DeviceFormOpenEditOptions = {
  consumerId?: ResourceFormConsumerId;
  deviceType: DeviceType;
  lockDeviceType?: boolean;
};

export type DeviceFormUiState = {
  dialog: DeviceFormDialog;
  lastSaved: ResourceFormLastSaved | null;
};

export type DeviceFormUiActions = {
  openCreate: (options?: DeviceFormOpenCreateOptions) => void;
  openEdit: (deviceId: number, options: DeviceFormOpenEditOptions) => void;
  /** Changes the device type of an open create dialog (ignored when type-locked). */
  setCreateDeviceType: (deviceType: DeviceType) => void;
  close: () => void;
  setLastSaved: (payload: ResourceFormLastSaved) => void;
  /**
   * Returns and clears `lastSaved` when it matches `consumerId`;
   * otherwise returns `null` (other fields must not steal the value).
   */
  consumeLastSaved: (
    consumerId: ResourceFormConsumerId,
  ) => ResourceFormLastSaved | null;
};

export type DeviceFormUiStore = DeviceFormUiState & DeviceFormUiActions;

const initialState: DeviceFormUiState = {
  dialog: { kind: 'none' },
  lastSaved: null,
};

/**
 * True when both dialogs describe the same UI intent
 * (`kind` / ids / type-lock fields / `consumerId`). Used by Host after an async
 * save so a stale in-flight mutation cannot close or hand off to a newer dialog.
 */
export function isSameDeviceFormDialog(
  a: DeviceFormDialog,
  b: DeviceFormDialog,
): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'none') {
    return true;
  }
  if (a.kind === 'create' && b.kind === 'create') {
    return (
      a.consumerId === b.consumerId &&
      a.deviceType === b.deviceType &&
      a.lockDeviceType === b.lockDeviceType &&
      a.defaultScaleType === b.defaultScaleType
    );
  }
  if (a.kind === 'edit' && b.kind === 'edit') {
    return (
      a.deviceId === b.deviceId &&
      a.deviceType === b.deviceType &&
      a.consumerId === b.consumerId &&
      a.lockDeviceType === b.lockDeviceType
    );
  }
  return false;
}

/**
 * UI-intent store for device create/edit dialog (domain state in entity).
 *
 * Persist / list / detail stay in React Query (`useDeviceActions` / mutations).
 * The feature form Host subscribes and saves; entity pickers dispatch open/consume.
 * Type-lock and default scale are carried on the dialog for line/picker create.
 */
export const useDeviceFormUiStore = create<DeviceFormUiStore>((set, get) => ({
  ...initialState,

  openCreate: (options) => {
    const dialog: DeviceFormDialogCreate = { kind: 'create' };
    if (options?.consumerId !== undefined) {
      dialog.consumerId = options.consumerId;
    }
    if (options?.deviceType !== undefined) {
      dialog.deviceType = options.deviceType;
    }
    if (options?.lockDeviceType !== undefined) {
      dialog.lockDeviceType = options.lockDeviceType;
    }
    if (options?.defaultScaleType !== undefined) {
      dialog.defaultScaleType = options.defaultScaleType;
    }
    set({ dialog });
  },

  openEdit: (deviceId, options) => {
    const dialog: DeviceFormDialogEdit = {
      kind: 'edit',
      deviceId,
      deviceType: options.deviceType,
    };
    if (options.consumerId !== undefined) {
      dialog.consumerId = options.consumerId;
    }
    if (options.lockDeviceType !== undefined) {
      dialog.lockDeviceType = options.lockDeviceType;
    }
    set({ dialog });
  },

  setCreateDeviceType: (deviceType) => {
    const { dialog } = get();
    if (dialog.kind !== 'create' || dialog.lockDeviceType) {
      return;
    }
    set({ dialog: { ...dialog, deviceType } });
  },

  close: () => {
    set({ dialog: { kind: 'none' } });
  },

  setLastSaved: (payload) => {
    set({ lastSaved: payload });
  },

  consumeLastSaved: (consumerId) => {
    const { lastSaved } = get();
    if (!lastSaved || lastSaved.consumerId !== consumerId) {
      return null;
    }
    set({ lastSaved: null });
    return lastSaved;
  },
}));

/** Reset store to initial state (tests / Host unmount / isolation). */
export function resetDeviceFormUiStore(): void {
  useDeviceFormUiStore.setState({ ...initialState });
}

/**
 * Drop pending `lastSaved` and close an open dialog owned by `consumerId`.
 *
 * Call from Select/list field unmount cleanup when the field may be destroyed
 * while Host stays mounted (e.g. parent Modal `destroyOnClose`).
 */
export function discardDeviceFormForConsumer(
  consumerId: ResourceFormConsumerId,
): void {
  const { lastSaved, dialog, close } = useDeviceFormUiStore.getState();

  if (lastSaved?.consumerId === consumerId) {
    useDeviceFormUiStore.setState({ lastSaved: null });
  }

  if (
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId === consumerId
  ) {
    close();
  }
}
