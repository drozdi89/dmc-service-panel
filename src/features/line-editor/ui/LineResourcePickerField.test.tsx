import { Form } from 'antd';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/entities/device', () => ({
  DeviceResourcePicker: ({
    value,
    valueLabel,
    onChange,
  }: {
    value?: string | number | null;
    valueLabel?: string;
    onChange?: (
      value: string | number | null,
      option?: { value: string | number; label: string } | null,
    ) => void;
  }) => (
    <div>
      <div
        data-testid="device-picker"
        data-value={String(value ?? '')}
        data-label={valueLabel ?? ''}
      />
      <button
        type="button"
        data-testid="device-pick"
        onClick={() => onChange?.(7, { value: 7, label: 'Cam 7' })}
      >
        pick
      </button>
      <button
        type="button"
        data-testid="device-clear"
        onClick={() => onChange?.(null)}
      >
        clear
      </button>
    </div>
  ),
}));

vi.mock('@/entities/print-template', () => ({
  PrintTemplateResourcePicker: () => <div data-testid="template-picker" />,
}));

import {
  LineResourcePickerField,
  normalizeResourceId,
} from './LineResourcePickerField';

describe('normalizeResourceId', () => {
  it('normalizes empty values to null and numbers from strings', () => {
    expect(normalizeResourceId(null)).toBeNull();
    expect(normalizeResourceId(undefined)).toBeNull();
    expect(normalizeResourceId('')).toBeNull();
    expect(normalizeResourceId('12')).toBe(12);
    expect(normalizeResourceId(5)).toBe(5);
  });
});

describe('LineResourcePickerField', () => {
  it('reads/writes id via Form name and syncs labelName', async () => {
    function Harness() {
      const [form] = Form.useForm<{ camera_id: number | null; cameraLabel?: string }>();
      return (
        <Form
          form={form}
          initialValues={{ camera_id: null }}
          onValuesChange={() => undefined}
        >
          <LineResourcePickerField
            name="camera_id"
            labelName="cameraLabel"
            label="Камера"
            kind="device"
            deviceType="camera"
          />
          <button
            type="button"
            data-testid="read-values"
            onClick={() => {
              const values = form.getFieldsValue(true);
              const node = document.querySelector('[data-testid="form-dump"]');
              if (node) {
                node.textContent = JSON.stringify(values);
              }
            }}
          >
            read
          </button>
          <div data-testid="form-dump" />
        </Form>
      );
    }

    render(<Harness />);

    await act(async () => {
      screen.getByTestId('device-pick').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('device-picker')).toHaveAttribute(
        'data-label',
        'Cam 7',
      );
    });

    await act(async () => {
      screen.getByTestId('read-values').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-dump').textContent).toContain('"camera_id":7');
      expect(screen.getByTestId('form-dump').textContent).toContain(
        '"cameraLabel":"Cam 7"',
      );
    });

    await act(async () => {
      screen.getByTestId('device-clear').click();
    });
    await act(async () => {
      screen.getByTestId('read-values').click();
    });

    await waitFor(() => {
      const dump = screen.getByTestId('form-dump').textContent ?? '';
      expect(dump).toMatch(/"camera_id":null/);
      expect(dump).not.toContain('"cameraLabel":"Cam 7"');
    });
  });

  it('displays watched labelName after setFieldsValue without valueLabel prop', async () => {
    function Harness() {
      const [form] = Form.useForm<{ camera_id: number | null; cameraLabel?: string }>();
      return (
        <Form form={form} initialValues={{ camera_id: null }}>
          <LineResourcePickerField
            name="camera_id"
            labelName="cameraLabel"
            label="Камера"
            kind="device"
            deviceType="camera"
          />
          <button
            type="button"
            data-testid="load-edit"
            onClick={() => {
              form.setFieldsValue({ camera_id: 42, cameraLabel: 'Loaded Cam' });
            }}
          >
            load
          </button>
        </Form>
      );
    }

    render(<Harness />);

    await act(async () => {
      screen.getByTestId('load-edit').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('device-picker')).toHaveAttribute('data-value', '42');
      expect(screen.getByTestId('device-picker')).toHaveAttribute(
        'data-label',
        'Loaded Cam',
      );
    });
  });

  it('keeps controlled value/onChange for aggregation-style usage', async () => {
    const onChange = vi.fn();

    render(
      <Form>
        <LineResourcePickerField
          label="Камера"
          kind="device"
          deviceType="camera"
          value={3}
          valueLabel="Existing"
          onChange={onChange}
        />
      </Form>,
    );

    expect(screen.getByTestId('device-picker')).toHaveAttribute('data-value', '3');
    expect(screen.getByTestId('device-picker')).toHaveAttribute(
      'data-label',
      'Existing',
    );

    await act(async () => {
      screen.getByTestId('device-pick').click();
    });

    expect(onChange).toHaveBeenCalledWith(7, 'Cam 7');
  });

  it('supports name + onChange without labelName (AggregationLevelModal pattern)', async () => {
    const onChange = vi.fn();

    function Harness() {
      const [form] = Form.useForm<{ camera_id: number | null }>();
      const [resourceLabel, setResourceLabel] = useState<string | undefined>(
        'Initial',
      );

      return (
        <Form form={form} initialValues={{ camera_id: 3 }}>
          <LineResourcePickerField
            name="camera_id"
            label="Камера агрегации"
            kind="device"
            deviceType="camera"
            valueLabel={resourceLabel}
            onChange={(id, nextLabel) => {
              onChange(id, nextLabel);
              setResourceLabel(nextLabel);
            }}
          />
          <button
            type="button"
            data-testid="read-id"
            onClick={() => {
              const node = document.querySelector('[data-testid="form-dump"]');
              if (node) {
                node.textContent = JSON.stringify(form.getFieldsValue(true));
              }
            }}
          >
            read
          </button>
          <div data-testid="form-dump" />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId('device-picker')).toHaveAttribute('data-value', '3');
    expect(screen.getByTestId('device-picker')).toHaveAttribute(
      'data-label',
      'Initial',
    );

    await act(async () => {
      screen.getByTestId('device-pick').click();
    });

    expect(onChange).toHaveBeenCalledWith(7, 'Cam 7');

    await waitFor(() => {
      expect(screen.getByTestId('device-picker')).toHaveAttribute(
        'data-label',
        'Cam 7',
      );
    });

    await act(async () => {
      screen.getByTestId('read-id').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-dump').textContent).toContain('"camera_id":7');
    });
  });
});
