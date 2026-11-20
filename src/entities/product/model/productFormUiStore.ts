import type { ResourceFormConsumerId } from '@/shared/model';
import { create } from 'zustand';

export type { ResourceFormConsumerId } from '@/shared/model';

/**
 * One-shot handoff after successful product save.
 * Uses `gtin` (string) instead of numeric {@link import('@/shared/model').ResourceFormLastSaved.id}.
 */
export type ProductFormLastSaved = {
  consumerId: ResourceFormConsumerId;
  gtin: string;
  name: string;
};

/** Closed product form dialog. */
export type ProductFormDialogNone = { kind: 'none' };

/** Create dialog; optional `consumerId` for Select+Add substitution. */
export type ProductFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
};

/** Edit dialog for an existing product (keyed by GTIN). */
export type ProductFormDialogEdit = {
  kind: 'edit';
  gtin: string;
  consumerId?: ResourceFormConsumerId;
};

export type ProductFormDialog =
  | ProductFormDialogNone
  | ProductFormDialogCreate
  | ProductFormDialogEdit;

export type ProductFormUiState = {
  dialog: ProductFormDialog;
  lastSaved: ProductFormLastSaved | null;
};

export type ProductFormUiActions = {
  openCreate: (consumerId?: ResourceFormConsumerId) => void;
  openEdit: (gtin: string, consumerId?: ResourceFormConsumerId) => void;
  close: () => void;
  setLastSaved: (payload: ProductFormLastSaved) => void;
  /**
   * Returns and clears `lastSaved` when it matches `consumerId`;
   * otherwise returns `null` (other fields must not steal the value).
   */
  consumeLastSaved: (
    consumerId: ResourceFormConsumerId,
  ) => ProductFormLastSaved | null;
};

export type ProductFormUiStore = ProductFormUiState & ProductFormUiActions;

const initialState: ProductFormUiState = {
  dialog: { kind: 'none' },
  lastSaved: null,
};

/**
 * True when both dialogs describe the same UI intent
 * (`kind` / `gtin` / `consumerId`). Used by Host after an async save
 * so a stale in-flight mutation cannot close or hand off to a newer dialog.
 */
export function isSameProductFormDialog(
  a: ProductFormDialog,
  b: ProductFormDialog,
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
    return a.gtin === b.gtin && a.consumerId === b.consumerId;
  }
  return false;
}

/**
 * UI-intent store for product create/edit dialog (domain state in entity).
 *
 * Persist / list / detail stay in React Query (`useProductFormSave`).
 * The widget Host subscribes and saves; entity pickers dispatch open/consume.
 */
export const useProductFormUiStore = create<ProductFormUiStore>((set, get) => ({
  ...initialState,

  openCreate: (consumerId) => {
    set({
      dialog:
        consumerId !== undefined
          ? { kind: 'create', consumerId }
          : { kind: 'create' },
    });
  },

  openEdit: (gtin, consumerId) => {
    set({
      dialog:
        consumerId !== undefined
          ? { kind: 'edit', gtin, consumerId }
          : { kind: 'edit', gtin },
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
export function resetProductFormUiStore(): void {
  useProductFormUiStore.setState({ ...initialState });
}

/**
 * Drop pending `lastSaved` and close an open dialog owned by `consumerId`.
 *
 * Call from Select/list field unmount cleanup when the field may be destroyed
 * while Host stays mounted (e.g. parent Modal `destroyOnClose`).
 */
export function discardProductFormForConsumer(
  consumerId: ResourceFormConsumerId,
): void {
  const { lastSaved, dialog, close } = useProductFormUiStore.getState();

  if (lastSaved?.consumerId === consumerId) {
    useProductFormUiStore.setState({ lastSaved: null });
  }

  if (
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId === consumerId
  ) {
    close();
  }
}
