/**
 * Optional shared TypeScript shapes for a **resource-form UI bridge**.
 *
 * Domain zustand stores live in **`entities/<domain>/model`** (one state per
 * domain). Put a store in `shared/model` only when several domains truly share
 * the same UI-intent machine — by default prefer entity-owned stores.
 *
 * Pattern:
 * - Entity Select/Add/Edit dispatches `openCreate` / `openEdit` with an optional
 *   `consumerId` (stable id of the field that should receive the result).
 * - Feature Host subscribes to `dialog`, runs save via React Query mutations,
 *   then `setLastSaved` + `close`.
 * - The originating field calls `consumeLastSaved(consumerId)` once and applies
 *   `id`/`name` to its value.
 *
 * Orphan create (no field substitution) omits `consumerId` and leaves
 * `lastSaved` unused for pickers.
 */

/** Stable id of a Select+Add field instance that should receive a saved resource. */
export type ResourceFormConsumerId = string;

/** Closed dialog — Host renders nothing. */
export type ResourceFormDialogNone = { kind: 'none' };

/** Open create dialog; `consumerId` ties the result to a specific field. */
export type ResourceFormDialogCreate = {
  kind: 'create';
  consumerId?: ResourceFormConsumerId;
};

/**
 * Open edit dialog for an existing resource.
 * Resource-specific stores may rename `resourceId` (e.g. `templateId`).
 */
export type ResourceFormDialogEdit = {
  kind: 'edit';
  resourceId: number;
  consumerId?: ResourceFormConsumerId;
};

export type ResourceFormDialog =
  | ResourceFormDialogNone
  | ResourceFormDialogCreate
  | ResourceFormDialogEdit;

/** One-shot handoff after successful save for the field that opened the form. */
export type ResourceFormLastSaved = {
  consumerId: ResourceFormConsumerId;
  id: number;
  name: string;
};

/**
 * Minimal UI-intent state for a resource-form bridge.
 * Persist / list / detail remain in React Query — not here.
 */
export type ResourceFormUiState = {
  dialog: ResourceFormDialog;
  lastSaved: ResourceFormLastSaved | null;
};

/**
 * Options passed from resource form modals to Host on submit.
 * «Сохранить» → `close: true`; «Применить» → `close: false` (stay open;
 * after create Host switches dialog to edit).
 */
export type ResourceFormSubmitOptions = {
  close: boolean;
};

/** Default for «Сохранить» when callers omit options. */
export const RESOURCE_FORM_SUBMIT_SAVE: ResourceFormSubmitOptions = {
  close: true,
};

/** Options for «Применить» (persist without closing). */
export const RESOURCE_FORM_SUBMIT_APPLY: ResourceFormSubmitOptions = {
  close: false,
};

/**
 * Canonical actions for a resource-form UI store.
 * Implementations may add domain fields (deviceType, lockDeviceType, …).
 */
export type ResourceFormUiActions = {
  openCreate: (consumerId?: ResourceFormConsumerId) => void;
  openEdit: (resourceId: number, consumerId?: ResourceFormConsumerId) => void;
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
