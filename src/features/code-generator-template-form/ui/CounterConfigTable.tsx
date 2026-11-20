import {
  COUNTER_SPEC_TYPES,
  COUNTER_TYPE_LABELS,
  SelectCounterType
} from '@/entities/code-generator-template';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, InputNumber, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { createDefaultCounterRow } from '../model/defaults';

const COUNTER_TYPE_OPTIONS = COUNTER_SPEC_TYPES.map((value) => ({
  value,
  label: COUNTER_TYPE_LABELS[value],
}));

/** Props for editable counter_config table. */
export interface CounterConfigTableProps {
  /** Disables add/remove and cell editors (system / read-only). */
  disabled?: boolean;
}

/**
 * Editable `counter_config` table (Desktop tblCounters columns).
 *
 * Columns: Имя, Тип, Ключ серии, Формат, Уровень, Начало.
 * Bound to Form.List field `counter_config`.
 */
export function CounterConfigTable({ disabled = false }: CounterConfigTableProps) {
  return (
    <Form.List name="counter_config">
      {(fields, { add, remove }) => (
        <div>
          <Flex
            align="center"
            justify="space-between"
            gap="small"
            style={{ marginBottom: 8 }}
          >
            <Typography.Text strong>Счётчики:</Typography.Text>
            <Button
              type="default"
              size="small"
              icon={<PlusOutlined />}
              disabled={disabled}
              onClick={() => add(createDefaultCounterRow())}
            >
              Добавить
            </Button>
          </Flex>

          {fields.length === 0 ? (
            <Typography.Text type="secondary">
              Нет счётчиков. Добавьте строку для плейсхолдеров вроде {'{serial}'}.
            </Typography.Text>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Имя</th>
                    <th style={thStyle}>Тип</th>
                    <th style={thStyle}>Ключ серии</th>
                    <th style={{ ...thStyle, width: 88 }}>Формат</th>
                    <th style={thStyle}>Уровень</th>
                    <th style={{ ...thStyle, width: 88 }}>Начало</th>
                    <th style={{ ...thStyle, width: 40 }} aria-label="Удалить" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.key}>
                      <td style={tdStyle}>
                        <Form.Item
                          name={[field.name, 'name']}
                          style={itemStyle}
                        >
                          <Input disabled={disabled} placeholder="serial" />
                        </Form.Item>
                      </td>
                      <td style={tdStyle}>
                        <Form.Item
                          name={[field.name, 'type']}
                          style={itemStyle}
                        >
                          <SelectCounterType
                            disabled={disabled}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </td>
                      <td style={tdStyle}>
                        <Form.Item
                          name={[field.name, 'key_template']}
                          style={itemStyle}
                        >
                          <Input disabled={disabled} placeholder="ключ" />
                        </Form.Item>
                      </td>
                      <td style={tdStyle}>
                        <Form.Item
                          name={[field.name, 'format']}
                          style={itemStyle}
                        >
                          <Input disabled={disabled} placeholder="06d" />
                        </Form.Item>
                      </td>
                      <td style={tdStyle}>
                        <Form.Item
                          name={[field.name, 'level_from']}
                          style={itemStyle}
                        >
                          <Input
                            disabled={disabled}
                            placeholder="aggregation_level"
                          />
                        </Form.Item>
                      </td>
                      <td style={tdStyle}>
                        <Form.Item
                          name={[field.name, 'initial_value']}
                          style={itemStyle}
                        >
                          <InputNumber
                            disabled={disabled}
                            min={0}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={disabled}
                          aria-label={`Удалить счётчик ${field.name + 1}`}
                          onClick={() => remove(field.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Form.List>
  );
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  padding: '4px 6px',
  borderBottom: '1px solid #f0f0f0',
};

const tdStyle: CSSProperties = {
  padding: '2px 4px',
  verticalAlign: 'top',
};

const itemStyle: CSSProperties = {
  marginBottom: 0,
};
