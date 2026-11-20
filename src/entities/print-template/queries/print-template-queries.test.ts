import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/lib/factory-query';
import { printTemplateQueries } from './print-template-queries';

describe('printTemplateQueries keys', () => {
  it('uses entry print-templates with list / lookup / detail scopes', () => {
    const params = { size: 20, number: 0, q: 'label' };

    expect(printTemplateQueries.keys.all()).toEqual(['print-templates']);
    expect(printTemplateQueries.keys.list()).toEqual([
      'print-templates',
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(printTemplateQueries.keys.list(params)).toEqual([
      'print-templates',
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(printTemplateQueries.keys.lookup()).toEqual([
      'print-templates',
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(printTemplateQueries.keys.lookup(params)).toEqual([
      'print-templates',
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
    expect(printTemplateQueries.keys.detail(12)).toEqual([
      'print-templates',
      FACTORY_QUERY_SCOPES.detail,
      12,
    ]);
  });
});
