import { Flex } from 'antd';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  discardDeviceFormForConsumer,
  useDeviceFormUiStore,
  type ResourceFormConsumerId,
} from '../model/deviceFormUiStore';
import {
  AsyncLookupSelect,
  type AsyncLookupSelectProps,
  type LookupOption,
} from '@/shared/ui/AsyncLookupSelect';
import { fetchDevicesLookup, fetchScalesLookup } from '../api/api';
import type { DeviceListItem, DeviceType } from '../model/types';
import { DEVICE_SCALES_PREFIX, deviceQueries } from '../queries';
import { DeviceCreateButton } from './DeviceCreateButton';
import { DeviceEditButton } from './DeviceEditButton';

type SelectChromeProps = Omit<
  AsyncLookupSelectProps<DeviceListItem>,
  'queryKey' | 'fetchFn' | 'mapOption'
>;

/**
 * Props for {@link DeviceResourcePicker} (Select + Add/Edit chrome).
 *
 * Typical usage opens the form via `useDeviceFormUiStore` and
 * `DeviceFormModalHost` (AppProviders). Optional `onCreate` / `onEdit` override
 * store dispatch for tests.
 */
export interface DeviceResourcePickerProps extends SelectChromeProps {
  /** Restrict unified devices lookup to these types. */
  types?: DeviceType[];
  /**
   * Type locked in create/edit modal.
   * Defaults to `types[0]` or `'camera'`.
   */
  deviceType?: DeviceType;
  /**
   * Include only these ScaleType values.
   * When set (or `excludeScaleTypes`), uses {@link fetchScalesLookup}.
   */
  scaleTypes?: number[];
  /** Exclude these ScaleType values from scale lookup. */
  excludeScaleTypes?: number[];
  /** Default scale model when creating a scale from a filtered picker. */
  defaultScaleType?: number;
  /**
   * When `false`, create keeps type unlocked (DevicesPage orphan).
   * Picker contexts (line / print-station) should leave default `true`.
   * @default true
   */
  lockDeviceType?: boolean;
  /**
   * Stable field id for `lastSaved` substitution after Host save.
   * Auto-generated via `useId` when omitted.
   */
  consumerId?: ResourceFormConsumerId;
  /**
   * Label for the create button.
   * @default "Добавить"
   */
  createLabel?: string;
  /**
   * Label for the edit button.
   * @default "Изменить"
   */
  editLabel?: string;
  /**
   * When `false`, hides Create.
   * @default true
   */
  showCreate?: boolean;
  /**
   * When `false`, hides Edit.
   * @default true
   */
  showEdit?: boolean;
  /**
   * Optional create override (tests).
   * When omitted, dispatches store `openCreate` with type-lock options.
   */
  onCreate?: () => void;
  /**
   * Optional edit override (tests).
   * When omitted, dispatches store `openEdit(deviceId, …)`.
   */
  onEdit?: (value: string | number) => void;
  /** Optional slot (prefer AppProviders-mounted Host). */
  modalSlot?: ReactNode;
}

/**
 * Device Select+Add (+ Edit): lookup select plus store-driven
 * {@link DeviceCreateButton} / {@link DeviceEditButton}.
 *
 * After Host save, `consumeLastSaved(consumerId)` substitutes id/name via `onChange`.
 * Modal UI lives in `DeviceFormModalHost` — mount once in AppProviders.
 *
 * Select-only without chrome: {@link SelectDevice}.
 */
export function DeviceResourcePicker({
  types,
  deviceType: deviceTypeProp,
  scaleTypes,
  excludeScaleTypes,
  defaultScaleType,
  lockDeviceType = true,
  consumerId: consumerIdProp,
  createLabel = 'Добавить',
  editLabel = 'Изменить',
  showCreate = true,
  showEdit = true,
  onCreate: onCreateOverride,
  onEdit: onEditOverride,
  value,
  valueLabel,
  selectedOption: selectedOptionProp,
  onChange,
  modalSlot,
  allowClear = true,
  disabled,
  placeholder = 'Не используется',
  extraParams,
  ...selectProps
}: DeviceResourcePickerProps) {
  const autoConsumerId = useId();
  const consumerId = consumerIdProp ?? autoConsumerId;

  const deviceType = deviceTypeProp ?? types?.[0] ?? 'camera';
  const resolvedTypes = types ?? [deviceType];

  const useScaleLookup =
    deviceType === 'scale' &&
    ((scaleTypes?.length ?? 0) > 0 || (excludeScaleTypes?.length ?? 0) > 0);

  const queryKey = useScaleLookup
    ? DEVICE_SCALES_PREFIX
    : deviceQueries.keys.all();

  const mergedExtraParams = useMemo(() => {
    if (useScaleLookup) {
      return {
        ...extraParams,
        ...(scaleTypes && scaleTypes.length > 0 ? { scaleTypes } : {}),
        ...(excludeScaleTypes && excludeScaleTypes.length > 0
          ? { excludeScaleTypes }
          : {}),
      };
    }
    return {
      ...extraParams,
      ...(resolvedTypes.length > 0 ? { types: resolvedTypes } : {}),
    };
  }, [
    excludeScaleTypes,
    extraParams,
    resolvedTypes,
    scaleTypes,
    useScaleLookup,
  ]);

  const [localLabel, setLocalLabel] = useState<string | undefined>(
    valueLabel ?? selectedOptionProp?.label,
  );
  const lastSaved = useDeviceFormUiStore((s) => s.lastSaved);
  const consumeLastSaved = useDeviceFormUiStore((s) => s.consumeLastSaved);

  useEffect(() => {
    if (selectedOptionProp != null && selectedOptionProp.value === value) {
      setLocalLabel(selectedOptionProp.label);
      return;
    }
    if (valueLabel !== undefined) {
      setLocalLabel(valueLabel);
    }
  }, [value, valueLabel, selectedOptionProp]);

  useEffect(() => {
    if (!lastSaved || lastSaved.consumerId !== consumerId) {
      return;
    }
    const saved = consumeLastSaved(consumerId);
    if (!saved) {
      return;
    }
    setLocalLabel(saved.name);
    onChange?.(saved.id, { value: saved.id, label: saved.name });
  }, [lastSaved, consumerId, consumeLastSaved, onChange]);

  useEffect(() => {
    return () => {
      discardDeviceFormForConsumer(consumerId);
    };
  }, [consumerId]);

  const selectedOption = useMemo((): LookupOption | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const controlledLabel =
      selectedOptionProp != null && selectedOptionProp.value === value
        ? selectedOptionProp.label
        : valueLabel;
    return {
      value,
      label: controlledLabel ?? localLabel ?? `#${value}`,
    };
  }, [localLabel, selectedOptionProp, value, valueLabel]);

  const deviceId =
    value === undefined || value === null || value === ''
      ? null
      : Number(value);

  return (
    <Flex wrap align="start" gap="0.5rem">
      <AsyncLookupSelect<DeviceListItem>
        {...selectProps}
        queryKey={queryKey}
        fetchFn={useScaleLookup ? fetchScalesLookup : fetchDevicesLookup}
        mapOption={(item) => ({ value: item.id, label: item.name })}
        extraParams={mergedExtraParams}
        allowClear={allowClear}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        selectedOption={selectedOption}
        style={{ flex: 1, ...selectProps.style }}
        onChange={(nextValue, option) => {
          setLocalLabel(option?.label);
          onChange?.(nextValue, option);
        }}
      />
      {showCreate ? (
        <DeviceCreateButton
          consumerId={consumerId}
          deviceType={deviceType}
          lockDeviceType={lockDeviceType}
          defaultScaleType={defaultScaleType}
          label={createLabel}
          disabled={disabled}
          onClick={onCreateOverride}
        />
      ) : null}
      {showEdit ? (
        <DeviceEditButton
          deviceId={
            deviceId !== null && !Number.isNaN(deviceId) ? deviceId : null
          }
          deviceType={deviceType}
          consumerId={consumerId}
          lockDeviceType={lockDeviceType}
          label={editLabel}
          disabled={disabled}
          onClick={
            onEditOverride
              ? () => {
                  if (value !== undefined && value !== null && value !== '') {
                    onEditOverride(value);
                  }
                }
              : undefined
          }
        />
      ) : null}
      {modalSlot}
    </Flex>
  );
}
