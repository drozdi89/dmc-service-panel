import { Flex, InputNumber, Select } from 'antd';

/** Max custom autoorder amount (per product / bulk). */
export const AUTOORDER_AMOUNT_MAX = 100_000;

/** Select mode for per-product autoorder amount. */
type AmountMode = 'default' | 'off' | 'custom';

const MODE_OPTIONS: Array<{ value: AmountMode; label: string }> = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'off', label: 'Отключить' },
  { value: 'custom', label: 'Задать значение' },
];

/**
 * Map stored amount to Select mode.
 *
 * @param amount - Stored amount (-1 / 0 / positive).
 */
function amountToMode(amount: number): AmountMode {
  if (amount < 0) {
    return 'off';
  }
  if (amount === 0) {
    return 'default';
  }
  return 'custom';
}

/** Props for autoorder amount cell editor. */
export interface AutoorderAmountCellProps {
  amount: number;
  disabled?: boolean;
  onChange: (amount: number) => void;
}

/**
 * Three-mode amount editor: default (0), off (-1), custom (>0 with InputNumber).
 */
export function AutoorderAmountCell({
  amount,
  disabled = false,
  onChange,
}: AutoorderAmountCellProps) {
  const mode = amountToMode(amount);

  return (
    <Flex gap={8} align="center" style={{ width: '100%' }}>
      <Select<AmountMode>
        style={{ flex: 1, minWidth: 0 }}
        disabled={disabled}
        value={mode}
        options={MODE_OPTIONS}
        onChange={(nextMode) => {
          if (nextMode === 'default') {
            onChange(0);
            return;
          }
          if (nextMode === 'off') {
            onChange(-1);
            return;
          }
          onChange(amount > 0 ? amount : 1);
        }}
      />
      {mode === 'custom' ? (
        <InputNumber
          min={1}
          max={AUTOORDER_AMOUNT_MAX}
          disabled={disabled}
          value={amount > 0 ? amount : 1}
          onChange={(next) => {
            if (next == null || next < 1) {
              onChange(1);
              return;
            }
            onChange(Math.min(next, AUTOORDER_AMOUNT_MAX));
          }}
          style={{ width: 96 }}
        />
      ) : null}
    </Flex>
  );
}
