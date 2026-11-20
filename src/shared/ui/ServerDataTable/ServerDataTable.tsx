import { Template } from '@/shared/model';
import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Pagination, Space, Table, type TableProps } from 'antd';
import type { ColumnType, ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type {
  FilterDropdownProps,
  FilterValue,
  SorterResult,
} from 'antd/es/table/interface';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { useServerListQuery, type ListFetchFn } from '../../hooks/useServerListQuery';
import {
  DEFAULT_LIST_SIZE,
  type ListQueryParams,
  type PaginatedResponse,
  type SortDirection,
} from '../../types/listQuery';
import { DebouncedSearchFilterDropdown } from '../DebouncedSearchFilterDropdown';
import { SearchLoading } from '../loading/SearchLoading';
import { useTableLoadingState } from '../loading/TableLoadingState';

/** Internal table state for pagination, sort, and search. */
export interface ServerTableState {
  page: number;
  pageSize: number;
  q: string;
  sortBy?: string;
  sortDir?: SortDirection;
}

/** Controlled list payload supplied by parent (skips internal fetch). */
export interface ControlledListState<T> {
  data: PaginatedResponse<T> | undefined;
  isFetching: boolean;
  isLoading: boolean;
  error: Error | null;
}

/** Shared props for server-side and controlled data tables. */
interface ServerDataTableBaseProps<T extends object> {
  /** Ant Design column definitions. */
  columns: ColumnsType<T>;
  /** Row key extractor. */
  rowKey: keyof T | ((record: T) => string | number);
  /**
   * Search input placeholder.
   * Used by the toolbar search or by {@link searchColumnKey} filter dropdown.
   */
  searchPlaceholder?: string;
  /**
   * When set, list `q` is edited via a debounced column filter (toolbar search is hidden).
   * Pass a string for one column, or several keys that share **one** `q` —
   * the same search dropdown is opened from each matched column.
   */
  searchColumnKey?: string | readonly string[];
  /** Additional filters rendered beside search (or alone when search is in a column). */
  toolbarExtra?: ReactNode;
  /** Extra query params merged into each request. */
  extraParams?: Omit<ListQueryParams, 'size' | 'number' | 'q' | 'sort_by' | 'sort_dir'>;
  /** Default page size. */
  defaultPageSize?: number;
  /** Table scroll config. */
  scroll?: TableProps<T>['scroll'];
  /** Highlights the row matching this key. */
  selectedRowKey?: string | number;
  /** Called when a data row is clicked. */
  onRowClick?: (record: T) => void;
  onCreate?: () => void;
  /**
   * Column filter changes from Table `onChange` (controlled via column `filteredValue`).
   * {@link searchColumnKey} entries are omitted (owned by table `q` state).
   * Resets to page 1 when the filters payload changes.
   */
  onFiltersChange?: (filters: Record<string, FilterValue | null>) => void;
  /**
   * When true (default), pagination and create button render into admin layout
   * footer via {@link Template.Footer}. Set false for nested tables.
   */
  useTemplateFooter?: boolean;
  /**
   * Notifies parent of current list params (pagination, search, sort).
   * Used with {@link controlledList} so fetch runs outside the table.
   */
  onListParamsChange?: (params: ListQueryParams) => void;
}

/** Server-fetched table (default). */
export interface ServerDataTableServerProps<T extends object>
  extends ServerDataTableBaseProps<T> {
  /** TanStack Query key prefix. */
  queryKey: readonly unknown[];
  /** Fetches paginated data using List Query Contract. */
  fetchFn: ListFetchFn<T>;
  controlledList?: never;
}

/** Parent-supplied list data; table owns UI state only. */
export interface ServerDataTableControlledProps<T extends object>
  extends ServerDataTableBaseProps<T> {
  controlledList: ControlledListState<T>;
  queryKey?: never;
  fetchFn?: never;
}

/** Props for generic server-side data table. */
export type ServerDataTableProps<T extends object> =
  | ServerDataTableServerProps<T>
  | ServerDataTableControlledProps<T>;

const DEFAULT_STATE: ServerTableState = {
  page: 1,
  pageSize: DEFAULT_LIST_SIZE,
  q: '',
};

/**
 * Normalizes {@link ServerDataTableProps.searchColumnKey} to a key list.
 *
 * @param searchColumnKey - Single key or shared multi-column keys.
 */
function normalizeSearchColumnKeys(
  searchColumnKey: string | readonly string[] | undefined,
): string[] {
  if (searchColumnKey == null) {
    return [];
  }
  if (typeof searchColumnKey === 'string') {
    return searchColumnKey ? [searchColumnKey] : [];
  }
  return searchColumnKey.filter(Boolean).map(String);
}

/**
 * Picks shared search text from controlled column filters.
 *
 * When several columns share one `q`, Ant Design may report the edited column
 * with the new value while siblings still carry the previous `filteredValue`.
 * Prefer a value that differs from the current `q` (the column the user just changed).
 *
 * @param filters - Table `onChange` filters map.
 * @param searchColumnKeys - Columns that share one `q`.
 * @param currentQ - Current table search string.
 * @returns Next `q`, or `undefined` when search was not changed.
 */
function pickSharedSearchQ(
  filters: Record<string, FilterValue | null>,
  searchColumnKeys: readonly string[],
  currentQ: string,
): string | undefined {
  if (searchColumnKeys.length === 0) {
    return undefined;
  }
  const touched = searchColumnKeys.some((key) =>
    Object.prototype.hasOwnProperty.call(filters, key),
  );
  if (!touched) {
    return undefined;
  }

  const values = searchColumnKeys.map((key) => {
    const raw = filters[key]?.[0];
    return raw != null && String(raw) !== '' ? String(raw) : '';
  });

  // Prefer a new non-empty value from the column the user edited (siblings may lag).
  const nonEmptyChanged = values.find((value) => value !== '' && value !== currentQ);
  if (nonEmptyChanged !== undefined) {
    return nonEmptyChanged;
  }
  // Reset from any linked column while siblings may still show the previous `q`.
  if (currentQ !== '' && values.some((value) => value === '')) {
    return '';
  }
  return undefined;
}

/**
 * Resolves a column identity for matching {@link searchColumnKey}.
 *
 * @param column - Ant Design column definition.
 */
function columnIdentity<T extends object>(column: ColumnType<T>): string {
  if (column.key !== undefined && column.key !== null) {
    return String(column.key);
  }
  if (column.dataIndex !== undefined && column.dataIndex !== null) {
    return Array.isArray(column.dataIndex)
      ? column.dataIndex.map(String).join('.')
      : String(column.dataIndex);
  }
  return '';
}

/**
 * Server-side table with debounced search, sort, and pagination (List Query Contract).
 * Pagination renders into admin layout footer via {@link Template.Footer}
 * when {@link ServerDataTableProps.useTemplateFooter} is true (default).
 *
 * Search: toolbar {@link SearchLoading} by default, or column `filterDropdown`
 * when {@link ServerDataTableProps.searchColumnKey} is set. Multiple keys share
 * one `q` and the same search form, callable from each matched column.
 */
export function ServerDataTable<T extends object>(props: ServerDataTableProps<T>) {
  const {
    columns,
    rowKey,
    searchPlaceholder = 'Поиск…',
    searchColumnKey,
    toolbarExtra,
    extraParams,
    defaultPageSize = DEFAULT_LIST_SIZE,
    scroll,
    selectedRowKey,
    onRowClick,
    onCreate,
    onFiltersChange,
    useTemplateFooter = true,
    onListParamsChange,
  } = props;

  const isControlled = 'controlledList' in props && props.controlledList != null;
  const queryKey = isControlled ? [] : props.queryKey;
  const fetchFn = isControlled ? undefined : props.fetchFn;
  const controlledList = isControlled ? props.controlledList : undefined;

  const [state, setState] = useState<ServerTableState>({
    ...DEFAULT_STATE,
    pageSize: defaultPageSize,
  });
  const filtersKeyRef = useRef<string>('');
  const searchColumnKeys = useMemo(
    () => normalizeSearchColumnKeys(searchColumnKey),
    [searchColumnKey],
  );
  const searchKeySet = useMemo(() => new Set(searchColumnKeys), [searchColumnKeys]);
  const searchInColumn = searchColumnKeys.length > 0;
  const toolbarDebouncedQ = useDebouncedSearch(searchInColumn ? '' : state.q);
  /** Column search is already debounced in the filter dropdown; toolbar search uses hook. */
  const effectiveQ = searchInColumn ? state.q : toolbarDebouncedQ;
  const isSearching = !searchInColumn && state.q !== toolbarDebouncedQ;

  const listParams = useMemo<ListQueryParams>(
    () => ({
      size: state.pageSize,
      number: state.page - 1,
      q: effectiveQ.trim() || undefined,
      sort_by: state.sortBy,
      sort_dir: state.sortDir,
      ...extraParams,
    }),
    [state, effectiveQ, extraParams],
  );

  useEffect(() => {
    onListParamsChange?.(listParams);
  }, [listParams, onListParamsChange]);

  const serverQuery = useServerListQuery({
    queryKey,
    fetchFn:
      fetchFn ??
      (async () => ({
        response: [],
        total_records: 0,
        size: listParams.size ?? DEFAULT_LIST_SIZE,
        number: listParams.number ?? 0,
      })),
    params: listParams,
    enabled: !isControlled && Boolean(fetchFn),
  });

  const data = isControlled ? controlledList?.data : serverQuery.data;
  const isFetching = isControlled ? (controlledList?.isFetching ?? false) : serverQuery.isFetching;
  const isLoading = isControlled ? (controlledList?.isLoading ?? false) : serverQuery.isLoading;
  const error = isControlled ? (controlledList?.error ?? null) : serverQuery.error;

  const { spinning } = useTableLoadingState(isFetching || isLoading);
  const searchLoading = isSearching || isFetching;

  const mergedColumns = useMemo<ColumnsType<T>>(() => {
    if (searchKeySet.size === 0) {
      return columns;
    }

    const attachSearch = <C extends ColumnType<T>>(column: C): C => ({
      ...column,
      filteredValue: state.q ? [state.q] : null,
      filterDropdown: (props: FilterDropdownProps) => (
        <DebouncedSearchFilterDropdown
          {...props}
          placeholder={searchPlaceholder}
          loading={searchLoading}
        />
      ),
    });

    const mapColumns = (cols: ColumnsType<T>): ColumnsType<T> =>
      cols.map((column) => {
        const typed = column as ColumnType<T>;
        const isSearchColumn = searchKeySet.has(columnIdentity(typed));

        if ('children' in column && column.children) {
          const withChildren = {
            ...column,
            children: mapColumns(column.children),
          };
          return isSearchColumn ? attachSearch(withChildren) : withChildren;
        }

        return isSearchColumn ? attachSearch(typed) : column;
      });

    return mapColumns(columns);
  }, [columns, searchKeySet, searchPlaceholder, searchLoading, state.q]);

  const handleTableChange = useCallback(
    (
      _pagination: TablePaginationConfig,
      filters: Record<string, FilterValue | null>,
      sorter: SorterResult<T> | SorterResult<T>[],
    ) => {
      const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
      const sortField =
        singleSorter?.field !== undefined && singleSorter?.field !== null
          ? String(singleSorter.field)
          : undefined;
      const sortOrder = singleSorter?.order;
      const nextFiltersKey = JSON.stringify(filters);
      const filtersChanged = nextFiltersKey !== filtersKeyRef.current;
      if (filtersChanged) {
        filtersKeyRef.current = nextFiltersKey;
        if (onFiltersChange) {
          if (searchColumnKeys.length > 0) {
            const rest = { ...filters };
            for (const key of searchColumnKeys) {
              delete rest[key];
            }
            onFiltersChange(rest);
          } else {
            onFiltersChange(filters);
          }
        }
      }

      setState((prev) => {
        const nextQ = pickSharedSearchQ(filters, searchColumnKeys, prev.q);
        const qChanged = nextQ !== undefined && nextQ !== prev.q;
        return {
          ...prev,
          page: filtersChanged || qChanged ? 1 : prev.page,
          q: nextQ !== undefined ? nextQ : prev.q,
          sortBy: sortOrder ? sortField : undefined,
          sortDir: sortOrder === 'descend' ? 'desc' : sortOrder ? 'asc' : undefined,
        };
      });
    },
    [onFiltersChange, searchColumnKeys],
  );

  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setState((prev) => ({
      ...prev,
      page: pageSize !== prev.pageSize ? 1 : page,
      pageSize,
    }));
  }, []);

  const total = data?.total_records ?? 0;

  const resolveRowKey = useCallback(
    (record: T) => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[rowKey] as string | number;
    },
    [rowKey],
  );

  const showToolbar = !searchInColumn || Boolean(toolbarExtra);

  const footerBar = (
    <Flex gap="small" justify={onCreate ? 'space-between' : 'flex-end'} align="center">
      {onCreate ? (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => onCreate?.()}>
          Добавить
        </Button>
      ) : null}
      <Pagination
        size="small"
        current={state.page}
        pageSize={state.pageSize}
        total={total}
        showSizeChanger
        pageSizeOptions={['20', '50', '100', '200']}
        showTotal={(count) => `Всего: ${count}`}
        onChange={handlePaginationChange}
        disabled={Boolean(error)}
        align="end"
      />
    </Flex>
  );

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      {showToolbar ? (
        <Space wrap>
          {!searchInColumn ? (
            <SearchLoading
              allowClear
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder || 'Поиск'}
              value={state.q}
              loading={searchLoading}
              onChange={(event) =>
                setState((prev) => ({ ...prev, q: event.target.value, page: 1 }))
              }
              onSearch={(value) =>
                setState((prev) => ({ ...prev, q: value, page: 1 }))
              }
              style={{ width: 280 }}
            />
          ) : null}
          {toolbarExtra}
        </Space>
      ) : null}

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Ошибка загрузки данных"
          description={error.message}
        />
      ) : null}

      <Table<T>
        size="small"
        rowKey={rowKey}
        columns={mergedColumns}
        dataSource={error ? [] : (data?.response ?? [])}
        loading={spinning}
        pagination={false}
        onChange={handleTableChange}
        scroll={scroll}
        locale={{ emptyText: 'Нет данных' }}
        sticky={{ offsetHeader: 0 }}
        onRow={
          onRowClick
            ? (record) => ({
                onClick: () => onRowClick(record),
                onDoubleClick: () => onRowClick(record),
                style: { cursor: 'pointer' },
              })
            : undefined
        }
        rowClassName={(record) =>
          selectedRowKey !== undefined && resolveRowKey(record) === selectedRowKey
            ? 'ant-table-row-selected'
            : ''
        }
      />
      {useTemplateFooter ? <Template.Footer>{footerBar}</Template.Footer> : footerBar}
    </Space>
  );
}
