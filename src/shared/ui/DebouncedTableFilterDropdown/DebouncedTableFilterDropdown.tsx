import { SEARCH_DEBOUNCE_MS } from '@/shared/types/listQuery';
import { Button, Checkbox, Space } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { useEffect, useRef, type Key } from 'react';

/** Props for debounced column filter dropdown (no OK, Reset kept). */
export interface DebouncedTableFilterDropdownProps extends FilterDropdownProps {
  /** Debounce before applying selection to the table filter (ms). */
  debounceMs?: number;
}

/**
 * Ant Design Table `filterDropdown` that applies checkbox selection after a debounce
 * (no Confirm button). Reset clears and applies immediately.
 */
export function DebouncedTableFilterDropdown({
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  filters,
  debounceMs = SEARCH_DEBOUNCE_MS,
}: DebouncedTableFilterDropdownProps) {
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const scheduleApply = (nextKeys: Key[]) => {
    setSelectedKeys(nextKeys);
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
    <div >
      <div className="ant-table-filter-dropdown-btns">
        <Button
          type="link"
          size="small"
          disabled={selectedKeys.length === 0}
          onClick={handleReset}
        >
          Сбросить
        </Button>
      </div>
      <Space orientation="vertical" style={{ padding: '0.5rem' }}>
        {(filters ?? []).map((filter) => {
          const value = filter.value as Key;
          const checked = selectedKeys.some((key) => String(key) === String(value));
          return (
            <Checkbox
              key={String(value)}
              checked={checked}
              onChange={(event) => {
                const nextKeys = event.target.checked
                  ? [...selectedKeys, value]
                  : selectedKeys.filter((key) => String(key) !== String(value));
                scheduleApply(nextKeys);
              }}
            >
              {filter.text}
            </Checkbox>
          );
        })}
      </Space>
      
    </div>
  );
}
