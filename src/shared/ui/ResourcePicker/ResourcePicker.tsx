import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import {
  AsyncLookupSelect,
  type AsyncLookupSelectProps,
} from '../AsyncLookupSelect';

/**
 * Shared resource UI factory matrix (when to use which):
 *
 * | Pattern | Factory | When |
 * |---|---|---|
 * | **Select-only** | `AsyncLookupSelect` / `AsyncSelect` | Choose an existing resource; no Create/Edit chrome. |
 * | **Select+Add** (+ optional Edit) | {@link ResourcePicker} | Lookup select plus inline Create/Edit actions. |
 * | **Sortable list** | `ResourceListEditor` (`enableReorder`) | Multi-value bordered list with optional ↑/↓ reorder. |
 *
 * Also: plain antd `Select` for closed enums; `SelectLoading` as the internal select shell.
 */
export interface ResourcePickerProps<T extends object>
  extends AsyncLookupSelectProps<T> {
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
   * When `false`, hides the Create button even if {@link ResourcePickerProps.onCreate} is set.
   * Defaults to visible whenever `onCreate` is provided.
   */
  showCreate?: boolean;
  /**
   * When `false`, hides the Edit button even if {@link ResourcePickerProps.onEdit} is set.
   * Defaults to visible whenever `onEdit` is provided. Edit stays optional — omit `onEdit` for Select+Add only.
   */
  showEdit?: boolean;
  /** Opens create modal/drawer. Omit (or pass `showCreate={false}`) for select-only chrome. */
  onCreate?: () => void;
  /** Opens edit modal for the selected resource. Omit to keep Edit off. */
  onEdit?: (value: string | number) => void;
  /** Optional slot for modal content. */
  modalSlot?: ReactNode;
}

/**
 * Select+Add (+ optional Edit) pattern for devices, templates, and related resources.
 *
 * Create/Edit buttons render only when the matching callback is passed and the
 * corresponding `showCreate` / `showEdit` flag is not `false`. Passing neither
 * callback yields select-only behaviour (same as wrapping {@link AsyncLookupSelect}).
 *
 * Lookup contract (Qt LineConfiguration parity):
 * - Search: delegated to {@link AsyncLookupSelect} — server-side `q`, debounced.
 * - Clear: `allowClear` defaults to `true`; cleared value is `null` (optional resource).
 * - Placeholder: use `"Не используется"` for unset device/template fields.
 * - Shared props with other async factories: `queryKey`, `mapOption`,
 *   `selectedOption` / `valueLabel`, `value` / `onChange`.
 */
export function ResourcePicker<T extends object>({
  createLabel = 'Добавить',
  editLabel = 'Изменить',
  showCreate,
  showEdit,
  onCreate,
  onEdit,
  value,
  modalSlot,
  allowClear = true,
  ...selectProps
}: ResourcePickerProps<T>) {
  const canEdit = value !== undefined && value !== null && value !== '';
  const createVisible = Boolean(onCreate) && (showCreate ?? true);
  const editVisible = Boolean(onEdit) && (showEdit ?? true);

  return (
    <Flex wrap align="start" gap="0.5rem">
      <AsyncLookupSelect<T> {...selectProps} allowClear={allowClear} value={value} style={{ flex: 1 }} />
      {createVisible ? (
        <Tooltip title={createLabel}>
          <Button icon={<PlusOutlined />} onClick={onCreate} />
        </Tooltip>
      ) : null}
      {editVisible ? (
        <Tooltip disabled={!canEdit} title={editLabel}>
          <Button icon={<EditOutlined />} disabled={!canEdit} onClick={() => canEdit && onEdit?.(value)} />
        </Tooltip>      
      ) : null}
      {modalSlot}
    </Flex>
  );
}
