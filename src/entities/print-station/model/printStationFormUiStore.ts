import type {
  ResourceFormConsumerId,
  ResourceFormLastSaved,
} from '@/shared/model';
import { create } from 'zustand';

export type { ResourceFormConsumerId, ResourceFormLastSaved } from '@/shared/model';

/** Closed print-station form dialog. */
export type PrintStationFormDialogNone = { kind: 'none' };

/** Create dialog; optional `consumerId` for Select+Add substitution. */
export type PrintStationFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
};

/** Edit dialog for an existing print station. */
export type PrintStationFormDialogEdit = {
  kind: 'edit';
  stationId: number;
  consumerId?: ResourceFormConsumerId;
};

export type PrintStationFormDialog =
  | PrintStationFormDialogNone
  | PrintStationFormDialogCreate
  | PrintStationFormDialogEdit;

export type PrintStationFormUiState = {
  dialog: PrintStationFormDialog;
  lastSaved: ResourceFormLastSaved | null;
};

export type PrintStationFormUiActions = {
  openCreate: (consumerId?: ResourceFormConsumerId) => void;
  openEdit: (stationId: number, consumerId?: ResourceFormConsumerId) => void;
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

export type PrintStationFormUiStore = PrintStationFormUiState &
  PrintStationFormUiActions;

const initialState: PrintStationFormUiState = {
  dialog: { kind: 'none' },
  lastSaved: null,
};

/**
 * True when both dialogs describe the same UI intent
 * (`kind` / `stationId` / `consumerId`). Used by Host after an async save
 * so a stale in-flight mutation cannot close or hand off to a newer dialog.
 */
export function isSamePrintStationFormDialog(
  a: PrintStationFormDialog,
  b: PrintStationFormDialog,
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
    return a.stationId === b.stationId && a.consumerId === b.consumerId;
  }
  return false;
}

/**
 * UI-intent store for print-station create/edit dialog (domain state in entity).
 *
 * Persist / list / detail stay in React Query (`printStationMutations`).
 * The feature form Host subscribes and saves; entity pickers dispatch
 * open/consume.
 */
export const usePrintStationFormUiStore = create<PrintStationFormUiStore>(
  (set, get) => ({
    ...initialState,

    openCreate: (consumerId) => {
      set({
        dialog:
          consumerId !== undefined
            ? { kind: 'create', consumerId }
            : { kind: 'create' },
      });
    },

    openEdit: (stationId, consumerId) => {
      set({
        dialog:
          consumerId !== undefined
            ? { kind: 'edit', stationId, consumerId }
            : { kind: 'edit', stationId },
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
  }),
);

/** Reset store to initial state (tests / Host unmount / isolation). */
export function resetPrintStationFormUiStore(): void {
  usePrintStationFormUiStore.setState({ ...initialState });
}

/**
 * Drop pending `lastSaved` and close an open dialog owned by `consumerId`.
 *
 * Call from Select/list field unmount cleanup when the field may be destroyed
 * while Host stays mounted (e.g. parent Modal `destroyOnClose`) — otherwise a
 * remounted field can reuse the same `useId` and apply a stale handoff.
 */
export function discardPrintStationFormForConsumer(
  consumerId: ResourceFormConsumerId,
): void {
  const { lastSaved, dialog, close } = usePrintStationFormUiStore.getState();

  if (lastSaved?.consumerId === consumerId) {
    usePrintStationFormUiStore.setState({ lastSaved: null });
  }

  if (
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId === consumerId
  ) {
    close();
  }
}
