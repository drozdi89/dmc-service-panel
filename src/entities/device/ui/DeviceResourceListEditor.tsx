import { useCallback, useEffect, useId } from 'react';
import {
  discardDeviceFormForConsumer,
  useDeviceFormUiStore,
  type ResourceFormConsumerId,
} from '../model/deviceFormUiStore';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  ResourceListEditor,
  type ResourceListEditorProps,
} from '@/shared/ui/ResourceListEditor';
import { fetchDevicesLookup } from '../api/api';
import type { DeviceType } from '../model/types';

/**
 * Props for {@link DeviceResourceListEditor}.
 *
 * Values are device ids; display names come from `labels`. Create/Edit open
 * `useDeviceFormUiStore` with locked `deviceType` — `DeviceFormModalHost`
 * mounts in AppProviders.
 */
export interface DeviceResourceListEditorProps
  extends Omit<
    ResourceListEditorProps,
    'queryKey' | 'fetchFn' | 'renderModal' | 'onCreateClick' | 'onEditClick'
  > {
  /** Locked device type for create/edit and default lookup filter. */
  deviceType: DeviceType;
  /**
   * Stable list id for `lastSaved` substitution after Host save.
   * Auto-generated via `useId` when omitted.
   */
  consumerId?: ResourceFormConsumerId;
  /** Override lookup query key. */
  queryKey?: readonly unknown[];
  /** Override lookup fetch (defaults to devices lookup for `deviceType`). */
  fetchFn?: ResourceListEditorProps['fetchFn'];
  /**
   * Optional create override (tests / legacy local modal).
   * When omitted, dispatches store `openCreate` with type lock.
   */
  onCreate?: () => void;
  /**
   * Optional edit override (tests / legacy local modal).
   * When omitted, dispatches store `openEdit(deviceId, …)`.
   */
  onEdit?: (deviceId: number) => void;
}

/**
 * Multi-value device list (`number[]`) on {@link ResourceListEditor}.
 *
 * Lookup add / remove / optional `enableReorder`; Create/Edit via store → Host
 * (not a local modal). After Host save, `consumeLastSaved` appends the id (if
 * new) and updates the label.
 *
 * Modal UI: AppProviders-mounted `DeviceFormModalHost`. Entities must not import features.
 */
export function DeviceResourceListEditor({
  ids,
  labels,
  onChange,
  onLabelChange,
  deviceType,
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
}: DeviceResourceListEditorProps) {
  const autoConsumerId = useId();
  const consumerId = consumerIdProp ?? autoConsumerId;

  const openCreate = useDeviceFormUiStore((s) => s.openCreate);
  const openEdit = useDeviceFormUiStore((s) => s.openEdit);
  const lastSaved = useDeviceFormUiStore((s) => s.lastSaved);
  const consumeLastSaved = useDeviceFormUiStore((s) => s.consumeLastSaved);

  const resolvedFetchFn = useCallback(
    (params: ListQueryParams) => {
      if (fetchFn) {
        return fetchFn(params);
      }
      return fetchDevicesLookup({
        ...params,
        types: [deviceType],
      });
    },
    [deviceType, fetchFn],
  );

  const resolvedQueryKey = queryKey ?? ['devices', deviceType, 'resource-list'];

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

  useEffect(() => {
    return () => {
      discardDeviceFormForConsumer(consumerId);
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
        openCreate({
          consumerId,
          deviceType,
          lockDeviceType: true,
        });
      }}
      onEditClick={(resourceId) => {
        if (onEditOverride) {
          onEditOverride(resourceId);
          return;
        }
        openEdit(resourceId, {
          consumerId,
          deviceType,
          lockDeviceType: true,
        });
      }}
    />
  );
}
