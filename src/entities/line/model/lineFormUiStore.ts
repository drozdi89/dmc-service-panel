import type {
  ResourceFormConsumerId,
  ResourceFormLastSaved,
} from '@/shared/model';
import { create } from 'zustand';

export type { ResourceFormConsumerId, ResourceFormLastSaved } from '@/shared/model';

/** Closed line form dialog. */
export type LineFormDialogNone = { kind: 'none' };

/** Create dialog; optional `consumerId` for Select+Add substitution. */
export type LineFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
};

/** Edit dialog for an existing production line. */
export type LineFormDialogEdit = {
  kind: 'edit';
  lineId: number;
  consumerId?: ResourceFormConsumerId;
};

export type LineFormDialog =
  | LineFormDialogNone
  | LineFormDialogCreate
  | LineFormDialogEdit;

export type LineFormUiState = {
  dialog: LineFormDialog;
  lastSaved: ResourceFormLastSaved | null;
};

export type LineFormUiActions = {
  openCreate: (consumerId?: ResourceFormConsumerId) => void;
  openEdit: (lineId: number, consumerId?: ResourceFormConsumerId) => void;
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

export type LineFormUiStore = LineFormUiState & LineFormUiActions;

const initialState: LineFormUiState = {
  dialog: { kind: 'none' },
  lastSaved: null,
};

/**
 * True when both dialogs describe the same UI intent
 * (`kind` / `lineId` / `consumerId`). Used by Host after an async save
 * so a stale in-flight mutation cannot close or hand off to a newer dialog.
 */
export function isSameLineFormDialog(
  a: LineFormDialog,
  b: LineFormDialog,
): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'none') {
    return true;
  }
  if (a.kind === 'create' && b.kind === 'create') {
    return a.consumerId === b.consumerId;
  }
  if (a.kind === 'edit' && b.kind === 'edit') {
    return a.lineId === b.lineId && a.consumerId === b.consumerId;
  }
  return false;
}

/**
 * UI-intent store for line create/edit dialog (domain state in entity).
 *
 * Persist / list / detail stay in React Query + {@link import('@/services/line-service').saveLineConfiguration}.
 * The widget Host subscribes and saves; list/pickers dispatch open/consume.
 */
export const useLineFormUiStore = create<LineFormUiStore>((set, get) => ({
  ...initialState,

  openCreate: (consumerId) => {
    set({
      dialog:
        consumerId !== undefined
          ? { kind: 'create', consumerId }
          : { kind: 'create' },
    });
  },

  openEdit: (lineId, consumerId) => {
    set({
      dialog:
        consumerId !== undefined
          ? { kind: 'edit', lineId, consumerId }
          : { kind: 'edit', lineId },
    });
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
export function resetLineFormUiStore(): void {
  useLineFormUiStore.setState({ ...initialState });
}

/**
 * Drop pending `lastSaved` and close an open dialog owned by `consumerId`.
 *
 * Call from Select/list field unmount cleanup when the field may be destroyed
 * while Host stays mounted (e.g. parent Modal `destroyOnClose`).
 */
export function discardLineFormForConsumer(
  consumerId: ResourceFormConsumerId,
): void {
  const { lastSaved, dialog, close } = useLineFormUiStore.getState();

  if (lastSaved?.consumerId === consumerId) {
    useLineFormUiStore.setState({ lastSaved: null });
  }

  if (
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId === consumerId
  ) {
    close();
  }
}
