import * as sharedApi from '@/shared/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTasksListPath, fetchTaskList } from './api';

describe('buildTasksListPath', () => {
  it('appends FilterData scalar and pagination params', () => {
    const path = buildTasksListPath('/api/v2/tasks/list', {
      filter_type: 'mandate',
      start: '2026-06-01',
      end: '2026-06-30',
      gtin: '04601234567890',
      size: 50,
      number: 1,
      view: 'card',
    });

    expect(path).toContain('filter_type=mandate');
    expect(path).toContain('start=2026-06-01');
    expect(path).toContain('end=2026-06-30');
    expect(path).toContain('gtin=04601234567890');
    expect(path).toContain('size=50');
    expect(path).toContain('number=1');
    expect(path).toContain('view=card');
  });

  it('repeats array filter params for lines, statuses and task ids', () => {
    const path = buildTasksListPath('/api/v2/tasks/list', {
      lines: [1, 2],
      statuses: [3, 5],
      tasks: [100, 101],
      origin_tasks: [50],
    });

    expect(path).toContain('lines=1');
    expect(path).toContain('lines=2');
    expect(path).toContain('statuses=3');
    expect(path).toContain('statuses=5');
    expect(path).toContain('tasks=100');
    expect(path).toContain('tasks=101');
    expect(path).toContain('origin_tasks=50');
  });

  it('omits empty optional params', () => {
    const path = buildTasksListPath('/api/v2/tasks/list', {
      gtin: '',
      start: null,
      view: undefined,
    });

    expect(path).not.toContain('gtin=');
    expect(path).not.toContain('start=');
    expect(path).not.toContain('view=');
  });
});

describe('fetchTaskList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls apiRequestData with built list path and returns paginated cards', async () => {
    const mockResponse = {
      page: 1,
      next_page: 2,
      previous_page: 0,
      size: 100,
      total_records: 1,
      response: [
        {
          taskid: 1001,
          status: 3,
          revision: null,
          amount: 5000,
          taskdate: '2026-06-01',
          mandate: '2026-06-01',
          msg: '',
          expiration_date: '2026-07-01',
          error_state: false,
          origin_taskid: null,
          use_printed_dm: false,
          include_printed_dm: false,
          print_plain_template: false,
          stock_number: '',
          boiler_number: '',
          shift_number: 0,
          personal: true,
          dt_number: '',
          dt_date: null,
          payment_on_emission: false,
          last_updated: '2026-06-01T10:00:00.000000',
          marking_system: 'CZ',
          send_codes_up_to_number: 0,
          parent_task_id: null,
          use_fixed_mandate: false,
          mandate_from_scandate: false,
          task_type: 'DEFAULT',
          crpt_mod: '',
          vsd: '',
          line: {
            id: 3,
            name: 'Линия 1',
            line_type: 'DEFAULT',
            is_manual: false,
            is_scaled: false,
          },
          product: {
            gtin: '04601234567890',
            name: 'Молоко',
            pg: 'Молочная продукция',
            type: 'UNIT',
            crpt_inn: '7700000000',
            lifetime: 14,
            lifetime_unit: 'DAYS',
            mrp: 8900,
            is_imported: false,
            measure_unit: 'U',
            beer_volume_ml: 0,
            auto_send_introduce: false,
            auto_send_apply: false,
            vet_control: false,
            owner_inn: '7700000000',
            contract_commissioning: false,
          },
          count: {
            printed: 1200,
            verified: 1180,
            verified_in_measure_units: 0,
            applied: 1100,
            introduced: 1000,
            reserved: 50,
            defects: 5,
            exported: 0,
            scanner_verified: 0,
            scanner_defects: 0,
            min_emission_date: '2026-06-01T08:00:00.000000',
          },
          aggregates: {},
          dimensions: {},
        },
      ],
    };

    const apiRequestData = vi
      .spyOn(sharedApi, 'apiRequestData')
      .mockResolvedValue(mockResponse);

    const result = await fetchTaskList({
      lines: [3],
      size: 100,
      number: 0,
      view: 'card',
    });

    expect(apiRequestData).toHaveBeenCalledOnce();
    const [calledPath] = apiRequestData.mock.calls[0] as [string];
    expect(calledPath).toContain('/api/v2/tasks/list');
    expect(calledPath).toContain('lines=3');
    expect(calledPath).toContain('view=card');
    expect(result).toEqual(mockResponse);
  });
});
