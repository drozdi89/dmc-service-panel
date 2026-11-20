import { InputNumber as AntInputNumber, type InputNumberProps } from 'antd';

interface NumberInputProps extends InputNumberProps {
  /** Масштабный коэффициент. Отображаемое значение = реальное / round */
  round?: number;
}

/**
 * Обёртка над Ant Design InputNumber, которая масштабирует вводимые значения.
 * Например, при round = 10 ввод 1.5 соответствует реальному значению 15,
 * шаг也变得 в 10 раз меньше.
 */
export function NumberInput({
  value,
  defaultValue,
  step: stepProp = 1,
  round = 1,
  onChange,
  ...props
}: NumberInputProps) {
  // Количество десятичных знаков для отображения (предполагается, что round — степень 10)
  const decimals = Math.max(0, Math.log10(round));
  const step = stepProp / round;

  const handleChange = (val: number | null) => {
    // Преобразуем отображаемое значение обратно в реальное
    onChange?.(val !== null ? val * round : null);
  };

  return (
    <AntInputNumber
      // Если value передан, компонент становится контролируемым
      value={value !== undefined ? (value !== null ? value / round : null) : undefined}
      defaultValue={
        defaultValue !== undefined
          ? defaultValue !== null
            ? defaultValue / round
            : null
          : undefined
      }
      step={step}
      precision={decimals}
      onChange={handleChange}
      {...props}
    />
  );
}