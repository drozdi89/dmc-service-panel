import { describe, expect, it } from 'vitest';
import {
  formatLinkedResourceId,
  mapApiDeviceIdToForm,
  mapFormDeviceIdToApi,
  mapFormValuesToCreatePayload,
  mapPrintStationToFormValues,
} from './printStationFormMapping';
import type { PrintStation } from './types';

describe('printStationFormMapping', () => {
  it('maps API device id 0 to null', () => {
    expect(mapApiDeviceIdToForm(0)).toBeNull();
    expect(mapApiDeviceIdToForm(null)).toBeNull();
  });

  it('maps form null device id to 0', () => {
    expect(mapFormDeviceIdToApi(null)).toBe(0);
    expect(mapFormDeviceIdToApi(12)).toBe(12);
  });

  it('formats unused linked resource', () => {
    expect(formatLinkedResourceId(0)).toBe('Не используется');
    expect(formatLinkedResourceId(7)).toBe('#7');
  });

  it('formats linked resource with name map', () => {
    const names = new Map([[7, 'Принтер А']]);
    expect(formatLinkedResourceId(7, names)).toBe('Принтер А');
    expect(formatLinkedResourceId(8, names)).toBe('#8');
  });

  it('maps station detail to form values', () => {
    const station: PrintStation = {
      station_id: 3,
      name: 'Station A',
      printer: 10,
      camera: 0,
      template_id: 5,
      max_failures: 7,
      grade_percent: 25,
    };

    expect(mapPrintStationToFormValues(station)).toEqual({
      name: 'Station A',
      printer_id: 10,
      camera_id: null,
      template_id: 5,
      max_failures: 7,
      grade_percent: 25,
    });
  });

  it('maps form values to create payload', () => {
    const payload = mapFormValuesToCreatePayload({
      name: '  New station  ',
      printer_id: null,
      camera_id: 4,
      template_id: null,
      max_failures: 5,
      grade_percent: 50,
    });

    expect(payload).toEqual({
      name: 'New station',
      printer: 0,
      camera: 4,
      template_id: null,
      max_failures: 5,
      grade_percent: 50,
    });
  });
});
