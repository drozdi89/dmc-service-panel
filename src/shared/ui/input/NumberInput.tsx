import {
  Input,
  InputNumber as AntInputNumber,
  Space,
  type InputNumberProps,
} from 'antd';
import type { CSSProperties, ReactNode } from 'react';

interface NumberInputProps extends InputNumberProps {
  /** Масштабный коэффициент. Отображаемое значение = реальное / round */
  round?: number;
  addonBefore?: ReactNode;
  addonAfter?: ReactNode;
}

function scaleDown(
  raw: InputNumberProps['value'],
  round: number,
): number | null | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === null) {
    return null;
  }
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric / round;
}

/**
 * Обёртка над Ant Design InputNumber, которая масштабирует вводимые значения.
 * Например, при round = 10 ввод 1.5 соответствует реальному значению 15,
 * шаг становится в 10 раз меньше.
 */
export function NumberInput({
  value,
  defaultValue,
  step: stepProp = 1,
  round = 1,
  onChange,
  addonBefore,
  addonAfter,
  style,
  ...props
}: NumberInputProps) {
  const decimals = Math.max(0, Math.log10(round));
  const step = Number(stepProp) / round;

  const handleChange = (val: number | null) => {
    onChange?.(val !== null ? val * round : null);
  };

  const numberInput = (
    <AntInputNumber
      value={scaleDown(value, round)}
      defaultValue={scaleDown(defaultValue, round)}
      step={step}
      precision={decimals}
      onChange={handleChange}
      style={
        addonBefore != null || addonAfter != null
          ? { width: '100%', minWidth: 0, ...style }
          : style
      }
      {...props}
    />
  );

  if (addonBefore == null && addonAfter == null) {
    return numberInput;
  }

  const addonStyle: CSSProperties = {
    width: 'auto',
    flex: 'none',
    textAlign: 'center',
    pointerEvents: 'none',
  };

  return (
    <Space.Compact block style={style}>
      {addonBefore != null ? (
        <Input
          readOnly
          tabIndex={-1}
          value={String(addonBefore)}
          style={addonStyle}
        />
      ) : null}
      {numberInput}
      {addonAfter != null ? (
        <Input
          readOnly
          tabIndex={-1}
          value={String(addonAfter)}
          style={addonStyle}
        />
      ) : null}
    </Space.Compact>
  );
}