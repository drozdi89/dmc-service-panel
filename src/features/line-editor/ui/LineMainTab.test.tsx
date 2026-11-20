import {
  createDefaultLineFormState,
  type LineEditorFormState,
} from '@/entities/line';
import { App, Form } from 'antd';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useRef } from 'react';
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
import { computeLineEditorVisibility } from '@/entities/line';

function Harness({
  initial,
  isNew = true,
  valuesRef,
}: {
  initial?: Partial<LineEditorFormState>;
  isNew?: boolean;
  valuesRef: { current: LineEditorFormState | null };
}) {
  const [form] = Form.useForm<LineEditorFormState>();
  const values = { ...createDefaultLineFormState(), ...initial };
  const formRef = useRef(form);
  formRef.current = form;
  const visibility = computeLineEditorVisibility(values, isNew);

  return (
    <App>
      <Form form={form} initialValues={values} component={false}>
        <LineIdentityFields visibility={visibility} />
        <LineMainTab isNew={isNew} visibility={visibility} />
        <button
          type="button"
          data-testid="dump-output"
          onClick={() => {
            valuesRef.current = formRef.current.getFieldsValue(true) as LineEditorFormState;
          }}
        >
          dump
        </button>
      </Form>
    </App>
  );
}

function renderMainTab(initial?: Partial<LineEditorFormState>) {
  const valuesRef: { current: LineEditorFormState | null } = { current: null };
  render(<Harness initial={initial} valuesRef={valuesRef} />);
  const readValues = (): LineEditorFormState => {
    fireEvent.click(screen.getByTestId('dump-output'));
    if (!valuesRef.current) {
      throw new Error('Form values were not captured');
    }
    return valuesRef.current;
  };
  return { readValues };
}

describe('LineMainTab Form sections', () => {
  it('writes name via Form.Item without controlled patch props', () => {
    const { readValues } = renderMainTab();

    fireEvent.change(screen.getByPlaceholderText('Название производственной линии'), {
      target: { value: 'Линия А' },
    });

    expect(readValues().name).toBe('Линия А');
  });

  it('migrates scale ids when switching printer → checkweir', () => {
    const { readValues } = renderMainTab({
      outputMode: 'printer',
      new_chw_scale_id: 42,
      newChwScaleLabel: 'ЧВ-42',
      scale_id: null,
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Чеквейр' }));

    const dump = readValues();
    expect(dump.outputMode).toBe('checkweir');
    expect(dump.scale_id).toBe(42);
    expect(dump.scaleLabel).toBe('ЧВ-42');
    expect(dump.new_chw_scale_id).toBeNull();
  });

  it('writes options.* checkboxes via nested Form.Item names', () => {
    const { readValues } = renderMainTab();

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Разрешить создание задания на линии' }),
    );

    expect(readValues().options.can_add_task).toBe(true);
  });

  it('registers camera picker via name/labelName', () => {
    const { readValues } = renderMainTab();

    const serializationCamera = screen
      .getByText('Камера сериализации')
      .closest('.ant-form-item');
    expect(serializationCamera).toBeTruthy();
    fireEvent.click(
      within(serializationCamera as HTMLElement).getByTestId('device-pick'),
    );

    const dump = readValues();
    expect(dump.camera_id).toBe(7);
    expect(dump.cameraLabel).toBe('Dev 7');
  });
});
