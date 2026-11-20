import { useQuery } from '@tanstack/react-query';
import { type SelectProps } from 'antd';
import { useMemo, useState } from 'react';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import {
  LOOKUP_LIST_SIZE,
  type ListQueryParams,
  type PaginatedResponse,
} from '../../types/listQuery';
import { SelectLoading } from '../loading/SelectLoading';
import type { LookupOption, LookupOptionMapper } from '../selectOption';

export type { LookupOption, LookupOptionMapper } from '../selectOption';

/**
 * Shared resource UI factory matrix (when to use which):
 *
 * | Pattern | Factory | When |
 * |---|---|---|
 * | **Select-only** | `AsyncSelect` / {@link AsyncLookupSelect} | Choose an existing resource; no Create/Edit chrome. |
 * | **Select+Add** (+ optional Edit) | `ResourcePicker` | Lookup select plus inline Create/Edit actions. |
 * | **Sortable list** | `ResourceListEditor` (`enableReorder`) | Multi-value bordered list with optional ↑/↓ reorder. |
 *
 * Select-only variants:
 * - {@link AsyncLookupSelect} — server-side search via debounced `q` + lookup page size (large resources).
 * - `AsyncSelect` — full list loaded once; no server `q` / pagination (small option sets).
 * - Plain antd `Select` — closed enums / constants (no fetch).
 * - {@link SelectLoading} — internal shell with delayed loading indicator.
 *
 * Common async props: `queryKey`, `fetchFn`, `mapOption`, `selectedOption` / `valueLabel`, `value` / `onChange`.
 */
export interface AsyncLookupSelectProps<T extends object>
  extends Omit<
    SelectProps,
    | 'value'
    | 'onChange'
    | 'options'
    | 'loading'
    | 'status'
    | 'notFoundContent'
    | 'onSearch'
    | 'onDropdownVisibleChange'
    | 'showSearch'
    | 'filterOption'
  > {
  value?: string | number | null;
  /**
   * Fired with the selected value (or `null` when cleared) and the matched option.
   * Second argument stays optional/`undefined` (not `null`) so Form.Item / antd `SelectProps`
   * `onChange` remains assignable when entity wrappers spread `SelectProps`.
   */
  onChange?: (value: string | number | null, option?: LookupOption) => void;
  /** React Query key prefix; `'lookup'` + params are appended automatically. */
  queryKey: readonly unknown[];
  fetchFn: (params: ListQueryParams) => Promise<PaginatedResponse<T>>;
  mapOption: LookupOptionMapper<T>;
  /** Optional extra filters merged into lookup requests. */
  extraParams?: Omit<ListQueryParams, 'size' | 'number' | 'q'>;
  /** Pre-selected option when the current value is not yet in fetched options. */
  selectedOption?: LookupOption | null;
  /** Label for the current value when only the ID is known (alternative to selectedOption). */
  valueLabel?: string;
  /** Excluded values. */
  excludeds?: string[];
  /** Included values. */
  includes?: string[];
}

/**
 * Select-only: server-side searchable select with debounced `q` and lookup page size.
 *
 * No Create/Edit chrome — for Select+Add use `ResourcePicker`; for multi + reorder use
 * `ResourceListEditor` (`enableReorder`). Prefer this over `AsyncSelect` when the list
 * is large or must be filtered on the server.
 *
 * Contract (LineConfiguration / ResourcePicker parity with Qt):
 * - `showSearch` is always enabled; `filterOption={false}` — filtering is server-side via `q`.
 * - `allowClear` defaults to `true`; clearing yields `null` in `onChange`.
 * - Callers should set `placeholder="Не используется"` for optional resource fields.
 */
export function AsyncLookupSelect<T extends object>({
  value,
  onChange,
  placeholder = 'Выберите…',
  disabled,
  allowClear = true,
  queryKey,
  fetchFn,
  mapOption,
  extraParams,
  selectedOption,
  valueLabel,
  excludeds = [],
  includes,
  style,
  ...rest
}: AsyncLookupSelectProps<T>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedSearch(search);
  const isSearching = search !== debouncedSearch;

  const params = useMemo<ListQueryParams>(
    () => ({
      size: LOOKUP_LIST_SIZE,
      number: 0,
      q: debouncedSearch.trim() || undefined,
      ...extraParams,
    }),
    [debouncedSearch, extraParams],
  );

  const { data, isFetching, isError } = useQuery({
    queryKey: [...queryKey, 'lookup', params],
    queryFn: () => fetchFn(params),
    enabled: !disabled,
  });

  const presetOption = useMemo<LookupOption | null>(() => {
    if (selectedOption) {
      return selectedOption;
    }
    if (value !== undefined && value !== null && valueLabel) {
      return { value, label: valueLabel };
    }
    return null;
  }, [selectedOption, value, valueLabel]);

  const options = useMemo(() => {
    let fetched = (data?.response ?? []).map(mapOption);
    if (includes?.length) {
      fetched = fetched.filter((option) => includes.includes(String(option.value)));
    }
    if (excludeds?.length) {
      fetched = fetched.filter((option) => !excludeds.includes(String(option.value)));
    }
    if (presetOption && !fetched.some((option) => option.value === presetOption.value)) {
      return [presetOption, ...fetched];
    }
    return fetched;
  }, [data?.response, mapOption, presetOption, includes, excludeds]);

  return (
    <SelectLoading
      {...rest}
      showSearch
      filterOption={false}
      value={value ?? undefined}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      options={options}
      loading={isFetching || isSearching}
      status={isError ? 'error' : undefined}
      notFoundContent={isError ? 'Ошибка загрузки' : undefined}
      onSearch={setSearch}
      onDropdownVisibleChange={(open) => {
        if (!open) {
          setSearch('');
        }
      }}
      onChange={(nextValue) => {
        setSearch('');
        const matched = options.find((option) => option.value === nextValue);
        onChange?.(nextValue ?? null, matched);
      }}
      style={{ minWidth: 220, ...style }}
    />
  );
}
