import {
  resetDeviceFormUiStore,
  useDeviceFormUiStore,
} from '../model/deviceFormUiStore';
import type { LookupOption } from '@/shared/ui/AsyncLookupSelect';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  EditOutlined: () => null,
}));

vi.mock('@/shared/ui/AsyncLookupSelect', () => ({
  AsyncLookupSelect: ({
    value,
    selectedOption,
    onChange,
  }: {
    value?: string | number | null;
    selectedOption?: LookupOption | null;
    onChange?: (
      value: string | number | null,
      option?: LookupOption | null,
    ) => void;
  }) => (
    <div>
      <div
        data-testid="select-device"
        data-value={String(value ?? '')}
        data-label={selectedOption?.label ?? ''}
      />
      <button
        type="button"
        data-testid="select-pick"
        onClick={() => onChange?.(42, { value: 42, label: 'Picked locally' })}
      >
        pick
      </button>
    </div>
  ),
}));

import { DeviceResourcePicker } from './DeviceResourcePicker';

describe('DeviceResourcePicker', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
  });

  it('opens create via store with type-lock and stable consumerId', () => {
    render(
      <DeviceResourcePicker
        consumerId="field-a"
        types={['camera']}
        deviceType="camera"
      />,
    );

    screen.getByRole('button', { name: 'Добавить' }).click();

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
  });

  it('opens edit via store for the current value', () => {
    render(
      <DeviceResourcePicker
        consumerId="field-a"
        types={['printer']}
        deviceType="printer"
        value={7}
        valueLabel="P7"
      />,
    );

    screen.getByRole('button', { name: 'Изменить' }).click();

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      deviceId: 7,
      deviceType: 'printer',
      consumerId: 'field-a',
      lockDeviceType: true,
    });
  });

  it('consumes lastSaved for the same consumer and calls onChange', async () => {
    const onChange = vi.fn();
    render(
      <DeviceResourcePicker
        consumerId="field-a"
        deviceType="camera"
        onChange={onChange}
      />,
    );

    act(() => {
      useDeviceFormUiStore.getState().setLastSaved({
        consumerId: 'field-a',
        id: 15,
        name: 'New camera',
      });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(15, {
        value: 15,
        label: 'New camera',
      });
    });
    expect(useDeviceFormUiStore.getState().lastSaved).toBeNull();
  });

  it('does not consume lastSaved for a different consumerId', async () => {
    const onChange = vi.fn();
    render(
      <DeviceResourcePicker
        consumerId="field-a"
        deviceType="camera"
        onChange={onChange}
      />,
    );

    act(() => {
      useDeviceFormUiStore.getState().setLastSaved({
        consumerId: 'field-b',
        id: 15,
        name: 'Other',
      });
    });

    await waitFor(() => {
      expect(useDeviceFormUiStore.getState().lastSaved).toEqual({
        consumerId: 'field-b',
        id: 15,
        name: 'Other',
      });
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('discards store handoff for this consumer on unmount', () => {
    const { unmount } = render(
      <DeviceResourcePicker
        consumerId="field-a"
        deviceType="camera"
      />,
    );

    act(() => {
      useDeviceFormUiStore.getState().openCreate({
        consumerId: 'field-a',
        deviceType: 'camera',
        lockDeviceType: true,
      });
      useDeviceFormUiStore.getState().setLastSaved({
        consumerId: 'field-a',
        id: 1,
        name: 'Stale',
      });
    });

    unmount();

    const state = useDeviceFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });
});
