import { fetchLinesList, type LineListItem } from '@/entities/line';
import { useQuery } from '@tanstack/react-query';
import { Checkbox, Input, Spin, Typography } from 'antd';
import { useMemo, useState } from 'react';

const LINE_LIST_MAX_HEIGHT = 220;

async function fetchAllLinesForMesSync(): Promise<LineListItem[]> {
  const pageSize = 200;
  const first = await fetchLinesList({
    size: pageSize,
    number: 0,
  });
  const items = [...first.response];
  if (first.total_records > pageSize) {
    const pages = Math.ceil(first.total_records / pageSize);
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        fetchLinesList({
          size: pageSize,
          number: index + 1,
        }),
      ),
    );
    for (const page of rest) {
      items.push(...page.response);
    }
  }
  return items;
}

/** Form.Item-compatible multi-select checklist of production lines. */
export interface LineIdsChecklistProps {
  value?: number[];
  onChange?: (ids: number[]) => void;
  disabled?: boolean;
}

/**
 * Searchable checkbox list of lines (Qt FilteredLineCheckList parity).
 */
export function LineIdsChecklist({
  value = [],
  onChange,
  disabled = false,
}: LineIdsChecklistProps) {
  const [search, setSearch] = useState('');
  const linesQuery = useQuery({
    queryKey: ['lines', 'mes-sync-checklist'],
    queryFn: fetchAllLinesForMesSync,
  });

  const options = useMemo(() => {
    const rows = [...(linesQuery.data ?? [])].sort((a, b) =>
      (a.linename ?? '').localeCompare(b.linename ?? '', 'ru'),
    );
    return rows.map((line) => ({
      value: line.lineid,
      label: `[${line.lineid}] ${line.linename ?? ''}`,
    }));
  }, [linesQuery.data]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  if (linesQuery.isLoading) {
    return <Spin size="small" />;
  }

  if (linesQuery.error) {
    return (
      <Typography.Text type="danger">
        Не удалось загрузить линии: {linesQuery.error.message}
      </Typography.Text>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <Input.Search
        allowClear
        placeholder="Поиск по названию"
        value={search}
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div
        style={{
          maxHeight: LINE_LIST_MAX_HEIGHT,
          overflowY: 'auto',
          border: '1px solid var(--ant-color-border)',
          borderRadius: 6,
          padding: '8px 12px',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Checkbox.Group
          options={filteredOptions}
          value={value}
          disabled={disabled}
          onChange={(checked) => onChange?.(checked.map(Number))}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        />
        {filteredOptions.length === 0 ? (
          <Typography.Text type="secondary">Ничего не найдено</Typography.Text>
        ) : null}
      </div>
    </div>
  );
}
