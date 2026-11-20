import type {
  ResourceFormConsumerId,
  ResourceFormLastSaved,
} from '@/shared/model';
import { create } from 'zustand';

export type { ResourceFormConsumerId, ResourceFormLastSaved } from '@/shared/model';

/** Closed code-generator-template form dialog. */
export type CodeGeneratorTemplateFormDialogNone = { kind: 'none' };

/** Create dialog; optional `consumerId` for Select+Add substitution. */
export type CodeGeneratorTemplateFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
};

/** Edit dialog for an existing template. */
export type CodeGeneratorTemplateFormDialogEdit = {
  kind: 'edit';
  templateId: number;
  consumerId?: ResourceFormConsumerId;
};

export type CodeGeneratorTemplateFormDialog =
  | CodeGeneratorTemplateFormDialogNone
  | CodeGeneratorTemplateFormDialogCreate
  | CodeGeneratorTemplateFormDialogEdit;

export type CodeGeneratorTemplateFormUiState = {
  dialog: CodeGeneratorTemplateFormDialog;
  lastSaved: ResourceFormLastSaved | null;
};

export type CodeGeneratorTemplateFormUiActions = {
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

export type CodeGeneratorTemplateFormUiStore = CodeGeneratorTemplateFormUiState &
  CodeGeneratorTemplateFormUiActions;

const initialState: CodeGeneratorTemplateFormUiState = {
  dialog: { kind: 'none' },
  lastSaved: null,
};

/**
 * True when both dialogs describe the same UI intent
 * (`kind` / `templateId` / `consumerId`). Used by Host after an async save
 * so a stale in-flight mutation cannot close or hand off to a newer dialog.
 */
export function isSameCodeGeneratorTemplateFormDialog(
  a: CodeGeneratorTemplateFormDialog,
  b: CodeGeneratorTemplateFormDialog,
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
 * UI-intent store for code-generator-template create/edit dialog (domain state in entity).
 *
 * Persist / list / detail stay in React Query (`useCodeGeneratorTemplateMutations` / actions).
 * The feature form Host subscribes and saves; entity pickers dispatch open/consume.
 */
export const useCodeGeneratorTemplateFormUiStore =
  create<CodeGeneratorTemplateFormUiStore>((set, get) => ({
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
  }));

/** Reset store to initial state (tests / Host unmount / isolation). */
export function resetCodeGeneratorTemplateFormUiStore(): void {
  useCodeGeneratorTemplateFormUiStore.setState({ ...initialState });
}

/**
 * Drop pending `lastSaved` and close an open dialog owned by `consumerId`.
 *
 * Call from Select/list field unmount cleanup when the field may be destroyed
 * while Host stays mounted — otherwise a remounted field can reuse the same
 * `useId` and apply a stale handoff.
 */
export function discardCodeGeneratorTemplateFormForConsumer(
  consumerId: ResourceFormConsumerId,
): void {
  const { lastSaved, dialog, close } =
    useCodeGeneratorTemplateFormUiStore.getState();

  if (lastSaved?.consumerId === consumerId) {
    useCodeGeneratorTemplateFormUiStore.setState({ lastSaved: null });
  }

  if (
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId === consumerId
  ) {
    close();
  }
}
