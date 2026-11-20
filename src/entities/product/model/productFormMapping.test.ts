import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  DEFAULT_PRODUCT_FORM_VALUES,
  isPersistedNumericId,
  mapAggregatesToPayload,
  mapArticlesToPayload,
  mapCertificatesToPayload,
  mapControllerParamsToPayload,
  mapFormValuesToCreatePayload,
  mapFormValuesToUpdatePayload,
  mapLicencesToPayload,
  mapProductToFormValues,
  mapRemovedPersistedIds,
  toPersistedNumericId,
} from './productFormMapping';
import type {
  Product,
  ProductAggregate,
  ProductArticle,
  ProductCertificate,
  ProductControllerParam,
  ProductFormSubmitValues,
  ProductFormValues,
  ProductLicence,
} from './types';
import { EMPTY_PRODUCT_FORM_REMOVED_IDS } from './types';

function minimalProduct(overrides: Partial<Product> = {}): Product {
  return {
    gtin: '04601234567890',
    name: 'Milk',
    lifetime: 30,
    lifetime_unit: 'DAYS',
    vet_control: true,
    contract_commissioning: false,
    beer_volume_ml: 0,
    use_data_export: false,
    autoorder_amount: 10,
    crpt_template_idx: 0,
    archived: false,
    mrp: 0,
    is_imported: false,
    auto_send_apply: false,
    auto_send_introduce: false,
    auto_send_aggregate: true,
    auto_export_to_1c: false,
    auto_skip_serialization: false,
    type: 'UNIT',
    measure_unit: 'U',
    package_weight: 0,
    ...overrides,
  };
}

describe('mapProductToFormValues', () => {
  it('maps API fields including vet_control', () => {
    const values = mapProductToFormValues(minimalProduct());
    expect(values.gtin).toBe('04601234567890');
    expect(values.auto_send_aggregate).toBe(true);
    expect(values.vet_control).toBe(true);
    expect(values.owner_inn ?? null).toBeNull();
    expect(values.producer_inn ?? null).toBeNull();
  });

  it('maps package_weight, weight bounds and auto_export_to_1c', () => {
    const values = mapProductToFormValues(
      minimalProduct({
        package_weight: 120,
        weight_min_g: 900,
        weight_max_g: 1100,
        auto_export_to_1c: true,
        measure_unit: 'W',
      }),
    );
    expect(values.package_weight).toBe(120);
    expect(values.weight_min_g).toBe(900);
    expect(values.weight_max_g).toBe(1100);
    expect(values.auto_export_to_1c).toBe(true);
  });

  it('keeps owner_inn and producer_inn from API', () => {
    const values = mapProductToFormValues(
      minimalProduct({
        contract_commissioning: true,
        owner_inn: '7707083893',
        producer_inn: '1234567890',
      }),
    );
    expect(values.owner_inn).toBe('7707083893');
    expect(values.producer_inn).toBe('1234567890');
  });

  it('keeps producer_inn when owner is empty', () => {
    const values = mapProductToFormValues(
      minimalProduct({
        contract_commissioning: true,
        owner_inn: '',
        producer_inn: '1234567890',
      }),
    );
    expect(values.owner_inn).toBe('');
    expect(values.producer_inn).toBe('1234567890');
  });
});

describe('mapFormValuesToCreatePayload / Update', () => {
  const baseForm: ProductFormValues = {
    ...DEFAULT_PRODUCT_FORM_VALUES,
    gtin: '04601234567890',
    name: 'Milk',
    assortment_number: '100',
    pg: 'milk',
    auto_send_aggregate: true,
  } as ProductFormValues;

  it('includes gtin on create and maps auto_send_aggregate', () => {
    const payload = mapFormValuesToCreatePayload(baseForm);
    expect(payload.gtin).toBe('04601234567890');
    expect(payload.name).toBe('Milk');
    expect(payload.auto_send_aggregate).toBe(true);
    expect(payload.auto_export_to_1c).toBe(false);
    expect(payload.package_weight).toBe(0);
    expect(payload).not.toHaveProperty('aggregates');
    expect(payload).not.toHaveProperty('aggregates_removed');
  });

  it('saves package_weight and auto_export_to_1c from form on update', () => {
    const payload = mapFormValuesToUpdatePayload({
      ...baseForm,
      package_weight: 250,
      auto_export_to_1c: true,
    });
    expect(payload).not.toHaveProperty('gtin');
    expect(payload.auto_export_to_1c).toBe(true);
    expect(payload.package_weight).toBe(250);
  });

  it('autofills barcode from gtin when barcode is empty', () => {
    const payload = mapFormValuesToCreatePayload({
      ...baseForm,
      barcode: '',
    });
    expect(payload.barcode).toBe('4601234567890');
  });

  it('maps weight bounds for measure_unit W and clears them otherwise', () => {
    const withWeight = mapFormValuesToCreatePayload({
      ...baseForm,
      measure_unit: 'W',
      weight_min_g: 900,
      weight_max_g: 1100,
    });
    expect(withWeight.measure_unit).toBe('W');
    expect(withWeight.weight_min_g).toBe(900);
    expect(withWeight.weight_max_g).toBe(1100);

    const withoutWeight = mapFormValuesToCreatePayload({
      ...baseForm,
      measure_unit: 'U',
      weight_min_g: 900,
      weight_max_g: 1100,
    });
    expect(withoutWeight.weight_min_g).toBeNull();
    expect(withoutWeight.weight_max_g).toBeNull();
  });

  it('coerces zero weight bounds to null', () => {
    const payload = mapFormValuesToCreatePayload({
      ...baseForm,
      measure_unit: 'W',
      weight_min_g: 0,
      weight_max_g: 0,
    });
    expect(payload.weight_min_g).toBeNull();
    expect(payload.weight_max_g).toBeNull();
  });

  it('maps owner commissioning inn', () => {
    const payload = mapFormValuesToCreatePayload({
      ...baseForm,
      contract_commissioning: true,
      owner_inn: '7707083893',
      producer_inn: null,
    });
    expect(payload.contract_commissioning).toBe(true);
    expect(payload.owner_inn).toBe('7707083893');
    expect(payload.producer_inn).toBeNull();
  });

  it('maps producer commissioning inn', () => {
    const payload = mapFormValuesToCreatePayload({
      ...baseForm,
      contract_commissioning: true,
      owner_inn: null,
      producer_inn: '1234567890',
    });
    expect(payload.owner_inn).toBeNull();
    expect(payload.producer_inn).toBe('1234567890');
  });

  it('clears inns when contract commissioning is off', () => {
    const payload = mapFormValuesToCreatePayload({
      ...baseForm,
      contract_commissioning: false,
      owner_inn: '7707083893',
      producer_inn: null,
    });
    expect(payload.owner_inn).toBeNull();
    expect(payload.producer_inn).toBeNull();
  });

  it('keeps create/update payloads scalar (no nested arrays)', () => {
    const nestedForm: ProductFormValues = {
      ...baseForm,
      aggregates: [{ id: 1, gtin: baseForm.gtin, level: 1, name: 'Box', short_name: 'B', size: 10, rows: 1, width_mm: 0, package_weight: 0 }],
      certificates: [],
      licences: [],
      articles: [],
      controller_params: [],
    };
    const createPayload = mapFormValuesToCreatePayload(nestedForm);
    const updatePayload = mapFormValuesToUpdatePayload(nestedForm);

    for (const payload of [createPayload, updatePayload]) {
      expect(payload).not.toHaveProperty('aggregates');
      expect(payload).not.toHaveProperty('aggregates_removed');
      expect(payload).not.toHaveProperty('certificates');
      expect(payload).not.toHaveProperty('certificates_removed');
      expect(payload).not.toHaveProperty('licences');
      expect(payload).not.toHaveProperty('licences_removed');
      expect(payload).not.toHaveProperty('articles');
      expect(payload).not.toHaveProperty('articles_removed');
      expect(payload).not.toHaveProperty('controller_params');
      expect(payload).not.toHaveProperty('controller_params_removed');
    }
  });
});

describe('isPersistedNumericId / toPersistedNumericId', () => {
  it.each([
    [1, true, 1],
    [42, true, 42],
    ['7', true, 7],
    [' 12 ', true, 12],
    [0, false, undefined],
    [-3, false, undefined],
    [1.5, false, undefined],
    ['0', false, undefined],
    ['', false, undefined],
    ['abc', false, undefined],
    [null, false, undefined],
    [undefined, false, undefined],
    ['pa0', false, undefined],
    ['pc1', false, undefined],
    ['pcc0', false, undefined],
    ['pl0', false, undefined],
    ['pcp0', false, undefined],
    ['pa_c0', false, undefined],
  ] as const)('value %j → persisted %s', (value, persisted, numeric) => {
    expect(isPersistedNumericId(value)).toBe(persisted);
    expect(toPersistedNumericId(value)).toBe(numeric);
  });
});

describe('mapRemovedPersistedIds', () => {
  it('keeps numeric ids and drops temp keys', () => {
    expect(mapRemovedPersistedIds([1, 'pa0', '8', 'pcp1', 0])).toEqual([1, 8]);
  });
});

describe('mapAggregatesToPayload', () => {
  const box: ProductAggregate = {
    id: 10,
    gtin: '04601234567890',
    level: 1,
    name: 'Box',
    short_name: 'B',
    size: 12,
    rows: 1,
    width_mm: 0,
    package_weight: 0,
  };

  it('excludes removed ids and strips temp id from create-shape', () => {
    const mapped = mapAggregatesToPayload({
      ...baseForm(),
      aggregates: [
        box,
        { ...box, id: 'pa0' as unknown as number, name: 'New pack' },
        { ...box, id: 11, name: 'Removed' },
      ],
      aggregates_removed: [11],
    });

    expect(mapped).toHaveLength(2);
    expect(mapped[0]).toMatchObject({ id: 10, name: 'Box', level: 1 });
    expect(mapped[1]).toMatchObject({ name: 'New pack' });
    expect(mapped[1]).not.toHaveProperty('id');
  });
});

describe('mapControllerParamsToPayload', () => {
  const serialization: ProductControllerParam = {
    id: 21,
    node_id: null,
    node_name: 'Сериализация',
    address_type: 'register',
    address: 1,
    value: 10,
  };
  const onPack: ProductControllerParam = {
    id: 22,
    node_id: 10,
    node_name: 'Box',
    address_type: 'coil',
    address: 2,
    value: 1,
  };

  it('returns controller_params plus weight bounds; drops removed/temp ids', () => {
    const payload = mapControllerParamsToPayload({
      ...baseForm(),
      measure_unit: 'W',
      weight_min_g: 900,
      weight_max_g: 1100,
      aggregates_removed: [99],
      controller_params_removed: [21, 'pcp0' as unknown as number],
      controller_params: [
        serialization,
        onPack,
        {
          ...onPack,
          id: 'pcp0' as unknown as number,
          node_id: null,
          node_name: 'Сериализация',
          address: 9,
        },
        { ...onPack, id: 23, node_id: 99, node_name: 'Gone' },
      ],
    });

    expect(payload).toEqual({
      controller_params: [
        expect.objectContaining({ id: 22, node_id: 10, address: 2 }),
      ],
      measure_unit: 'W',
      weight_min_g: 900,
      weight_max_g: 1100,
    });
    expect(payload.controller_params?.[0]).not.toHaveProperty('id', 'pcp0');
  });

  it('clears weight bounds on controller PATCH when measure_unit is not W', () => {
    const payload = mapControllerParamsToPayload({
      ...baseForm(),
      measure_unit: 'U',
      weight_min_g: 900,
      weight_max_g: 1100,
      controller_params: [],
    });
    expect(payload.weight_min_g).toBeNull();
    expect(payload.weight_max_g).toBeNull();
    expect(payload.measure_unit).toBe('U');
  });

  it('does not invert the node_id filter (keeps params whose aggregate is not removed)', () => {
    const payload = mapControllerParamsToPayload({
      ...baseForm(),
      aggregates_removed: [5],
      controller_params: [onPack],
    });
    expect(payload.controller_params).toHaveLength(1);
    expect(payload.controller_params?.[0]?.node_id).toBe(10);
  });

  it('omits id for temp keys and coerces numeric-string ids', () => {
    const payload = mapControllerParamsToPayload({
      ...baseForm(),
      controller_params: [
        { ...serialization, id: 'pcp3' as unknown as number },
        { ...onPack, id: '24' as unknown as number },
      ],
    });
    expect(payload.controller_params?.[0]).not.toHaveProperty('id');
    expect(payload.controller_params?.[1]?.id).toBe(24);
  });
});

describe('mapCertificatesToPayload', () => {
  it('splits create/update, filters removed, normalizes date and priority', () => {
    const existing: ProductCertificate = {
      gtin: '04601234567890',
      cert_id: 3,
      cert_type: 'CONFORMITY_CERTIFICATE',
      cert_number: 'C-1',
      cert_date: '2024-01-15',
      priority: 0,
    };
    const mapped = mapCertificatesToPayload({
      ...baseForm(),
      certificates: [
        existing,
        {
          ...existing,
          cert_id: 'pcc0' as unknown as number,
          cert_number: 'C-new',
          cert_date: dayjs('2026-03-04') as unknown as string,
          priority: true as unknown as number,
        },
        { ...existing, cert_id: 4, cert_number: 'C-del' },
      ],
      certificates_removed: [4, 'pcc9' as unknown as number],
    });

    expect(mapped.removedIds).toEqual([4]);
    expect(mapped.toUpdate).toEqual([
      expect.objectContaining({
        cert_id: 3,
        cert_number: 'C-1',
        cert_date: '2024-01-15',
        priority: 0,
      }),
    ]);
    expect(mapped.toCreate).toEqual([
      expect.objectContaining({
        cert_number: 'C-new',
        cert_date: '2026-03-04',
        priority: 1,
      }),
    ]);
    expect(mapped.toCreate[0]).not.toHaveProperty('cert_id');
  });
});

describe('mapLicencesToPayload', () => {
  it('splits create/update by lic_id and strips temp keys', () => {
    const existing: ProductLicence = {
      gtin: '04601234567890',
      lic_id: 8,
      lic_number: 'L-1',
      lic_date: '2025-02-01',
    };
    const mapped = mapLicencesToPayload({
      ...baseForm(),
      licences: [
        existing,
        {
          ...existing,
          lic_id: 'pl0' as unknown as number,
          lic_number: 'L-new',
          lic_date: dayjs('2026-08-17') as unknown as string,
        },
        { ...existing, lic_id: 9, lic_number: 'L-del' },
      ],
      licences_removed: [9],
    });

    expect(mapped.removedIds).toEqual([9]);
    expect(mapped.toUpdate).toEqual([
      expect.objectContaining({ lic_id: 8, lic_number: 'L-1', lic_date: '2025-02-01' }),
    ]);
    expect(mapped.toCreate).toEqual([
      expect.objectContaining({ lic_number: 'L-new', lic_date: '2026-08-17' }),
    ]);
    expect(mapped.toCreate[0]).not.toHaveProperty('lic_id');
  });
});

describe('mapArticlesToPayload', () => {
  it('splits create/update by id and does not send temp id or UI-only fields', () => {
    const existing: ProductArticle = {
      id: 15,
      gtin: '04601234567890',
      code: 'A1',
      name: 'Art 1',
      overrides: { mrp: 10 },
    };
    const mapped = mapArticlesToPayload({
      ...baseForm(),
      articles: [
        existing,
        {
          ...existing,
          id: 'pa_c0' as unknown as number,
          code: 'A-new',
          name: 'New art',
          created_at: '2026-01-01',
          disabled: { mrp: true },
        },
        { ...existing, id: 16, code: 'A-del' },
      ],
      articles_removed: [16],
    });

    expect(mapped.removedIds).toEqual([16]);
    expect(mapped.toUpdate).toEqual([
      { id: 15, code: 'A1', name: 'Art 1', overrides: { mrp: 10 } },
    ]);
    expect(mapped.toCreate).toEqual([
      { code: 'A-new', name: 'New art', overrides: { mrp: 10 } },
    ]);
    expect(mapped.toCreate[0]).not.toHaveProperty('id');
    expect(mapped.toCreate[0]).not.toHaveProperty('disabled');
    expect(mapped.toCreate[0]).not.toHaveProperty('created_at');
  });
});

function baseForm(): ProductFormSubmitValues {
  return {
    ...DEFAULT_PRODUCT_FORM_VALUES,
    ...EMPTY_PRODUCT_FORM_REMOVED_IDS,
    gtin: '04601234567890',
    name: 'Milk',
    assortment_number: '100',
    pg: 'milk',
    auto_send_aggregate: true,
  } as ProductFormSubmitValues;
}
