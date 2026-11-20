import {
  LOOKUP_LIST_SIZE,
  type ListQueryParams,
  type PaginatedResponse,
} from '@/shared/types/listQuery';
import { AsyncLookupSelect } from '@/shared/ui/AsyncLookupSelect';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Flex, List, Tooltip } from 'antd';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

/** Minimal list item shape for lookup options. */
export interface ResourceListItem {
  id: number;
  name: string;
}

type NestedModalState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; resourceId: number };

/**
 * Shared resource UI factory matrix (when to use which):
 *
 * | Pattern | Factory | When |
 * |---|---|---|
 * | **Select-only** | `AsyncLookupSelect` / `AsyncSelect` | Choose an existing resource; no Create/Edit chrome. |
 * | **Select+Add** (+ optional Edit) | `ResourcePicker` | Lookup select plus inline Create/Edit actions. |
 * | **Sortable list** | {@link ResourceListEditor} (`enableReorder`) | Multi-value bordered list with optional ↑/↓ reorder. |
 *
 * Also: plain antd `Select` for closed enums; `SelectLoading` as the internal select shell.
 */
export interface ResourceListEditorProps<TItem extends ResourceListItem = ResourceListItem> {
  ids: number[];
  labels: Record<number, string>;
  onChange: (ids: number[]) => void;
  onLabelChange?: (id: number, label: string) => void;
  /**
   * Enables ↑/↓ reorder controls (Sortable list pattern).
   * @default false
   */
  enableReorder?: boolean;
  disabled?: boolean;
  queryKey: readonly unknown[];
  fetchFn: (params: ListQueryParams) => Promise<PaginatedResponse<TItem>>;
  placeholder?: string;
  /**
   * Label for the create button next to the lookup.
   * @default "Добавить"
   */
  createLabel?: string;
  /**
   * When `false`, hides Create even if `renderModal` / `onCreateClick` is set.
   * Defaults to visible whenever create chrome is available.
   */
  showCreate?: boolean;
  /**
   * When `false`, hides per-row Edit even if `renderModal` / `onEditClick` is set.
   * Defaults to visible whenever edit chrome is available.
   */
  showEdit?: boolean;
  /**
   * Opens create outside the list (e.g. zustand Host). Prefer over `renderModal`
   * when the form is page-mounted. When set, Create is shown unless `showCreate` is `false`.
   * If both this and `renderModal` are set, the click handler wins (no nested state).
   */
  onCreateClick?: () => void;
  /**
   * Opens edit outside the list (e.g. zustand Host). When set, per-row Edit is shown
   * unless `showEdit` is `false`. If both this and `renderModal` are set, the click
   * handler wins (no nested state).
   */
  onEditClick?: (resourceId: number) => void;
  /**
   * Renders nested create/edit UI. Caller owns domain modal and save logic.
   * Omit for a list without Create/Edit (lookup add + remove only; reorder via `enableReorder`),
   * or use `onCreateClick` / `onEditClick` for an external Host instead.
   *
   * @param state - Current nested modal state (`create` / `edit` / closed).
   * @param close - Closes the nested modal.
   */
  renderModal?: (state: NestedModalState, close: () => void) => ReactNode;
}

/**
 * Multi-value bordered list editor (optional Create/Edit slot + optional Sortable via `enableReorder`).
 *
 * Create/Edit chrome appears when `renderModal` and/or `onCreateClick` / `onEditClick`
 * are passed and the matching `showCreate` / `showEdit` flag is not `false`.
 * Reorder controls are independent — set `enableReorder` alone for a sortable list
 * without nested CRUD.
 */
export function ResourceListEditor<TItem extends ResourceListItem = ResourceListItem>({
  ids,
  labels,
  onChange,
  onLabelChange,
  enableReorder = false,
  disabled,
  queryKey,
  fetchFn,
  placeholder = 'Добавить…',
  createLabel = 'Добавить',
  showCreate,
  showEdit,
  onCreateClick,
  onEditClick,
  renderModal,
}: ResourceListEditorProps<TItem>) {
  const [lookupKey, setLookupKey] = useState(0);
  const [nestedModal, setNestedModal] = useState<NestedModalState>({ kind: 'none' });

  const excludeIds = useMemo(() => new Set(ids), [ids]);
  const createVisible =
    (Boolean(renderModal) || Boolean(onCreateClick)) && (showCreate ?? true);
  const editVisible =
    (Boolean(renderModal) || Boolean(onEditClick)) && (showEdit ?? true);

  const filteredFetchFn = useCallback(
    async (params: ListQueryParams) => {
      const pageSize = params.size ?? LOOKUP_LIST_SIZE;
      const startPage = params.number ?? 0;
      const filtered: TItem[] = [];
      let page = startPage;
      let lastResponse: PaginatedResponse<TItem> | null = null;

      while (filtered.length < pageSize) {
        const response = await fetchFn({ ...params, number: page, size: pageSize });
        lastResponse = response;
        const beforeCount = filtered.length;

        for (const item of response.response) {
          if (!excludeIds.has(item.id)) {
            filtered.push(item);
            if (filtered.length >= pageSize) {
              break;
            }
          }
        }

        const hasMore =
          response.response.length >= pageSize &&
          page * pageSize + response.response.length < response.total_records;
        const addedThisPage = filtered.length - beforeCount;
        if (addedThisPage === 0 && !hasMore) {
          if (filtered.length === 0) {
            return {
              ...response,
              page: startPage + 1,
              response: [],
            };
          }
          break;
        }
        if (!hasMore) {
          break;
        }
        page += 1;
      }

      if (!lastResponse) {
        return {
          page: startPage + 1,
          next_page: startPage + 2,
          previous_page: startPage,
          size: pageSize,
          total_records: 0,
          response: [],
        };
      }

      return {
        ...lastResponse,
        page: startPage + 1,
        response: filtered,
      };
    },
    [excludeIds, fetchFn],
  );

  const handleAdd = useCallback(
    (nextId: number | null, option?: { label: string } | null) => {
      if (nextId === null || excludeIds.has(nextId)) {
        return;
      }
      onChange([...ids, nextId]);
      if (option?.label) {
        onLabelChange?.(nextId, option.label);
      }
      setLookupKey((key) => key + 1);
    },
    [excludeIds, ids, onChange, onLabelChange],
  );

  const handleRemove = useCallback(
    (id: number) => {
      onChange(ids.filter((itemId) => itemId !== id));
    },
    [ids, onChange],
  );

  const moveItem = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= ids.length) {
        return;
      }
      const next = [...ids];
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      onChange(next);
    },
    [ids, onChange],
  );

  const closeModal = useCallback(() => {
    setNestedModal({ kind: 'none' });
  }, []);

  return (
    <>
      <div
        style={{
          border: '1px solid var(--ant-color-border, #d9d9d9)',
          borderRadius: 6,
          padding: 8,
        }}
      >
        <List
          size="small"
          locale={{ emptyText: 'Список пуст' }}
          dataSource={ids}
          rowKey={(id) => String(id)}
          renderItem={(id, index) => (
            <List.Item
              actions={[
                ...(enableReorder
                  ? [
                      <Button
                        key="up"
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={disabled || index === 0}
                        aria-label="Переместить вверх"
                        onClick={() => moveItem(index, -1)}
                      />,
                      <Button
                        key="down"
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={disabled || index === ids.length - 1}
                        aria-label="Переместить вниз"
                        onClick={() => moveItem(index, 1)}
                      />,
                    ]
                  : []),
                ...(editVisible
                  ? [
                      <Button
                        key="edit"
                        type="link"
                        size="small"
                        disabled={disabled}
                        onClick={() => {
                          if (onEditClick) {
                            onEditClick(id);
                            return;
                          }
                          setNestedModal({ kind: 'edit', resourceId: id });
                        }}
                        icon={<EditOutlined />}
                        aria-label="Изменить"
                      />,
                    ]
                  : []),
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={disabled}
                  aria-label="Удалить"
                  onClick={() => handleRemove(id)}
                />,
              ]}
            >
              {labels[id] ?? `#${id}`}
            </List.Item>
          )}
        />

        <Flex justify='space-between' gap="0.5rem">
          <AsyncLookupSelect<TItem>
            key={lookupKey}
            placeholder={placeholder}
            disabled={disabled}
            queryKey={[...queryKey, lookupKey]}
            fetchFn={filteredFetchFn}
            mapOption={(item) => ({ value: item.id, label: item.name })}
            onChange={(nextValue, option) => {
              if (nextValue === null || nextValue === undefined) {
                return;
              }
              handleAdd(Number(nextValue), option);
            }}
          />
          {createVisible ? (
            <Tooltip title={createLabel}>
              <Button
                icon={<PlusOutlined />}
                disabled={disabled}
                aria-label={createLabel}
                onClick={() => {
                  if (onCreateClick) {
                    onCreateClick();
                    return;
                  }
                  setNestedModal({ kind: 'create' });
                }}
              />
            </Tooltip>
          ) : null}
        </Flex>
      </div>

      {renderModal?.(nestedModal, closeModal)}
    </>
  );
}
