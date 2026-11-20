import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepperNumberInput } from './StepperNumberInput';

describe('StepperNumberInput', () => {
  it('increments and decrements value via buttons', () => {
    const onChange = vi.fn();
    render(<StepperNumberInput value={5} min={0} max={10} step={1} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Увеличить'));
    expect(onChange).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByLabelText('Уменьшить'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('sets min on plus when value is empty', () => {
    const onChange = vi.fn();
    render(<StepperNumberInput value={null} min={3} max={10} onChange={onChange} />);

    expect(screen.getByLabelText('Уменьшить')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Увеличить'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('disables increment at max boundary', () => {
    render(<StepperNumberInput value={10} min={0} max={10} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Увеличить')).toBeDisabled();
  });

  it('disables decrement at min boundary', () => {
    render(<StepperNumberInput value={0} min={0} max={10} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Уменьшить')).toBeDisabled();
  });
});
