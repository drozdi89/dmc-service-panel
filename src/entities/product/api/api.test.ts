import { describe, expect, it } from 'vitest';
import { buildProductsListPath } from './api';

describe('buildProductsListPath', () => {
  it('appends scalar list query params', () => {
    const path = buildProductsListPath('/api/v2/products/list', {
      size: 50,
      number: 1,
      q: 'milk',
      sort_by: 'name',
      sort_dir: 'asc',
      archived: false,
    });

    expect(path).toContain('size=50');
    expect(path).toContain('number=1');
    expect(path).toContain('q=milk');
    expect(path).toContain('sort_by=name');
    expect(path).toContain('sort_dir=asc');
    expect(path).toContain('archived=false');
  });

  it('repeats product_groups for multi-select filter', () => {
    const path = buildProductsListPath('/api/v2/products/list', {
      product_groups: ['MILK', 'WATER'],
    });

    expect(path).toContain('product_groups=MILK');
    expect(path).toContain('product_groups=WATER');
  });

  it('omits empty optional params', () => {
    const path = buildProductsListPath('/api/v2/products/list', {
      q: '',
      archived: undefined,
    });

    expect(path).not.toContain('q=');
    expect(path).not.toContain('archived=');
  });

  it('builds lookup path with same filter params', () => {
    const path = buildProductsListPath('/api/v2/products/lookup', {
      size: 20,
      number: 0,
      q: 'milk',
      archived: false,
      product_groups: ['MILK'],
    });

    expect(path.startsWith('/api/v2/products/lookup')).toBe(true);
    expect(path).toContain('size=20');
    expect(path).toContain('q=milk');
    expect(path).toContain('product_groups=MILK');
  });
});
