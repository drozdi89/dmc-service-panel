import {
  resetDeviceFormUiStore,
  useDeviceFormUiStore,
} from '../model/deviceFormUiStore';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  EditOutlined: () => null,
}));

import { DeviceCreateButton } from './DeviceCreateButton';
import { DeviceEditButton } from './DeviceEditButton';

describe('DeviceCreateButton', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
  });

  it('dispatches openCreate with consumerId and type-lock', () => {
    render(
      <DeviceCreateButton
        consumerId="field-a"
        deviceType="camera"
        lockDeviceType
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
      deviceType: 'camera',
      lockDeviceType: true,
    });
  });

  it('uses onClick override instead of store', () => {
    const onClick = vi.fn();
    render(
      <DeviceCreateButton
        consumerId="field-a"
        deviceType="camera"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'none',
    });
  });
});

describe('DeviceEditButton', () => {
  beforeEach(() => {
    resetDeviceFormUiStore();
  });

  it('dispatches openEdit with deviceId, deviceType and consumerId', () => {
    render(
      <DeviceEditButton
        deviceId={42}
        deviceType="printer"
        consumerId="field-b"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Изменить' }));

    expect(useDeviceFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      deviceId: 42,
      deviceType: 'printer',
      consumerId: 'field-b',
      lockDeviceType: true,
    });
  });

  it('stays disabled without deviceId', () => {
    render(<DeviceEditButton deviceType="camera" consumerId="field-b" />);
    expect(screen.getByRole('button', { name: 'Изменить' })).toBeDisabled();
  });
});
