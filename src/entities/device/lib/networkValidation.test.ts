import { describe, expect, it } from 'vitest';
import { validateHost, validateScalePort } from './networkValidation';

describe('validateHost', () => {
  it('accepts camera IP and IP;IP2', () => {
    expect(validateHost('camera', '192.168.0.1')).toBeNull();
    expect(validateHost('camera', '192.168.0.1;10.0.0.2')).toBeNull();
  });

  it('accepts printer IP with optional port and backup', () => {
    expect(validateHost('printer', '192.168.0.10')).toBeNull();
    expect(validateHost('printer', '192.168.0.10:9100')).toBeNull();
    expect(validateHost('printer', '192.168.0.10+192.168.0.11')).toBeNull();
  });

  it('accepts scale and sql_host IP', () => {
    expect(validateHost('scale', '10.1.2.3')).toBeNull();
    expect(validateHost('sql_host', '10.1.2.3')).toBeNull();
  });

  it('accepts controller COM and IP:port', () => {
    expect(validateHost('controller_port', 'COM3')).toBeNull();
    expect(validateHost('controller_port', '192.168.1.5:502')).toBeNull();
  });

  it('accepts divider COM and IP', () => {
    expect(validateHost('divider_host', 'COM5')).toBeNull();
    expect(validateHost('divider_host', '192.168.1.20')).toBeNull();
  });

  it('rejects invalid addresses', () => {
    expect(validateHost('camera', 'not-an-ip')).toMatch(/IP/);
    expect(validateHost('printer', 'bad;host')).toMatch(/IP/);
    expect(validateHost('controller_port', 'COM0')).toMatch(/COM/);
  });

  it('allows empty host without error', () => {
    expect(validateHost('camera', '')).toBeNull();
    expect(validateHost('camera', '   ')).toBeNull();
  });

  it('accepts controller and divider device types', () => {
    expect(validateHost('controller', 'COM7')).toBeNull();
    expect(validateHost('divider', '192.168.0.5')).toBeNull();
  });

  it('rejects invalid divider and scale hosts', () => {
    expect(validateHost('divider', 'COM0')).toMatch(/COM|IP/);
    expect(validateHost('scale', '256.1.1.1')).toMatch(/IP/);
  });
});

describe('validateScalePort', () => {
  it('accepts serial ports COM3 and ttyACM0', () => {
    expect(validateScalePort(0, '', 'COM3')).toBeNull();
    expect(validateScalePort(2, null, 'ttyACM0')).toBeNull();
    expect(validateScalePort(3, '', '/dev/ttyUSB0')).toBeNull();
    expect(validateScalePort(0, '', '3')).toBeNull();
  });

  it('accepts TCP ports for checkweigher types', () => {
    expect(validateScalePort(1, '10.0.0.5', '21053')).toBeNull();
    expect(validateScalePort(6, '192.168.1.1', '4001')).toBeNull();
  });

  it('uses host to select TCP mode for MASSA_K_TERM_A', () => {
    expect(validateScalePort(5, '10.0.0.8', '21053')).toBeNull();
    expect(validateScalePort(5, '', 'COM3')).toBeNull();
  });

  it('rejects invalid serial and TCP scale ports', () => {
    expect(validateScalePort(0, '', '')).toMatch(/Укажите порт/);
    expect(validateScalePort(0, '', 'COM0')).toMatch(/COM/);
    expect(validateScalePort(1, '10.0.0.1', '70000')).toMatch(/65535/);
    expect(validateScalePort(1, '10.0.0.1', 'abc')).toMatch(/65535/);
  });
});
