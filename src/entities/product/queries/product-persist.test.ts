import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product, ProductFormValues } from '../model/types';
import { PersistProductError, persistProductFormValues } from './product-persist';

const {
  createProduct,
  updateProduct,
  createProductAggregate,
  updateProductAggregate,
  deleteProductAggregates,
  createProductCertificate,
  updateProductCertificate,
  deleteProductCertificates,
  createProductLicence,
  updateProductLicence,
  deleteProductLicences,
  createProductArticle,
  updateProductArticle,
  deleteProductArticles,
} = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  createProductAggregate: vi.fn(),
  updateProductAggregate: vi.fn(),
  deleteProductAggregates: vi.fn(),
  createProductCertificate: vi.fn(),
  updateProductCertificate: vi.fn(),
  deleteProductCertificates: vi.fn(),
  createProductLicence: vi.fn(),
  updateProductLicence: vi.fn(),
  deleteProductLicences: vi.fn(),
  createProductArticle: vi.fn(),
  updateProductArticle: vi.fn(),
  deleteProductArticles: vi.fn(),
}));

vi.mock('@/entities/product/api/api', () => ({
  createProduct,
  updateProduct,
  createProductAggregate,
  updateProductAggregate,
  deleteProductAggregates,
  createProductCertificate,
  updateProductCertificate,
  deleteProductCertificates,
  createProductLicence,
  updateProductLicence,
  deleteProductLicences,
  createProductArticle,
  updateProductArticle,
  deleteProductArticles,
}));

const baseProduct = {
  gtin: '04601234567890',
  name: 'Test product',
} as Product;

function buildFormValues(
  overrides: Partial<ProductFormValues> = {},
): ProductFormValues {
  return {
    ...baseProduct,
    aggregates: [],
    aggregates_removed: [],
    certificates: [],
    certificates_removed: [],
    licences: [],
    licences_removed: [],
    controller_params: [],
    controller_params_removed: [],
    articles: [],
    articles_removed: [],
    ...overrides,
  } as ProductFormValues;
}

describe('persistProductFormValues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createProduct.mockResolvedValue({ ...baseProduct });
    updateProduct.mockResolvedValue({ ...baseProduct });
    createProductAggregate.mockResolvedValue({ id: 1 });
    updateProductAggregate.mockResolvedValue({ id: 2 });
    deleteProductAggregates.mockResolvedValue(undefined);
    createProductCertificate.mockResolvedValue({});
    updateProductCertificate.mockResolvedValue({});
    deleteProductCertificates.mockResolvedValue(undefined);
    createProductLicence.mockResolvedValue({});
    updateProductLicence.mockResolvedValue({});
    deleteProductLicences.mockResolvedValue(undefined);
    createProductArticle.mockResolvedValue({});
    updateProductArticle.mockResolvedValue({});
    deleteProductArticles.mockResolvedValue(undefined);
  });

  it('create: POST product → aggregates → controller PATCH → certs → licences → articles', async () => {
    const callOrder: string[] = [];
    createProduct.mockImplementation(async () => {
      callOrder.push('POST product');
      return { ...baseProduct };
    });
    updateProduct.mockImplementation(async () => {
      callOrder.push('PATCH product');
      return { ...baseProduct };
    });

    const values = buildFormValues({
      aggregates_removed: [10, 'pa0'],
      aggregates: [
        {
          id: 'pa1',
          level: 1,
          name: 'Box',
          short_name: 'B',
          size: 12,
          rows: 1,
          width_mm: 0,
          plain_template_id: 3,
          code_generator_template_id: 4,
        },
        {
          id: 5,
          level: 2,
          name: 'Pallet',
          short_name: 'P',
          size: 48,
          rows: 2,
          width_mm: 10,
          plain_template_id: 7,
        },
      ],
      certificates_removed: [3],
      certificates: [
        {
          cert_id: 'pc0',
          cert_type: 'CONFORMITY_CERTIFICATE',
          cert_number: 'C-1',
          cert_date: '2024-01-01',
          priority: 0,
        },
        {
          cert_id: 7,
          cert_type: 'CONFORMITY_DECLARATION',
          cert_number: 'C-2',
          cert_date: '2024-02-01',
          priority: 1,
        },
      ],
      licences_removed: [4],
      licences: [
        { lic_id: 'pl0', lic_number: 'L-new', lic_date: '2024-03-01' },
        { lic_id: 8, lic_number: 'L-old', lic_date: '2024-04-01' },
      ],
      articles_removed: [9],
      articles: [
        { id: 'pa_c0', code: 'A1', name: 'Art new' },
        { id: 11, code: 'A2', name: 'Art old' },
      ],
      controller_params: [
        {
          id: 'pcp0',
          node_id: null,
          node_name: 'n1',
          address_type: 'holding',
          address: 1,
          value: '1',
        },
      ],
    });

    await persistProductFormValues(values);

    expect(callOrder).toEqual(['POST product', 'PATCH product']);
    expect(createProduct.mock.calls[0]?.[0]).not.toHaveProperty('controller_params');
    expect(updateProduct.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ controller_params: expect.any(Array) }),
    );

    expect(deleteProductAggregates).toHaveBeenCalledWith([10]);
    expect(createProductAggregate).toHaveBeenCalledWith(
      baseProduct.gtin,
      expect.objectContaining({
        name: 'Box',
        level: 1,
        plain_template_id: 3,
        code_generator_template_id: 4,
      }),
    );
    expect(updateProductAggregate).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        name: 'Pallet',
        package_weight: 0,
        plain_template_id: 7,
      }),
    );
    expect(updateProductAggregate.mock.calls[0]?.[1]).not.toHaveProperty(
      'code_generator_template_id',
    );

    expect(deleteProductCertificates).toHaveBeenCalledWith([3]);
    expect(createProductCertificate).toHaveBeenCalledWith(
      baseProduct.gtin,
      expect.objectContaining({ cert_number: 'C-1' }),
    );
    expect(updateProductCertificate).toHaveBeenCalledWith(
      '7',
      expect.objectContaining({ cert_number: 'C-2' }),
      baseProduct.gtin,
    );

    expect(deleteProductLicences).toHaveBeenCalledWith([4]);
    expect(createProductLicence).toHaveBeenCalledWith(
      baseProduct.gtin,
      expect.objectContaining({ lic_number: 'L-new' }),
    );
    expect(updateProductLicence).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ lic_number: 'L-old' }),
      baseProduct.gtin,
    );

    expect(deleteProductArticles).toHaveBeenCalledWith(9);
    expect(createProductArticle).toHaveBeenCalledWith(
      baseProduct.gtin,
      expect.objectContaining({ code: 'A1' }),
    );
    expect(updateProductArticle).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ code: 'A2' }),
    );

    // Fail-fast order: product POST → delete aggregates → create/update aggregates →
    // controller PATCH → certs → licences → articles
    const aggregateDeleteOrder = deleteProductAggregates.mock.invocationCallOrder[0]!;
    const aggregateCreateOrder = createProductAggregate.mock.invocationCallOrder[0]!;
    const controllerPatchOrder = updateProduct.mock.invocationCallOrder[0]!;
    const certDeleteOrder = deleteProductCertificates.mock.invocationCallOrder[0]!;
    const licDeleteOrder = deleteProductLicences.mock.invocationCallOrder[0]!;
    const artDeleteOrder = deleteProductArticles.mock.invocationCallOrder[0]!;

    expect(createProduct.mock.invocationCallOrder[0]).toBeLessThan(aggregateDeleteOrder);
    expect(aggregateDeleteOrder).toBeLessThan(aggregateCreateOrder);
    expect(aggregateCreateOrder).toBeLessThan(controllerPatchOrder);
    expect(controllerPatchOrder).toBeLessThan(certDeleteOrder);
    expect(certDeleteOrder).toBeLessThan(licDeleteOrder);
    expect(licDeleteOrder).toBeLessThan(artDeleteOrder);
  });

  it('edit: PATCH product first, then nested steps with editGtin', async () => {
    updateProduct.mockResolvedValue({ ...baseProduct, name: 'Updated' });

    await persistProductFormValues(
      buildFormValues({ name: 'Updated' }),
      baseProduct.gtin,
      baseProduct,
    );

    expect(updateProduct).toHaveBeenCalledTimes(2);
    expect(updateProduct.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ name: 'Updated' }),
    );
    expect(updateProduct.mock.calls[0]?.[1]).not.toHaveProperty('gtin');
  });

  it('stops before nested steps when product mutate fails', async () => {
    createProduct.mockRejectedValueOnce(new Error('product failed'));

    await expect(persistProductFormValues(buildFormValues())).rejects.toThrow('product failed');

    expect(deleteProductAggregates).not.toHaveBeenCalled();
    expect(createProductAggregate).not.toHaveBeenCalled();
    expect(createProduct).toHaveBeenCalledTimes(1);
  });

  it('create: wraps nested failure as PersistProductError with gtin', async () => {
    createProduct.mockResolvedValue({ ...baseProduct });
    deleteProductAggregates.mockRejectedValueOnce(new Error('agg failed'));

    let caught: unknown;
    try {
      await persistProductFormValues(buildFormValues({ aggregates_removed: [1] }));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PersistProductError);
    expect(caught).toMatchObject({
      message: 'agg failed',
      gtin: baseProduct.gtin,
    });
    expect(createProduct).toHaveBeenCalledTimes(1);
    expect(createProductCertificate).not.toHaveBeenCalled();
  });

  it('edit: rethrows nested failure without PersistProductError', async () => {
    updateProduct.mockResolvedValue({ ...baseProduct });
    deleteProductAggregates.mockRejectedValueOnce(new Error('agg failed'));

    let caught: unknown;
    try {
      await persistProductFormValues(
        buildFormValues({ aggregates_removed: [1] }),
        baseProduct.gtin,
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(PersistProductError);
    expect(caught).toMatchObject({ message: 'agg failed' });
  });
});
