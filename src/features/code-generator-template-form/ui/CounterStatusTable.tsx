import {
  formatSingleCounterStatus,
  type CounterSpecSchema,
  type CounterStatusSchema,
} from '@/entities/code-generator-template';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

export interface CounterStatusTableProps {
  counterConfig: CounterSpecSchema[] | undefined;
  counters: CounterStatusSchema[] | undefined;
}

/**
 * Read-only counter series status (Qt `counter_status_display`).
 */
export function CounterStatusTable({
  counterConfig,
  counters,
}: CounterStatusTableProps) {
  const statusByName = useMemo(() => {
    const map = new Map<string, CounterStatusSchema>();
    for (const row of counters ?? []) {
      map.set(row.name, row);
    }
    return map;
  }, [counters]);

  const rows = useMemo(() => {
    const config = counterConfig ?? [];
    if (config.length === 0) {
      return [];
    }
    return config.map((spec) => ({
      key: spec.name,
      name: spec.name,
      status: formatSingleCounterStatus(spec, statusByName.get(spec.name)),
    }));
  }, [counterConfig, statusByName]);

  if (rows.length === 0) {
    return null;
  }

  const columns: ColumnsType<(typeof rows)[number]> = [
    { title: 'Счётчик', dataIndex: 'name', key: 'name', width: 140 },
    { title: 'Состояние', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div style={{ marginTop: 8, marginBottom: 16 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Текущие значения счётчиков
      </Typography.Text>
      <Table
        size="small"
        pagination={false}
        columns={columns}
        dataSource={rows}
      />
    </div>
  );
}