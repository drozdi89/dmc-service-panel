import { SEARCH_DEBOUNCE_MS } from '@/shared/types/listQuery';
import { SearchLoading } from '@/shared/ui/loading/SearchLoading';
import { Button } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { useEffect, useRef } from 'react';

/** Props for debounced text search column filter (no OK, Reset kept). */
export interface DebouncedSearchFilterDropdownProps extends FilterDropdownProps {
  /** Input placeholder. */
  placeholder?: string;
  /** Shows delayed spinner while the parent query is fetching. */
  loading?: boolean;
  /** Debounce before applying text to the table filter (ms). */
  debounceMs?: number;
}

/**
 * Ant Design Table `filterDropdown` for server-side text search (`q`).
 * Applies after debounce; Reset clears immediately. No Confirm button.
 */
export function DebouncedSearchFilterDropdown({
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  placeholder = 'Поиск…',
  loading = false,
  debounceMs = SEARCH_DEBOUNCE_MS,
}: DebouncedSearchFilterDropdownProps) {
  const timerRef = useRef<number | undefined>(undefined);
  const value = selectedKeys[0] != null ? String(selectedKeys[0]) : '';

  useEffect(
    () => () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const scheduleApply = (next: string) => {
    setSelectedKeys(next ? [next] : []);
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      confirm({ closeDropdown: false });
    }, debounceMs);
  };

  const handleReset = () => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    clearFilters?.({ confirm: true, closeDropdown: false });
  };

  return (
    <div style={{ width: 280 }}>
      <div className="ant-table-filter-dropdown-btns">
        <Button type="link" size="small" disabled={!value} onClick={handleReset}>
          Сбросить
        </Button>
      </div>
      <SearchLoading
        allowClear
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        loading={loading}
        onChange={(event) => scheduleApply(event.target.value)}
        onSearch={(next) => {
          if (timerRef.current !== undefined) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
          }
          setSelectedKeys(next ? [next] : []);
          confirm({ closeDropdown: false });
        }}
        style={{ width: '100%', padding: '0 0.5rem 0.5rem' }}
      />
      
    </div>
  );
}
