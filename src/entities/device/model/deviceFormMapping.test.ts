import { describe, expect, it } from 'vitest';
import {
  buildDividerPort,
  formatDeviceAddress,
  parseDividerPort,
} from './deviceAddress';
import { SCALE_TYPE_CHECKWEIR, SCALE_TYPE_MASSA_K_TERM_A } from './constants';
import {
  createDefaultFormValues,
  selectFormData,
  prepareSave,
  normalizeScalePortForSave,
} from './deviceFormMapping';
import { validateScalePort } from '../lib/networkValidation';
import type { DeviceListItem } from './types';

describe('formatDeviceAddress', () => {
  it('formats camera host:port', () => {
    const item: DeviceListItem = {
      device_type: 'camera',
      id: 1,
      name: 'Cam',
      host: '10.0.0.1',
      port: 10001,
    };
    expect(formatDeviceAddress(item)).toBe('10.0.0.1:10001');
  });

  it('formats controller port as plain string', () => {
    const item: DeviceListItem = {
      device_type: 'controller',
      id: 2,
      name: 'Ctrl',
      port: 'COM3',
    };
    expect(formatDeviceAddress(item)).toBe('COM3');
  });

  it('formats divider combined port', () => {
    const item: DeviceListItem = {
      device_type: 'divider',
      id: 3,
      name: 'Div',
      port: '192.168.0.5:502',
    };
    expect(formatDeviceAddress(item)).toBe('192.168.0.5:502');
  });

  it('formats serial scale port without host', () => {
    const item: DeviceListItem = {
      device_type: 'scale',
      id: 4,
      name: 'Scale',
      port: 'COM3',
    };
    expect(formatDeviceAddress(item)).toBe('COM3');
  });

  it('formats legacy serial scale index as COM{n}', () => {
    const item: DeviceListItem = {
      device_type: 'scale',
      id: 5,
      name: 'Scale',
      port: '3',
    };
    expect(formatDeviceAddress(item)).toBe('COM3');
  });

  it('formats TCP scale as host:port', () => {
    const item: DeviceListItem = {
      device_type: 'scale',
      id: 6,
      name: 'Chw',
      host: '10.0.0.5',
      port: '21053',
    };
    expect(formatDeviceAddress(item)).toBe('10.0.0.5:21053');
  });
});

describe('divider port helpers', () => {
  it('parses host:port', () => {
    expect(parseDividerPort('10.0.0.2:503')).toEqual({
      host: '10.0.0.2',
      port: '503',
    });
  });

  it('builds combined port', () => {
    expect(buildDividerPort('10.0.0.2', '503')).toBe('10.0.0.2:503');
  });
});

describe('deviceFormMapping', () => {
  it('creates camera defaults', () => {
    const values = createDefaultFormValues('camera');
    expect(values).not.toHaveProperty('device_type');
    expect(values.port).toBe(23);
  });

  it('maps camera form to API payload', () => {
    const payload = prepareSave('camera', {
      name: ' Cam-1 ',
      host: '10.0.0.1',
      port: 23,
    });
    expect(payload).toEqual({
      name: 'Cam-1',
      host: '10.0.0.1',
      port: 23,
      use_hikrobot_sdk: false,
    });
  });

  it('maps divider detail to form and back with delay in ms', () => {
    const formValues = selectFormData('divider', {
      id: 5,
      name: 'Div',
      port: '10.0.0.3:502',
      delay: 1500,
    });
    expect(formValues.delay).toBe(1500);
    expect(formValues.port).toBe('10.0.0.3:502');

    const payload = prepareSave('divider', formValues);
    expect(payload).toEqual({
      name: 'Div',
      port: '10.0.0.3:502',
      delay: 1500,
    });
  });

  it('creates scale defaults with serial port COM1', () => {
    const values = createDefaultFormValues('scale');
    expect(values.port).toBe('COM1');
    expect(values.type).toBe(0);
  });

  it('creates scale defaults with TCP port for CHECKWEIR', () => {
    const values = createDefaultFormValues('scale', { scaleType: SCALE_TYPE_CHECKWEIR });
    expect(values.port).toBe('21053');
    expect(values.type).toBe(SCALE_TYPE_CHECKWEIR);
  });

  it('maps scale form to API payload with string port', () => {
    const payload = prepareSave('scale', {
      name: ' Весы-1 ',
      host: '',
      port: 'COM3',
      type: 0,
    });
    expect(payload).toMatchObject({
      name: 'Весы-1',
      host: null,
      port: 'COM3',
      type: 0,
    });
    expect(typeof (payload as { port: string }).port).toBe('string');
  });

  it('normalizes legacy numeric serial port to COM{n}', () => {
    expect(normalizeScalePortForSave('3', 0, '')).toBe('COM3');
    const payload = prepareSave('scale', {
      name: 'Scale',
      host: '',
      port: '3',
      type: 0,
    });
    expect((payload as { port: string }).port).toBe('COM3');
  });

  it('maps scale detail port to string form value', () => {
    const formValues = selectFormData('scale', {
      id: 7,
      name: 'Scale',
      host: null,
      port: 'ttyACM0',
      type: 0,
      sql_host: null,
      sql_port: null,
      sql_db: null,
      sql_user: null,
      sql_pass: null,
      unit_template_id: null,
      pack_template_id: null,
    });
    expect(formValues.port).toBe('ttyACM0');
  });

  it('maps MASSA_K_TERM_A serial mode (no host) with COM port', () => {
    const payload = prepareSave('scale', {
      name: 'Massa-K',
      host: '',
      port: 'COM5',
      type: SCALE_TYPE_MASSA_K_TERM_A,
    });
    expect(payload).toMatchObject({
      host: null,
      port: 'COM5',
      type: SCALE_TYPE_MASSA_K_TERM_A,
    });
    expect(normalizeScalePortForSave('COM5', SCALE_TYPE_MASSA_K_TERM_A, '')).toBe('COM5');
  });

  it('maps MASSA_K_TERM_A TCP mode (with host) with numeric port string', () => {
    const payload = prepareSave('scale', {
      name: 'Massa-K TCP',
      host: '10.0.0.8',
      port: '21053',
      type: SCALE_TYPE_MASSA_K_TERM_A,
    });
    expect(payload).toMatchObject({
      host: '10.0.0.8',
      port: '21053',
      type: SCALE_TYPE_MASSA_K_TERM_A,
    });
    expect(normalizeScalePortForSave('21053', SCALE_TYPE_MASSA_K_TERM_A, '10.0.0.8')).toBe(
      '21053',
    );
  });

  it('rejects COM0 for serial scale port validation', () => {
    expect(validateScalePort(0, '', 'COM0')).toMatch(/COM/);
    expect(validateScalePort(SCALE_TYPE_MASSA_K_TERM_A, '', 'COM0')).toMatch(/COM/);
  });
});
