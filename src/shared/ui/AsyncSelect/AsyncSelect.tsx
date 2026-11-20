import { SelectLoading } from '@/shared/ui/loading/SelectLoading';
import { useQuery } from '@tanstack/react-query';
import { type SelectProps } from 'antd';
import { useMemo } from 'react';
import {
  type LookupOption,
  type LookupOptionMapper,
} from '../selectOption';

/**
 * Shared resource UI factory matrix (when to use which):
 *
 * | Pattern | Factory | When |
 * |---|---|---|
 * | **Select-only** | {@link AsyncSelect} / `AsyncLookupSelect` | Choose an existing resource; no Create/Edit chrome. |
 * | **Select+Add** (+ optional Edit) | `ResourcePicker` | Lookup select plus inline Create/Edit actions. |
 * | **Sortable list** | `ResourceListEditor` (`enableReorder`) | Multi-value bordered list with optional ↑/↓ reorder. |
 *
 * Select-only variants:
 * - {@link AsyncSelect} — one-shot async options via `useQuery` (cache shape `T[]`,
 *   shareable with entity hooks such as `useProductGroupsQuery`).
 * - `AsyncLookupSelect` — server-side search via debounced `q` + lookup page size.
 * - Plain antd `Select` — closed enums / constants.
 * - {@link SelectLoading} — internal shell with delayed loading indicator.
 *
 * Common async props: `queryKey`, `mapOption`, `selectedOption` / `valueLabel`,
 * controlled `value` / `onChange` (Form.Item-compatible via SelectProps passthrough).
 *
 * Note: do **not** use `useInfiniteQuery` under the same key as entity `useQuery` —
 * infinite observers crash when cached data is a plain array (`pages` undefined).
 */
export interface AsyncSelectProps<T extends object>
  extends Omit<
    SelectProps,
    'options' | 'loading' | 'status' | 'notFoundContent' | 'onPopupScroll'
  > {
  /** Loads the full option list once (no pagination params). */
  fetchFn: () => Promise<T[]>;
  /** React Query key prefix; `'select'` is appended automatically. */
  queryKey: readonly unknown[];
  /** Maps each fetched row to a select option. */
  mapOption: LookupOptionMapper<T>;
  /** Prepend when the current value is not in the fetched list. */
  selectedOption?: LookupOption | null;
  /** Label for the current value when only the ID is known (alternative to `selectedOption`). */
  valueLabel?: string;
  /** Excluded values. */
  excludeds?: string[];
  /** Included values. */
  includes?: string[];
}

/**
 * Select-only: async select with a single full-list fetch (`useQuery`).
 *
 * No Create/Edit chrome — for Select+Add use `ResourcePicker`; for multi + reorder use
 * `ResourceListEditor`. Prefer {@link AsyncLookupSelect} when the list is large or needs
 * server-side `q` search.
 */
export function AsyncSelect<T extends object>({
  fetchFn,
  queryKey,
  disabled,
  mapOption,
  selectedOption,
  valueLabel,
  value,
  excludeds = [],
  includes,
  ...props
}: AsyncSelectProps<T>) {
  const { data, isFetching, isLoading, isError } = useQuery({
    queryKey: [...queryKey, 'select'],
    queryFn: fetchFn,
    enabled: !disabled,
  });

  const presetOption = useMemo<LookupOption | null>(() => {
    if (selectedOption) {
      return selectedOption;
    }
    if (value !== undefined && value !== null && value !== '' && valueLabel) {
      return { value: value as string | number, label: valueLabel };
    }
    return null;
  }, [selectedOption, value, valueLabel]);

  const options = useMemo(() => {
    const seen = new Set<string>();
    let fetched: LookupOption[] = [];
    for (const row of data ?? []) {
      const option = mapOption(row);
      const key = String(option.value);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      fetched.push(option);
    }
    if (includes?.length) {
      fetched = fetched.filter((option) => includes.includes(String(option.value)));
    }
    if (excludeds.length) {
      fetched = fetched.filter((option) => !excludeds.includes(String(option.value)));
    }
    if (presetOption && !fetched.some((option) => option.value === presetOption.value)) {
      return [presetOption, ...fetched];
    }
    return fetched;
  }, [data, mapOption, presetOption, includes, excludeds]);

  return (
    <SelectLoading
      {...props}
      value={value}
      options={options}
      disabled={disabled}
      loading={isLoading || isFetching}
      status={isError ? 'error' : undefined}
      notFoundContent={isError ? 'Ошибка загрузки' : undefined}
    />
  );
}
