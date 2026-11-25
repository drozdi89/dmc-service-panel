import * as sharedApi from '@/shared/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildCodeGeneratorTemplatePreviewPath,
  CODE_GENERATOR_TEMPLATES_LOOKUP_PATH,
  CODE_GENERATOR_TEMPLATES_PATH,
  CODE_GENERATOR_TEMPLATES_VARIABLES_PATH,
  fetchCodeGeneratorTemplateById,
  fetchCodeGeneratorTemplates,
  fetchCodeGeneratorTemplatesLookup,
  fetchCodeGeneratorTemplateVariables,
  previewCodeGeneratorTemplate,
  updateCodeGeneratorTemplate,
} from './api';

describe('code-generator-template api paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes collection / lookup / variables path constants', () => {
    expect(CODE_GENERATOR_TEMPLATES_PATH).toBe(
      '/api/v2/code_generator_templates/',
    );
    expect(CODE_GENERATOR_TEMPLATES_LOOKUP_PATH).toBe(
      '/api/v2/code_generator_templates/lookup',
    );
    expect(CODE_GENERATOR_TEMPLATES_VARIABLES_PATH).toBe(
      '/api/v2/code_generator_templates/variables',
    );
    expect(buildCodeGeneratorTemplatePreviewPath(7)).toBe(
      '/api/v2/code_generator_templates/7/preview',
    );
  });

  it('fetchCodeGeneratorTemplates calls list path via fetchPaginatedList', async () => {
    const fetchPaginatedList = vi
      .spyOn(sharedApi, 'fetchPaginatedList')
      .mockResolvedValue({
        page: 0,
        next_page: 0,
        previous_page: 0,
        size: 50,
        total_records: 0,
        response: [],
      });

    await fetchCodeGeneratorTemplates({ size: 50, number: 0, q: 'pack' });

    expect(fetchPaginatedList).toHaveBeenCalledWith(
      CODE_GENERATOR_TEMPLATES_PATH,
      { size: 50, number: 0, q: 'pack' },
    );
  });

  it('fetchCodeGeneratorTemplatesLookup calls lookup path', async () => {
    const fetchPaginatedList = vi
      .spyOn(sharedApi, 'fetchPaginatedList')
      .mockResolvedValue({
        page: 0,
        next_page: 0,
        previous_page: 0,
        size: 20,
        total_records: 0,
        response: [],
      });

    await fetchCodeGeneratorTemplatesLookup({ size: 20, number: 0 });

    expect(fetchPaginatedList).toHaveBeenCalledWith(
      CODE_GENERATOR_TEMPLATES_LOOKUP_PATH,
      { size: 20, number: 0 },
    );
  });

  it('fetchCodeGeneratorTemplateById calls detail path', async () => {
    const apiRequestData = vi
      .spyOn(sharedApi, 'apiRequestData')
      .mockResolvedValue({ id: 3, name: 'demo', template: '{gtin}' });

    await fetchCodeGeneratorTemplateById(3);

    expect(apiRequestData).toHaveBeenCalledWith(
      '/api/v2/code_generator_templates/3',
      expect.objectContaining({}),
    );
  });

  it('fetchCodeGeneratorTemplateVariables calls variables path', async () => {
    const apiRequestData = vi
      .spyOn(sharedApi, 'apiRequestData')
      .mockResolvedValue([]);

    await fetchCodeGeneratorTemplateVariables();

    expect(apiRequestData).toHaveBeenCalledWith(
      CODE_GENERATOR_TEMPLATES_VARIABLES_PATH,
      expect.objectContaining({}),
    );
  });

  it('updateCodeGeneratorTemplate maps counter_config to CounterSpecSchema', async () => {
    const apiRequestData = vi
      .spyOn(sharedApi, 'apiRequestData')
      .mockResolvedValue({ id: 11, name: 'T', template: 'x' });

    await updateCodeGeneratorTemplate(
      11,
      {
        name: 'T',
        counter_config: [
          {
            name: 'serial',
            width: 6,
            key_fields: ['taskid'],
            min: 1,
            max: 0,
          },
        ],
      },
      'key-1',
    );

    expect(apiRequestData).toHaveBeenCalledWith(
      '/api/v2/code_generator_templates/11',
      expect.objectContaining({
        method: 'PATCH',
        body: {
          name: 'T',
          counter_config: [
            {
              name: 'serial',
              width: 6,
              key_fields: ['taskid'],
              min: 1,
              max: 0,
            },
          ],
        },
        idempotencyKey: 'key-1',
      }),
    );
  });

  it('previewCodeGeneratorTemplate POSTs preview path with task_id and aggregation_level', async () => {
    const apiRequestData = vi
      .spyOn(sharedApi, 'apiRequestData')
      .mockResolvedValue({ code: '010460123456789021ABC' });

    await previewCodeGeneratorTemplate(5, {
      task_id: 100,
      aggregation_level: -1,
      weight: 500,
    });

    expect(apiRequestData).toHaveBeenCalledWith(
      '/api/v2/code_generator_templates/5/preview',
      expect.objectContaining({
        method: 'POST',
        params: expect.objectContaining({
          task_id: 100,
          aggregation_level: -1,
          weight: 500,
        }),
      }),
    );
  });
});
