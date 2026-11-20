import { Flex } from 'antd';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  discardPrintTemplateFormForConsumer,
  usePrintTemplateFormUiStore,
  type ResourceFormConsumerId,
} from '../model/printTemplateFormUiStore';
import type {
  AsyncLookupSelectProps,
  LookupOption,
} from '@/shared/ui/AsyncLookupSelect';
import type { PrintTemplate } from '../model/types';
import { PrintTemplateCreateButton } from './PrintTemplateCreateButton';
import { PrintTemplateEditButton } from './PrintTemplateEditButton';
import { SelectPrintTemplate } from './SelectPrintTemplate';

type SelectChromeProps = Omit<
  AsyncLookupSelectProps<PrintTemplate>,
  'queryKey' | 'fetchFn' | 'mapOption'
>;

/**
 * Props for {@link PrintTemplateResourcePicker} (Select + Add/Edit chrome).
 *
 * Typical usage opens the form via `usePrintTemplateFormUiStore` and
 * `TemplateFormModalHost` (AppProviders). Optional `onCreate` / `onEdit` override
 * store dispatch for tests.
 */
export interface PrintTemplateResourcePickerProps extends SelectChromeProps {
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
   * When omitted, dispatches store `openCreate(consumerId)`.
   */
  onCreate?: () => void;
  /**
   * Optional edit override (tests).
   * When omitted, dispatches store `openEdit(templateId, consumerId)`.
   */
  onEdit?: (value: string | number) => void;
  /** Optional slot (prefer AppProviders-mounted Host). */
  modalSlot?: ReactNode;
}

/**
 * Print-template Select+Add (+ Edit): {@link SelectPrintTemplate} plus store-driven
 * {@link PrintTemplateCreateButton} / {@link PrintTemplateEditButton}.
 *
 * After Host save, `consumeLastSaved(consumerId)` substitutes id/name via `onChange`.
 * Modal UI lives in `TemplateFormModalHost` — mount once in AppProviders.
 *
 * Select-only without chrome: {@link SelectPrintTemplate}.
 */
export function PrintTemplateResourcePicker({
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
  ...selectProps
}: PrintTemplateResourcePickerProps) {
  const autoConsumerId = useId();
  const consumerId = consumerIdProp ?? autoConsumerId;

  const [localLabel, setLocalLabel] = useState<string | undefined>(
    valueLabel ?? selectedOptionProp?.label,
  );
  const lastSaved = usePrintTemplateFormUiStore((s) => s.lastSaved);
  const consumeLastSaved = usePrintTemplateFormUiStore((s) => s.consumeLastSaved);

  // Prefer parent label when it applies to the current value; keep localLabel
  // only as optimistic fallback (pick / consumeLastSaved before parent catches up).
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

  // Parent Modal `destroyOnClose` can unmount this field while Host stays mounted.
  useEffect(() => {
    return () => {
      discardPrintTemplateFormForConsumer(consumerId);
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

  const templateId =
    value === undefined || value === null || value === ''
      ? null
      : Number(value);

  return (
    <Flex wrap align="start" gap="0.5rem">
      <SelectPrintTemplate
        {...selectProps}
        allowClear={allowClear}
        disabled={disabled}
        value={value}
        selectedOption={selectedOption}
        style={{ flex: 1, ...selectProps.style }}
        onChange={(nextValue, option) => {
          setLocalLabel(option?.label);
          onChange?.(nextValue, option);
        }}
      />
      {showCreate ? (
        <PrintTemplateCreateButton
          consumerId={consumerId}
          label={createLabel}
          disabled={disabled}
          onClick={onCreateOverride}
        />
      ) : null}
      {showEdit ? (
        <PrintTemplateEditButton
          templateId={
            templateId !== null && !Number.isNaN(templateId) ? templateId : null
          }
          consumerId={consumerId}
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
