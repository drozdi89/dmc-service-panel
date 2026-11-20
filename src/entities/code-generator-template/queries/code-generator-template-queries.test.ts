import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/queries';
import { codeGeneratorTemplateQueries } from './code-generator-template-queries';

describe('codeGeneratorTemplateQueries keys', () => {
  it('uses entry code-generator-templates with list / lookup / detail scopes', () => {
    const params = { size: 20, number: 0, q: 'sscc' };

    expect(codeGeneratorTemplateQueries.keys.all()).toEqual([
      'code-generator-templates',
    ]);
    expect(codeGeneratorTemplateQueries.keys.list()).toEqual([
      'code-generator-templates',
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(codeGeneratorTemplateQueries.keys.list(params)).toEqual([
      'code-generator-templates',
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(codeGeneratorTemplateQueries.keys.lookup()).toEqual([
      'code-generator-templates',
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(codeGeneratorTemplateQueries.keys.lookup(params)).toEqual([
      'code-generator-templates',
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
    expect(codeGeneratorTemplateQueries.keys.detail(12)).toEqual([
      'code-generator-templates',
      FACTORY_QUERY_SCOPES.detail,
      12,
    ]);
  });
});
