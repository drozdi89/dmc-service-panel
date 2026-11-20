/**
 * # Shared model (`shared/model`)
 *
 * Optional shared **types** (and, only when necessary, shared zustand stores)
 * for cross-cutting UI patterns.
 *
 * ## Default
 * Domain UI-intent state (form dialogs, `lastSaved`, …) lives in
 * **`entities/<domain>/model`** — one store per domain.
 *
 * ## Allowed here
 * - Shared TypeScript contracts reused by several entity stores
 *   (e.g. {@link ResourceFormUiState})
 * - A zustand store **only** when multiple domains must share one machine
 *
 * ## Forbidden
 * - Domain form/dialog stores (print-template, device, …) — put them in the entity
 * - Server / domain cache — use React Query in entities
 *
 * @see {@link ResourceFormUiState} example contract for resource-form bridges
 */

export type {
  ResourceFormConsumerId,
  ResourceFormDialog,
  ResourceFormDialogCreate,
  ResourceFormDialogEdit,
  ResourceFormDialogNone,
  ResourceFormLastSaved,
  ResourceFormUiActions,
  ResourceFormUiState
} from './resourceFormUiBridge';
export {
  Template
} from './template';
