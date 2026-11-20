import { useCallback, useEffect, useId } from 'react';
import {
  discardPrintTemplateFormForConsumer,
  usePrintTemplateFormUiStore,
  type ResourceFormConsumerId,
} from '../model/printTemplateFormUiStore';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  ResourceListEditor,
  type ResourceListEditorProps,
} from '@/shared/ui/ResourceListEditor';
import { fetchPrintTemplatesLookup } from '../api/api';
import { printTemplateQueries } from '../queries';

/**
 * Props for {@link PrintTemplateResourceListEditor}.
 *
 * Values are print-template ids; display names come from `labels` (updated via
 * `onLabelChange` on lookup add / Host save). Create/Edit open
 * `usePrintTemplateFormUiStore` — `TemplateFormModalHost` mounts in AppProviders.
 */
export interface PrintTemplateResourceListEditorProps
  extends Omit<
    ResourceListEditorProps,
    'queryKey' | 'fetchFn' | 'renderModal' | 'onCreateClick' | 'onEditClick'
  > {
  /**
   * Stable list id for `lastSaved` substitution after Host save.
   * Auto-generated via `useId` when omitted.
   */
  consumerId?: ResourceFormConsumerId;
  /** Override lookup query key (defaults to print-template lookup root). */
  queryKey?: readonly unknown[];
  /** Override lookup fetch (defaults to {@link fetchPrintTemplatesLookup}). */
  fetchFn?: ResourceListEditorProps['fetchFn'];
  /**
   * Optional create override (tests / legacy local modal).
   * When omitted, dispatches store `openCreate(consumerId)`.
   */
  onCreate?: () => void;
  /**
   * Optional edit override (tests / legacy local modal).
   * When omitted, dispatches store `openEdit(templateId, consumerId)`.
   */
  onEdit?: (templateId: number) => void;
}

/**
 * Multi-value print-template list (`number[]`) on {@link ResourceListEditor}.
 *
 * Lookup add / remove / optional `enableReorder`; Create/Edit via store → Host
 * (not a local modal). After Host save, `consumeLastSaved` appends the id (if
 * new) and updates the label.
 *
 * Modal UI: AppProviders-mounted `TemplateFormModalHost`. Entities must not import features.
 */
export function PrintTemplateResourceListEditor({
  ids,
  labels,
  onChange,
  onLabelChange,
  enableReorder = false,
  disabled,
  consumerId: consumerIdProp,
  queryKey,
  fetchFn,
  placeholder = 'Добавить…',
  createLabel = 'Добавить',
  showCreate = true,
  showEdit = true,
  onCreate: onCreateOverride,
  onEdit: onEditOverride,
}: PrintTemplateResourceListEditorProps) {
  const autoConsumerId = useId();
  const consumerId = consumerIdProp ?? autoConsumerId;

  const openCreate = usePrintTemplateFormUiStore((s) => s.openCreate);
  const openEdit = usePrintTemplateFormUiStore((s) => s.openEdit);
  const lastSaved = usePrintTemplateFormUiStore((s) => s.lastSaved);
  const consumeLastSaved = usePrintTemplateFormUiStore((s) => s.consumeLastSaved);

  const resolvedFetchFn = useCallback(
    (params: ListQueryParams) => {
      if (fetchFn) {
        return fetchFn(params);
      }
      return fetchPrintTemplatesLookup(params);
    },
    [fetchFn],
  );

  const resolvedQueryKey = queryKey ?? printTemplateQueries.keys.all();

  useEffect(() => {
    if (!lastSaved || lastSaved.consumerId !== consumerId) {
      return;
    }
    const saved = consumeLastSaved(consumerId);
    if (!saved) {
      return;
    }
    if (!ids.includes(saved.id)) {
      onChange([...ids, saved.id]);
    }
    onLabelChange?.(saved.id, saved.name);
  }, [lastSaved, consumerId, consumeLastSaved, ids, onChange, onLabelChange]);

  // Same as ResourcePicker: discard handoff / dialog if list unmounts under destroyOnClose.
  useEffect(() => {
    return () => {
      discardPrintTemplateFormForConsumer(consumerId);
    };
  }, [consumerId]);

  return (
    <ResourceListEditor
      ids={ids}
      labels={labels}
      onChange={onChange}
      onLabelChange={onLabelChange}
      enableReorder={enableReorder}
      disabled={disabled}
      queryKey={resolvedQueryKey}
      fetchFn={resolvedFetchFn}
      placeholder={placeholder}
      createLabel={createLabel}
      showCreate={showCreate}
      showEdit={showEdit}
      onCreateClick={() => {
        if (onCreateOverride) {
          onCreateOverride();
          return;
        }
        openCreate(consumerId);
      }}
      onEditClick={(templateId) => {
        if (onEditOverride) {
          onEditOverride(templateId);
          return;
        }
        openEdit(templateId, consumerId);
      }}
    />
  );
}
