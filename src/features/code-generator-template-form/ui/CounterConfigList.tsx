import {
  COUNTER_WIDTH_MAX,
  COUNTER_WIDTH_MIN,
  FREQUENT_COUNTER_KEY_FIELDS,
  counterRangeCeiling,
  useCodeGeneratorTemplateVariablesQuery,
} from '@/entities/code-generator-template';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Flex, Form, Input, InputNumber, Select, Typography } from 'antd';
import { useMemo } from 'react';
import { createDefaultCounterRow } from '../model/defaults';

/** Props for editable counter_config list (Qt `CounterCardWidget`). */
export interface CounterConfigListProps {
  disabled?: boolean;
  /** When true, loads variable catalog for extra key fields. */
  catalogEnabled?: boolean;
}

function CounterRowKeyFields({
  fieldIndex,
  disabled,
  extraOptions,
}: {
  fieldIndex: number;
  disabled?: boolean;
  extraOptions: { value: string; label: string }[];
}) {
  const form = Form.useFormInstance();
  const keyFields =
    (Form.useWatch(['counter_config', fieldIndex, 'key_fields'], form) as
      | string[]
      | undefined) ?? [];

  const frequentNames = new Set(FREQUENT_COUNTER_KEY_FIELDS.map((f) => f.name));
  const extraValues = keyFields.filter((k) => !frequentNames.has(k));

  return (
    <>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
        Новый ряд, когда меняется:
      </Typography.Text>
      <Checkbox.Group
        disabled={disabled}
        value={keyFields.filter((k) => frequentNames.has(k))}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
        options={FREQUENT_COUNTER_KEY_FIELDS.map((f) => ({
          label: f.label,
          value: f.name,
        }))}
        onChange={(checkedFrequent) => {
          const frequentChecked = new Set(checkedFrequent as string[]);
          const merged = [
            ...extraValues,
            ...FREQUENT_COUNTER_KEY_FIELDS.map((f) => f.name).filter((n) =>
              frequentChecked.has(n),
            ),
          ];
          form.setFieldValue(['counter_config', fieldIndex, 'key_fields'], merged);
        }}
      />
      {extraOptions.length > 0 ? (
        <Select
          mode="multiple"
          allowClear
          disabled={disabled}
          placeholder="Доп. поля из справочника"
          style={{ width: '100%', marginTop: 8 }}
          options={extraOptions}
          value={extraValues}
          onChange={(next) => {
            const frequentPart = keyFields.filter((k) => frequentNames.has(k));
            form.setFieldValue(
              ['counter_config', fieldIndex, 'key_fields'],
              [...frequentPart, ...next],
            );
          }}
        />
      ) : null}
    </>
  );
}

function CounterRowMax({ fieldIndex, disabled }: { fieldIndex: number; disabled?: boolean }) {
  const form = Form.useFormInstance();
  const width = Form.useWatch(['counter_config', fieldIndex, 'width'], form) as
    | number
    | undefined;
  const ceiling = counterRangeCeiling(width ?? 6);

  return (
    <Form.Item
      name={[fieldIndex, 'max']}
      label="До"
      style={{ marginBottom: 0, flex: 1 }}
    >
      <InputNumber
        disabled={disabled}
        min={0}
        max={ceiling}
        style={{ width: '100%' }}
        placeholder="0 = авто"
      />
    </Form.Item>
  );
}

/**
 * Editable `counter_config` cards — parity `template_editor.CounterCardWidget`.
 */
export function CounterConfigList({
  disabled = false,
  catalogEnabled = false,
}: CounterConfigListProps) {
  const variablesQuery = useCodeGeneratorTemplateVariablesQuery(catalogEnabled);
  const extraOptions = useMemo(() => {
    const frequent = new Set(FREQUENT_COUNTER_KEY_FIELDS.map((f) => f.name));
    const names = new Map<string, string>();
    for (const row of variablesQuery.data ?? []) {
      if (frequent.has(row.name)) {
        continue;
      }
      names.set(row.name, row.name);
    }
    return [...names.entries()].map(([value, label]) => ({ value, label }));
  }, [variablesQuery.data]);

  return (
    <Form.List name="counter_config">
      {(fields, { add, remove }) => (
        <div>
          <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
            <Typography.Text strong>Счётчики</Typography.Text>
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
              Нет счётчиков. Добавьте карточку для плейсхолдеров вроде {'{serial}'}.
            </Typography.Text>
          ) : (
            <Flex vertical gap={8}>
              {fields.map((field) => (
                <Card
                  key={field.key}
                  size="small"
                  title={
                    <Flex align="center" gap={4}>
                      <Typography.Text>{'{'}</Typography.Text>
                      <Form.Item
                        name={[field.name, 'name']}
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <Input disabled={disabled} placeholder="serial" />
                      </Form.Item>
                      <Typography.Text>{'}'}</Typography.Text>
                    </Flex>
                  }
                  extra={
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={disabled}
                      aria-label="Удалить счётчик"
                      onClick={() => remove(field.name)}
                    />
                  }
                >
                  <Flex gap={8} wrap="wrap">
                    <Form.Item
                      name={[field.name, 'width']}
                      label="Цифр"
                      style={{ marginBottom: 8, minWidth: 88 }}
                    >
                      <InputNumber
                        disabled={disabled}
                        min={COUNTER_WIDTH_MIN}
                        max={COUNTER_WIDTH_MAX}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'min']}
                      label="От"
                      style={{ marginBottom: 8, minWidth: 88, flex: 1 }}
                    >
                      <InputNumber disabled={disabled} min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <CounterRowMax fieldIndex={field.name} disabled={disabled} />
                  </Flex>
                  <CounterRowKeyFields
                    fieldIndex={field.name}
                    disabled={disabled}
                    extraOptions={extraOptions}
                  />
                </Card>
              ))}
            </Flex>
          )}
        </div>
      )}
    </Form.List>
  );
}