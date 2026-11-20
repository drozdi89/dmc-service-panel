import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, InputNumber, Space } from 'antd';
import type { CSSProperties } from 'react';

/** Props for numeric input with explicit decrement/increment controls. */
export interface StepperNumberInputProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Number input with visible `−` / `+` buttons (Qt stepper parity).
 */
export function StepperNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  className,
  style,
}: StepperNumberInputProps) {
  const hasValue = value !== null && value !== undefined;

  const clamp = (next: number): number => {
    let result = next;
    if (min !== undefined) {
      result = Math.max(min, result);
    }
    if (max !== undefined) {
      result = Math.min(max, result);
    }
    return result;
  };

  const handleStep = (delta: number) => {
    if (!hasValue) {
      if (delta > 0) {
        onChange?.(clamp(min ?? 0));
      }
      return;
    }
    onChange?.(clamp(value + delta));
  };

  const atMin = !hasValue || (min !== undefined && value <= min);
  const atMax = hasValue && max !== undefined && value >= max;

  return (
    <Space.Compact className={className} style={style}>
      <Button
        aria-label="Уменьшить"
        icon={<MinusOutlined />}
        disabled={disabled || atMin}
        onClick={() => handleStep(-step)}
      />
      <InputNumber
        value={value ?? undefined}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        controls={false}
        style={{ width: 88 }}
        onChange={(next) => onChange?.(next)}
      />
      <Button
        aria-label="Увеличить"
        icon={<PlusOutlined />}
        disabled={disabled || atMax}
        onClick={() => handleStep(step)}
      />
    </Space.Compact>
  );
}
