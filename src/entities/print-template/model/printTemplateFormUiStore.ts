import type {
  ResourceFormConsumerId,
  ResourceFormLastSaved,
} from '@/shared/model';
import { create } from 'zustand';

export type { ResourceFormConsumerId, ResourceFormLastSaved } from '@/shared/model';

/** Closed print-template form dialog. */
export type PrintTemplateFormDialogNone = { kind: 'none' };

/** Create dialog; optional `consumerId` for Select+Add substitution. */
export type PrintTemplateFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
};

/** Edit dialog for an existing template. */
export type PrintTemplateFormDialogEdit = {
  kind: 'edit';
  templateId: number;
  consumerId?: ResourceFormConsumerId;
};

export type PrintTemplateFormDialog =
  | PrintTemplateFormDialogNone
  | PrintTemplateFormDialogCreate
  | PrintTemplateFormDialogEdit;

export type PrintTemplateFormUiState = {
  dialog: PrintTemplateFormDialog;
  lastSaved: ResourceFormLastSaved | null;
};

export type PrintTemplateFormUiActions = {
  openCreate: (consumerId?: ResourceFormConsumerId) => void;
  openEdit: (templateId: number, consumerId?: ResourceFormConsumerId) => void;
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

export type PrintTemplateFormUiStore = PrintTemplateFormUiState &
  PrintTemplateFormUiActions;

const initialState: PrintTemplateFormUiState = {
  dialog: { kind: 'none' },
  lastSaved: null,
};

/**
 * True when both dialogs describe the same UI intent
 * (`kind` / `templateId` / `consumerId`). Used by Host after an async save
 * so a stale in-flight mutation cannot close or hand off to a newer dialog.
 */
export function isSamePrintTemplateFormDialog(
  a: PrintTemplateFormDialog,
  b: PrintTemplateFormDialog,
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
    return a.templateId === b.templateId && a.consumerId === b.consumerId;
  }
  return false;
}

/**
 * UI-intent store for print-template create/edit dialog (domain state in entity).
 *
 * Persist / list / detail stay in React Query (`printTemplateMutations`).
 * The feature form Host subscribes and saves; entity pickers dispatch
 * open/consume.
 */
export const usePrintTemplateFormUiStore = create<PrintTemplateFormUiStore>(
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

    openEdit: (templateId, consumerId) => {
      set({
        dialog:
          consumerId !== undefined
            ? { kind: 'edit', templateId, consumerId }
            : { kind: 'edit', templateId },
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
export function resetPrintTemplateFormUiStore(): void {
  usePrintTemplateFormUiStore.setState({ ...initialState });
}

/**
 * Drop pending `lastSaved` and close an open dialog owned by `consumerId`.
 *
 * Call from Select/list field unmount cleanup when the field may be destroyed
 * while Host stays mounted (e.g. parent Modal `destroyOnClose`) — otherwise a
 * remounted field can reuse the same `useId` and apply a stale handoff.
 */
export function discardPrintTemplateFormForConsumer(
  consumerId: ResourceFormConsumerId,
): void {
  const { lastSaved, dialog, close } = usePrintTemplateFormUiStore.getState();

  if (lastSaved?.consumerId === consumerId) {
    usePrintTemplateFormUiStore.setState({ lastSaved: null });
  }

  if (
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId === consumerId
  ) {
    close();
  }
}
