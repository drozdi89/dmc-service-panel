import { formatDatePickerValue } from '@/shared/lib/dateStringPicker';
import type {
  AggregateFormValues,
  CertificateFormValues,
  CertificateType,
  CommissioningType,
  LicenceFormValues,
  Product,
  ProductAggregate,
  ProductArticle,
  ProductArticleOverrides,
  ProductControllerParam,
  ProductCreatePayload,
  ProductFormSubmitValues,
  ProductFormValues,
  ProductUpdatePayload,
} from './types';

/** Client-only temp id prefixes used by product form tabs (`pa0`, `pcc0`, `pl0`, `pcp0`, `pa_c0`). */
const TEMP_ID_PREFIX_RE = /^(pa_|pcp|pa|pc|pl)/i;

/** Scalar product POST/PATCH body (nested arrays are saved in later steps). */
type ProductScalarPayload = Omit<ProductCreatePayload, 'gtin' | 'controller_params'>;

/** Aggregate row ready for create (no id) or update (numeric id). */
export type AggregatePayloadCandidate = Omit<AggregateFormValues, 'id'> & {
  id?: number;
  gtin?: string;
};

/** Certificate create/update split after filtering `certificates_removed`. */
export interface CertificateSaveCandidates {
  toCreate: CertificatePayloadCandidate[];
  toUpdate: Array<CertificatePayloadCandidate & { cert_id: number }>;
  removedIds: number[];
}

/** Licence create/update split after filtering `licences_removed`. */
export interface LicenceSaveCandidates {
  toCreate: LicencePayloadCandidate[];
  toUpdate: Array<LicencePayloadCandidate & { lic_id: number }>;
  removedIds: number[];
}

/** Article create/update split after filtering `articles_removed`. */
export interface ArticleSaveCandidates {
  toCreate: ArticleCreateCandidate[];
  toUpdate: ArticleUpdateCandidate[];
  removedIds: number[];
}

/** Certificate fields for nested create/update (dates and priority normalized). */
export interface CertificatePayloadCandidate {
  cert_id?: number;
  cert_type: CertificateType;
  cert_number: string;
  cert_date: string;
  well_number?: string | null;
  priority: number;
}

/** Licence fields for nested create/update (`lic_date` as `YYYY-MM-DD`). */
export interface LicencePayloadCandidate {
  lic_id?: number;
  lic_number: string;
  lic_date: string;
}

/** Article POST body (schema create fields only). */
export interface ArticleCreateCandidate {
  code: string;
  name: string;
  overrides?: ProductArticleOverrides;
}

/** Article PATCH candidate; `id` is for the URL, not a temp client key. */
export interface ArticleUpdateCandidate extends ArticleCreateCandidate {
  id: number;
}

/**
 * Coerces a form id to a persisted numeric id, or `undefined` for temp/invalid values.
 *
 * @param value - Form id (number, numeric string, or client temp key).
 */
export function toPersistedNumericId(value: unknown): number | undefined {
  if (typeof value === 'string' && TEMP_ID_PREFIX_RE.test(value)) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

/**
 * Type guard: value is a persisted numeric id (number or numeric-string greater than 0).
 * Client temp prefixes `pa` / `pc` / `pl` / `pcp` / `pa_` are never persisted ids.
 *
 * @param value - Unknown form id.
 */
export function isPersistedNumericId(value: unknown): value is number {
  return toPersistedNumericId(value) !== undefined;
}

/**
 * Numeric ids from a form `*_removed` list (temp keys omitted).
 *
 * @param removed - Form removed-id array (mixed number / temp string).
 */
export function mapRemovedPersistedIds(
  removed: readonly unknown[] | undefined,
): number[] {
  if (!removed?.length) {
    return [];
  }
  const ids: number[] = [];
  for (const value of removed) {
    const id = toPersistedNumericId(value);
    if (id !== undefined) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * True when `id` is listed in `removed` (raw equality or matching numeric id).
 *
 * @param id - Row id from the form.
 * @param removed - Corresponding `*_removed` list.
 */
function isIdInList(id: unknown, removed: readonly unknown[] | undefined): boolean {
  if (id == null || removed == null || removed.length === 0) {
    return false;
  }
  if (removed.includes(id)) {
    return true;
  }
  const numericId = toPersistedNumericId(id);
  if (numericId === undefined) {
    return false;
  }
  return removed.some((item) => toPersistedNumericId(item) === numericId);
}

/**
 * Maps Switch/API priority to 0 | 1.
 *
 * @param value - Boolean switch or numeric flag.
 */
function mapPriorityFlag(value: unknown): number {
  return value === true || Number(value) === 1 ? 1 : 0;
}

/** Default values for a new product form. */
export const DEFAULT_PRODUCT_FORM_VALUES: Partial<ProductFormValues> = {
  pg: 'NaN',
  pg_ez: 'NaN',
  lifetime: 0,
  lifetime_unit: 'DAYS',
  type: 'UNIT',
  vet_control: false,
  is_imported: false,
  contract_commissioning: false,
  owner_inn: null,
  producer_inn: null,
  measure_unit: 'U',
  beer_volume_ml: 0,
  mrp: 0,
  package_weight: 0,
  weight_min_g: null,
  weight_max_g: null,
  autoorder_amount: 0,
  auto_skip_serialization: false,
  auto_send_apply: false,
  auto_send_introduce: false,
  auto_send_aggregate: false,
  auto_export_to_1c: false,
  use_data_export: false,
  crpt_template_idx: 0,
};

/**
 * Infers commissioning UI role from API owner/producer INN.
 *
 * @param product - Product detail from API.
 */
export function resolveCommissioningType(product: Product): CommissioningType {
  const ownerInn = product.owner_inn?.trim() ?? '';
  const producerInn = product.producer_inn?.trim() ?? '';
  if (producerInn && !ownerInn) {
    return 'producer';
  }
  return 'owner';
}

/**
 * Maps product detail to Ant Design form values (API object + nested list slots).
 *
 * @param product - Product from GET /api/v2/products/{gtin}.
 */
export function mapProductToFormValues(product: Product): ProductFormValues {
  const vetControl = product.vet_control ?? false;

  return {
    ...product,
    /**
     * Nested lists (aggregates / certificates / licences / articles) are hydrated
     * from dedicated queries in ProductFormModal. Do not reset them here — a later
     * product refetch would wipe already-loaded packaging rows.
     */
    gtin: product.gtin,
    name: product.name,
    controller_params: product.controller_params ?? [],
    short_name: product.short_name ?? undefined,
    assortment_number: product.assortment_number ?? undefined,
    tnved: product.tnved ?? undefined,
    pg: product.pg ?? undefined,
    pg_ez: product.pg_ez ?? undefined,
    crpt_template_idx: product.crpt_template_idx ?? 0,
    lifetime: product.lifetime ?? 0,
    lifetime_unit: product.lifetime_unit ?? 'DAYS',
    beer_volume_ml: product.beer_volume_ml ?? 0,
    measure_unit: product.measure_unit ?? 'U',
    mrp: product.mrp ?? 0,
    barcode: product.barcode ?? undefined,
    is_imported: product.is_imported ?? false,
    vet_control: vetControl,
    package_weight: product.package_weight ?? 0,
    weight_min_g: product.weight_min_g ?? null,
    weight_max_g: product.weight_max_g ?? null,
    contract_commissioning: product.contract_commissioning ?? false,
    owner_inn: product.owner_inn ?? null,
    producer_inn: product.producer_inn ?? null,
    additional_text: product.additional_text ?? undefined,
    template_id: product.template_id ?? undefined,
    plain_template_id: product.plain_template_id ?? undefined,
    crpt_inn: product.crpt_inn ?? undefined,
    factory_number_id: product.factory_number_id ?? undefined,
    autoorder_amount: product.autoorder_amount ?? 0,
    auto_skip_serialization: product.auto_skip_serialization ?? false,
    auto_send_apply: product.auto_send_apply ?? false,
    auto_send_introduce: product.auto_send_introduce ?? false,
    auto_send_aggregate: product.auto_send_aggregate ?? false,
    auto_export_to_1c: product.auto_export_to_1c ?? false,
    use_data_export: product.use_data_export ?? false,
    type: product.type ?? 'UNIT',
    archived: product.archived ?? false,
  };
}

/**
 * Maps owner_inn / producer_inn for the API (clears both when contract off).
 *
 * @param values - Validated form values.
 */
function mapCommissioningToPayload(values: ProductFormValues): {
  owner_inn: string | null;
  producer_inn: string | null;
} {
  if (!values.contract_commissioning) {
    return { owner_inn: null, producer_inn: null };
  }

  return {
    owner_inn: values.owner_inn?.trim() || null,
    producer_inn: values.producer_inn?.trim() || null,
  };
}

/**
 * Desktop parity: empty barcode → GTIN without leading 0 (`gtin[1:]`).
 *
 * @param values - Form values.
 */
function resolveBarcode(values: ProductFormValues): string | null {
  const barcode = values.barcode?.trim() ?? '';
  if (barcode) {
    return barcode;
  }
  const gtin = values.gtin?.trim() ?? '';
  if (gtin.length === 14 && gtin.startsWith('0')) {
    return gtin.slice(1);
  }
  return null;
}

/**
 * Maps measure unit and weight bounds for API create/update bodies.
 * Non-weight units clear bounds (desktop parity).
 *
 * @param values - Product form values.
 */
function mapWeightBoundsFromFormValues(values: ProductFormValues): {
  measure_unit: NonNullable<ProductFormValues['measure_unit']>;
  weight_min_g: number | null;
  weight_max_g: number | null;
} {
  const measureUnit = values.measure_unit ?? 'U';
  const coerceGrams = (value: number | null | undefined): number | null => {
    if (value == null || value === 0) {
      return null;
    }
    return Math.round(Number(value));
  };

  if (measureUnit !== 'W') {
    return {
      measure_unit: measureUnit,
      weight_min_g: null,
      weight_max_g: null,
    };
  }

  return {
    measure_unit: measureUnit,
    weight_min_g: coerceGrams(values.weight_min_g),
    weight_max_g: coerceGrams(values.weight_max_g),
  };
}

/**
 * Shared field mapping from form values to API create/update body.
 *
 * @param values - Validated product form values.
 */
function mapFormValuesToSharedPayload(
  values: ProductFormValues,
): ProductScalarPayload {
  const commissioning = mapCommissioningToPayload(values);
  const weightBounds = mapWeightBoundsFromFormValues(values);

  return {
    name: values.name,
    lifetime: values.lifetime ?? 0,
    tnved: values.tnved ?? null,
    pg: values.pg ?? null,
    short_name: values.short_name ?? null,
    assortment_number: values.assortment_number ?? null,
    additional_text: values.additional_text ?? null,
    vet_control: values.vet_control ?? false,
    lifetime_unit: values.lifetime_unit ?? 'DAYS',
    owner_inn: commissioning.owner_inn,
    contract_commissioning: values.contract_commissioning ?? false,
    beer_volume_ml: values.beer_volume_ml ?? 0,
    use_data_export: values.use_data_export ?? false,
    template_id: values.template_id ?? null,
    crpt_inn: values.crpt_inn ?? null,
    autoorder_amount: values.autoorder_amount ?? 0,
    crpt_template_idx: values.crpt_template_idx ?? 0,
    archived: values.archived ?? false,
    mrp: values.mrp ?? 0,
    barcode: resolveBarcode(values),
    auto_send_apply: values.auto_send_apply ?? false,
    auto_send_introduce: values.auto_send_introduce ?? false,
    is_imported: values.is_imported ?? false,
    type: values.type ?? 'UNIT',
    auto_skip_serialization: values.auto_skip_serialization ?? false,
    factory_number_id: values.factory_number_id ?? null,
    measure_unit: weightBounds.measure_unit,
    pg_ez: values.pg_ez ?? null,
    producer_inn: commissioning.producer_inn,
    plain_template_id: values.plain_template_id ?? null,
    package_weight: values.package_weight ?? 0,
    auto_send_aggregate: values.auto_send_aggregate ?? false,
    auto_export_to_1c: values.auto_export_to_1c ?? false,
    variable_char_type: values.variable_char_type ?? null,
    variable_char_min: values.variable_char_min ?? null,
    variable_char_max: values.variable_char_max ?? null,
    weight_min_g: weightBounds.weight_min_g,
    weight_max_g: weightBounds.weight_max_g,
    variable_weight: values.variable_weight ?? false,
  };
}

/**
 * Maps form aggregates to create/update candidates.
 * Ids in `aggregates_removed` are dropped; temp ids are omitted (create-shape).
 *
 * @param values - Product form values.
 */
export function mapAggregatesToPayload(
  values: ProductFormSubmitValues,
): AggregatePayloadCandidate[] {
  const removed = values.aggregates_removed as unknown[] | undefined;
  return (values.aggregates ?? [])
    .filter((aggregate) => !isIdInList(aggregate.id, removed))
    .map((aggregate) => mapAggregateRow(aggregate));
}

/**
 * Picks aggregate fields and keeps `id` only when it is a persisted numeric id.
 *
 * @param aggregate - Form aggregate row (`AggregateFormValues` or API row).
 */
function mapAggregateRow(
  aggregate: ProductAggregate | AggregateFormValues,
): AggregatePayloadCandidate {
  const persistedId = toPersistedNumericId(aggregate.id);
  const withGtin = aggregate as ProductAggregate;
  return {
    ...(persistedId !== undefined ? { id: persistedId } : {}),
    ...(withGtin.gtin ? { gtin: withGtin.gtin } : {}),
    level: aggregate.level,
    name: aggregate.name,
    short_name: aggregate.short_name,
    aggr_gtin: aggregate.aggr_gtin ?? null,
    size: aggregate.size,
    rows: aggregate.rows ?? 1,
    width_mm: aggregate.width_mm ?? 0,
    template_id: aggregate.template_id ?? null,
    code_generator_template_id: aggregate.code_generator_template_id ?? null,
    plain_template_id: aggregate.plain_template_id ?? null,
    print_only: aggregate.print_only ?? false,
  };
}

/**
 * Builds PATCH body for controller-param sync.
 * Also re-sends measure_unit / weight bounds so a controller-only PATCH cannot
 * wipe weights via API `exclude_unset` after weight-bounds normalization.
 * Drops ids in `controller_params_removed`, params whose `node_id` is in
 * `aggregates_removed`, and temp ids (create / INSERT without id).
 *
 * @param values - Product form values.
 */
export function mapControllerParamsToPayload(
  values: ProductFormSubmitValues,
): Pick<
  ProductUpdatePayload,
  'controller_params' | 'measure_unit' | 'weight_min_g' | 'weight_max_g'
> {
  const aggregatesRemoved = values.aggregates_removed as unknown[] | undefined;
  const paramsRemoved = values.controller_params_removed as unknown[] | undefined;

  const controller_params = (values.controller_params ?? [])
    .filter((param) => {
      if (isIdInList(param.id, paramsRemoved)) {
        return false;
      }
      if (param.node_id != null && isIdInList(param.node_id, aggregatesRemoved)) {
        return false;
      }
      return true;
    })
    .map((param) => mapControllerParamRow(param));

  const weightBounds = mapWeightBoundsFromFormValues(values);

  return {
    controller_params,
    measure_unit: weightBounds.measure_unit,
    weight_min_g: weightBounds.weight_min_g,
    weight_max_g: weightBounds.weight_max_g,
  };
}

/**
 * Maps one controller param; omits `id` when it is a client temp key.
 *
 * @param param - Form controller param row.
 */
function mapControllerParamRow(param: ProductControllerParam): ProductControllerParam {
  const persistedId = toPersistedNumericId(param.id);
  return {
    node_id: param.node_id ?? null,
    node_name: param.node_name,
    address_type: param.address_type,
    address: param.address,
    value: param.value,
    description: param.description ?? null,
    ...(persistedId !== undefined ? { id: persistedId } : {}),
  };
}

/**
 * Splits certificates into create vs update candidates (`cert_id`).
 *
 * @param values - Product form values.
 */
export function mapCertificatesToPayload(
  values: ProductFormSubmitValues,
): CertificateSaveCandidates {
  const removed = values.certificates_removed as unknown[] | undefined;
  const toCreate: CertificatePayloadCandidate[] = [];
  const toUpdate: Array<CertificatePayloadCandidate & { cert_id: number }> = [];

  for (const certificate of values.certificates ?? []) {
    const formCert = certificate as CertificateFormValues;
    if (isIdInList(formCert.cert_id, removed)) {
      continue;
    }
    const mapped = mapCertificateRow(formCert);
    if (mapped.cert_id !== undefined) {
      toUpdate.push({ ...mapped, cert_id: mapped.cert_id });
    } else {
      toCreate.push({
        cert_type: mapped.cert_type,
        cert_number: mapped.cert_number,
        cert_date: mapped.cert_date,
        well_number: mapped.well_number,
        priority: mapped.priority,
      });
    }
  }

  return {
    toCreate,
    toUpdate,
    removedIds: mapRemovedPersistedIds(removed),
  };
}

/**
 * Normalizes one certificate row (date `YYYY-MM-DD`, priority 0|1).
 *
 * @param certificate - Form certificate values.
 */
function mapCertificateRow(
  certificate: CertificateFormValues,
): CertificatePayloadCandidate {
  const certId = toPersistedNumericId(certificate.cert_id);
  return {
    ...(certId !== undefined ? { cert_id: certId } : {}),
    cert_type: certificate.cert_type,
    cert_number: certificate.cert_number,
    cert_date: formatDatePickerValue(certificate.cert_date) ?? '',
    well_number: certificate.well_number ?? null,
    priority: mapPriorityFlag(certificate.priority),
  };
}

/**
 * Splits licences into create vs update candidates (`lic_id`).
 *
 * @param values - Product form values.
 */
export function mapLicencesToPayload(values: ProductFormSubmitValues): LicenceSaveCandidates {
  const removed = values.licences_removed as unknown[] | undefined;
  const toCreate: LicencePayloadCandidate[] = [];
  const toUpdate: Array<LicencePayloadCandidate & { lic_id: number }> = [];

  for (const licence of values.licences ?? []) {
    const formLic = licence as LicenceFormValues;
    if (isIdInList(formLic.lic_id, removed)) {
      continue;
    }
    const mapped = mapLicenceRow(formLic);
    if (mapped.lic_id !== undefined) {
      toUpdate.push({ ...mapped, lic_id: mapped.lic_id });
    } else {
      toCreate.push({
        lic_number: mapped.lic_number,
        lic_date: mapped.lic_date,
      });
    }
  }

  return {
    toCreate,
    toUpdate,
    removedIds: mapRemovedPersistedIds(removed),
  };
}

/**
 * Normalizes one licence row (`lic_date` as `YYYY-MM-DD`).
 *
 * @param licence - Form licence values.
 */
function mapLicenceRow(licence: LicenceFormValues): LicencePayloadCandidate {
  const licId = toPersistedNumericId(licence.lic_id);
  return {
    ...(licId !== undefined ? { lic_id: licId } : {}),
    lic_number: licence.lic_number,
    lic_date: formatDatePickerValue(licence.lic_date) ?? '',
  };
}

/**
 * Splits articles into create vs update candidates (`id`).
 *
 * @param values - Product form values.
 */
export function mapArticlesToPayload(values: ProductFormSubmitValues): ArticleSaveCandidates {
  const removed = values.articles_removed as unknown[] | undefined;
  const toCreate: ArticleCreateCandidate[] = [];
  const toUpdate: ArticleUpdateCandidate[] = [];

  for (const article of values.articles ?? []) {
    if (isIdInList(article.id, removed)) {
      continue;
    }
    const mapped = mapArticleRow(article);
    if (mapped.id !== undefined) {
      toUpdate.push({
        id: mapped.id,
        code: mapped.code,
        name: mapped.name,
        overrides: mapped.overrides,
      });
    } else {
      toCreate.push({
        code: mapped.code,
        name: mapped.name,
        overrides: mapped.overrides,
      });
    }
  }

  return {
    toCreate,
    toUpdate,
    removedIds: mapRemovedPersistedIds(removed),
  };
}

/**
 * Picks article create/update fields and strips temp `id`.
 *
 * @param article - Form article row.
 */
function mapArticleRow(
  article: ProductArticle,
): ArticleCreateCandidate & { id?: number } {
  const persistedId = toPersistedNumericId(article.id);
  return {
    ...(persistedId !== undefined ? { id: persistedId } : {}),
    code: article.code,
    name: article.name,
    ...(article.overrides !== undefined ? { overrides: article.overrides } : {}),
  };
}

/**
 * Maps form values to POST /api/v2/products/ body.
 *
 * @param values - Validated form values including gtin.
 */
export function mapFormValuesToCreatePayload(
  values: ProductFormValues,
): Omit<ProductCreatePayload, 'controller_params'> {
  return {
    gtin: values.gtin,
    ...mapFormValuesToSharedPayload(values),
  };
}

/**
 * Maps form values to PATCH /api/v2/products/{gtin} body (gtin omitted).
 *
 * @param values - Validated form values.
 * @param _product - Loaded product detail (kept for call-site compatibility).
 */
export function mapFormValuesToUpdatePayload(
  values: ProductFormValues,
  _product?: Product | null,
): Omit<ProductUpdatePayload, 'controller_params'> {
  return mapFormValuesToSharedPayload(values);
}
