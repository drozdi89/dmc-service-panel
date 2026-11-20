import {
  resetDeviceFormUiStore,
  useDeviceFormUiStore,
} from '../model/deviceFormUiStore';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  EditOutlined: () => null,
  DeleteOutlined: () => null,
  ArrowUpOutlined: () => null,
  ArrowDownOutlined: () => null,
}));

vi.mock('@/shared/ui/AsyncLookupSelect', () => ({
  AsyncLookupSelect: () => <div data-testid="async-lookup-select" />,
}));

import { DeviceResourceListEditor } from './DeviceResourceListEditor';

describe('DeviceResourceListEditor', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
  });

  it('renders ids with labels from the labels map', () => {
    render(
      <DeviceResourceListEditor
        deviceType="camera"
        ids={[1, 2]}
        labels={{ 1: 'Cam A', 2: 'Cam B' }}
        onChange={() => undefined}
        showCreate={false}
        showEdit={false}
      />,
    );

    expect(screen.getByText('Cam A')).toBeInTheDocument();
    expect(screen.getByText('Cam B')).toBeInTheDocument();
  });

  it('reorders ids via enableReorder', () => {
    const onChange = vi.fn();
    render(
      <DeviceResourceListEditor
        deviceType="printer"
        ids={[1, 2, 3]}
        labels={{ 1: 'A', 2: 'B', 3: 'C' }}
        onChange={onChange}
        enableReorder
        showCreate={false}
        showEdit={false}
      />,
    );

    screen.getAllByRole('button', { name: 'Переместить вниз' })[0].click();
    expect(onChange).toHaveBeenCalledWith([2, 1, 3]);
  });

  it('opens create via store with locked deviceType', () => {
    render(
      <DeviceResourceListEditor
        consumerId="list-a"
        deviceType="camera"
        ids={[]}
        labels={{}}
        onChange={() => undefined}
      />,
    );

    screen.getByRole('button', { name: 'Добавить' }).click();

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'list-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
  });

  it('opens edit via store for the row id', () => {
    render(
      <DeviceResourceListEditor
        consumerId="list-a"
        deviceType="printer"
        ids={[5]}
        labels={{ 5: 'P5' }}
        onChange={() => undefined}
      />,
    );

    screen.getByRole('button', { name: 'Изменить' }).click();

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      deviceId: 5,
      deviceType: 'printer',
      consumerId: 'list-a',
      lockDeviceType: true,
    });
  });

  it('consumes lastSaved and appends id + label', () => {
    const onChange = vi.fn();
    const onLabelChange = vi.fn();
    render(
      <DeviceResourceListEditor
        consumerId="list-a"
        deviceType="camera"
        ids={[1]}
        labels={{ 1: 'Old' }}
        onChange={onChange}
        onLabelChange={onLabelChange}
        showCreate={false}
        showEdit={false}
      />,
    );

    act(() => {
      useDeviceFormUiStore.getState().setLastSaved({
        consumerId: 'list-a',
        id: 9,
        name: 'New cam',
      });
    });

    expect(onChange).toHaveBeenCalledWith([1, 9]);
    expect(onLabelChange).toHaveBeenCalledWith(9, 'New cam');
    expect(useDeviceFormUiStore.getState().lastSaved).toBeNull();
  });

  it('discards store handoff for this consumer on unmount', () => {
    const { unmount } = render(
      <DeviceResourceListEditor
        consumerId="list-a"
        deviceType="camera"
        ids={[]}
        labels={{}}
        onChange={() => undefined}
      />,
    );

    act(() => {
      useDeviceFormUiStore.getState().openCreate({
        consumerId: 'list-a',
        deviceType: 'camera',
        lockDeviceType: true,
      });
      useDeviceFormUiStore.getState().setLastSaved({
        consumerId: 'list-a',
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
