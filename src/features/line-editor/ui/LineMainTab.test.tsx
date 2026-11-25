import {
  computeLineEditorVisibility,
  createDefaultLineEditorLabels,
  createDefaultLineFormState,
  type LineEditorFormState,
  type LineEditorResourceLabels,
} from '@/entities/line';
import { App, Form } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/entities/device', () => ({
  SCALE_TYPE_CHECKWEIGHT_NEW: 5,
  SCALE_TYPE_CHECKWEIR: 3,
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
        onClick={() => onChange?.(7, { value: 7, label: 'Dev 7' })}
      >
        pick
      </button>
    </div>
  ),
}));

vi.mock('@/entities/print-template', () => ({
  PrintTemplateResourcePicker: () => <div data-testid="template-picker" />,
}));

import { LineMainTab } from './LineMainTab';
import { LineIdentityFields } from './lineFormSections/LineIdentityFields';

function Harness({
  initial,
  initialLabels,
  isNew = true,
  valuesRef,
  labelsRef,
}: {
  initial?: Partial<LineEditorFormState>;
  initialLabels?: Partial<LineEditorResourceLabels>;
  isNew?: boolean;
  valuesRef: { current: LineEditorFormState | null };
  labelsRef: { current: LineEditorResourceLabels | null };
}) {
  const [form] = Form.useForm<LineEditorFormState>();
  const values = { ...createDefaultLineFormState(), ...initial };
  const [resourceLabels, setResourceLabels] = useState<LineEditorResourceLabels>({
    ...createDefaultLineEditorLabels(),
    ...initialLabels,
  });
  const formRef = useRef(form);
  formRef.current = form;
  const visibility = computeLineEditorVisibility(values, isNew);

  return (
    <App>
      <Form form={form} initialValues={values} component={false}>
        <Form.Item name="output" hidden preserve noStyle>
          <input />
        </Form.Item>
        <Form.Item name="is_scale" hidden preserve noStyle>
          <input />
        </Form.Item>
        <LineIdentityFields visibility={visibility} />
        <LineMainTab
          isNew={isNew}
          visibility={visibility}
          resourceLabels={resourceLabels}
          onResourceLabelsChange={setResourceLabels}
        />
        <button
          type="button"
          data-testid="dump-output"
          onClick={() => {
            valuesRef.current = formRef.current.getFieldsValue(true) as LineEditorFormState;
            labelsRef.current = resourceLabels;
          }}
        >
          dump
        </button>
      </Form>
    </App>
  );
}

function renderMainTab(
  initial?: Partial<LineEditorFormState>,
  initialLabels?: Partial<LineEditorResourceLabels>,
) {
  const valuesRef: { current: LineEditorFormState | null } = { current: null };
  const labelsRef: { current: LineEditorResourceLabels | null } = { current: null };
  render(<Harness initial={initial} initialLabels={initialLabels} valuesRef={valuesRef} labelsRef={labelsRef} />);
  const readValues = (): LineEditorFormState => {
    fireEvent.click(screen.getByTestId('dump-output'));
    if (!valuesRef.current) {
      throw new Error('Form values were not captured');
    }
    return valuesRef.current;
  };
  const readLabels = (): LineEditorResourceLabels => {
    fireEvent.click(screen.getByTestId('dump-output'));
    if (!labelsRef.current) {
      throw new Error('Resource labels were not captured');
    }
    return labelsRef.current;
  };
  return { readValues, readLabels };
}

describe('LineMainTab Form sections', () => {
  it('writes linename via Form.Item without controlled patch props', () => {
    const { readValues } = renderMainTab();

    fireEvent.change(screen.getByPlaceholderText('Название производственной линии'), {
      target: { value: 'Линия А' },
    });

    expect(readValues().linename).toBe('Линия А');
  });

  it('writes output / is_scale when switching printer → checkweir and keeps scale_id', async () => {
    const { readValues, readLabels } = renderMainTab(
      {
        output: 0,
        is_scale: false,
        scale_id: 42,
      },
      { scaleLabel: 'ЧВ-42' },
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Чеквейр' }));

    await waitFor(() => {
      const dump = readValues();
      expect(dump.output).toBe(1);
      expect(dump.is_scale).toBe(false);
      expect(dump.scale_id).toBe(42);
    });

    expect(readLabels().scaleLabel).toBe('ЧВ-42');
  });

  it('writes options.* checkboxes via nested Form.Item names', () => {
    const { readValues } = renderMainTab();

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Разрешить создание задания на линии' }),
    );

    expect(readValues().options.can_add_task).toBe(true);
  });

  it('registers camera picker via name with external label state', () => {
    const { readValues, readLabels } = renderMainTab();

    const serializationCamera = screen
      .getByText('Камера сериализации')
      .closest('.ant-form-item');
    expect(serializationCamera).toBeTruthy();
    fireEvent.click(
      within(serializationCamera as HTMLElement).getByTestId('device-pick'),
    );

    const dump = readValues();
    expect(dump.camera_id).toBe(7);
    expect(dump).not.toHaveProperty('cameraLabel');
    expect(readLabels().cameraLabel).toBe('Dev 7');
  });
});
