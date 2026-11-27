import { createIdempotencyKey } from '@/shared/api';
import {
  createProduct,
  createProductAggregate,
  updateProduct,
  createProductArticle,
  createProductCertificate,
  createProductLicence,
  deleteProductAggregates,
  deleteProductArticles,
  deleteProductCertificates,
  deleteProductLicences,
  updateProductAggregate,
  updateProductArticle,
  updateProductCertificate,
  updateProductLicence,
} from '../api/api';
import {
  mapAggregatesToPayload,
  mapArticlesToPayload,
  mapCertificatesToPayload,
  mapControllerParamsToPayload,
  prepareCreate,
  prepareUpdate,
  mapLicencesToPayload,
  mapRemovedPersistedIds,
  type AggregatePayloadCandidate,
  type ArticleCreateCandidate,
  type ArticleUpdateCandidate,
  type CertificatePayloadCandidate,
  type LicencePayloadCandidate,
} from '../model/productFormMapping';
import type {
  AggregateFormValues,
  CertificateFormValues,
  LicenceFormValues,
  Product,
  ProductAggregateUpdatePayload,
  ProductArticle,
  ProductFormSubmitValues,
  ProductFormValues,
} from '../model/types';

/**
 * Thrown when the product form persist pipeline fails after the product row
 * already exists (create step 1 succeeded). Carries `gtin` so the Host can
 * switch the dialog to edit and avoid a duplicate POST / 409 on retry.
 */
export class PersistProductError extends Error {
  /** GTIN of the product created in step 1 (absent if step 1 itself failed). */
  readonly gtin?: string;

  /**
   * @param message - Human-readable failure reason (shown in toast).
   * @param gtin - Persisted GTIN after a successful create step 1.
   */
  constructor(message: string, gtin?: string) {
    super(message);
    this.name = 'PersistProductError';
    this.gtin = gtin;
  }
}

/**
 * Type guard for {@link PersistProductError}.
 *
 * @param error - Unknown catch value.
 */
export function isPersistProductError(error: unknown): error is PersistProductError {
  return error instanceof PersistProductError;
}

/**
 * Maps an aggregate payload candidate to {@link AggregateFormValues} for create.
 *
 * @param aggregate - Candidate without a persisted id.
 */
function toAggregateFormValues(aggregate: AggregatePayloadCandidate): AggregateFormValues {
  return {
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
 * Maps an aggregate payload candidate to PATCH body (no client `id` / parent `gtin`).
 * `code_generator_template_id` is omitted — not in {@link ProductAggregateUpdatePayload}.
 *
 * @param aggregate - Candidate with a persisted numeric id.
 */
function toAggregateUpdatePayload(
  aggregate: AggregatePayloadCandidate,
): ProductAggregateUpdatePayload {
  return {
    level: aggregate.level,
    name: aggregate.name,
    short_name: aggregate.short_name,
    aggr_gtin: aggregate.aggr_gtin ?? null,
    size: aggregate.size,
    rows: aggregate.rows ?? 1,
    width_mm: aggregate.width_mm ?? 0,
    template_id: aggregate.template_id ?? null,
    plain_template_id: aggregate.plain_template_id ?? null,
    /** Schema requires the field; form does not edit package weight on aggregates. */
    package_weight: 0,
    print_only: aggregate.print_only ?? false,
  };
}

/**
 * Maps a certificate payload candidate to {@link CertificateFormValues}.
 *
 * @param certificate - Create or update candidate from the form mapper.
 */
function toCertificateFormValues(
  certificate: CertificatePayloadCandidate,
): CertificateFormValues {
  return {
    ...(certificate.cert_id !== undefined ? { cert_id: certificate.cert_id } : {}),
    cert_type: certificate.cert_type,
    cert_number: certificate.cert_number,
    cert_date: certificate.cert_date,
    ...(certificate.well_number != null ? { well_number: certificate.well_number } : {}),
    priority: certificate.priority,
  };
}

/**
 * Maps a licence payload candidate to {@link LicenceFormValues}.
 *
 * @param licence - Create or update candidate from the form mapper.
 */
function toLicenceFormValues(licence: LicencePayloadCandidate): LicenceFormValues {
  return {
    ...(licence.lic_id !== undefined ? { lic_id: licence.lic_id } : {}),
    lic_number: licence.lic_number,
    lic_date: licence.lic_date,
  };
}

/**
 * Maps an article create/update candidate to {@link ProductArticle} API body shape.
 *
 * @param article - Create or update candidate from the form mapper.
 */
function toArticleValues(
  article: ArticleCreateCandidate | ArticleUpdateCandidate,
): ProductArticle {
  return {
    code: article.code,
    name: article.name,
    ...(article.overrides !== undefined ? { overrides: article.overrides } : {}),
  } as ProductArticle;
}

/**
 * Step 2: delete removed aggregates, then create/update remaining rows.
 *
 * @param gtin - Persisted product GTIN.
 * @param values - Full product form values.
 */
async function persistProductAggregates(
  gtin: string,
  values: ProductFormSubmitValues,
): Promise<void> {
  const removedIds = mapRemovedPersistedIds(values.aggregates_removed as unknown[] | undefined);
  if (removedIds.length > 0) {
    await deleteProductAggregates(removedIds);
  }

  for (const aggregate of mapAggregatesToPayload(values)) {
    if (aggregate.id !== undefined) {
      await updateProductAggregate(aggregate.id, toAggregateUpdatePayload(aggregate));
    } else {
      await createProductAggregate(gtin, toAggregateFormValues(aggregate));
    }
  }
}

/**
 * Step 4a: certificates — delete removed, then create/update.
 *
 * @param gtin - Persisted product GTIN.
 * @param values - Full product form values.
 */
async function persistProductCertificates(
  gtin: string,
  values: ProductFormSubmitValues,
): Promise<void> {
  const { toCreate, toUpdate, removedIds } = mapCertificatesToPayload(values);

  if (removedIds.length > 0) {
    await deleteProductCertificates(removedIds);
  }

  for (const certificate of toCreate) {
    await createProductCertificate(gtin, toCertificateFormValues(certificate));
  }

  for (const certificate of toUpdate) {
    await updateProductCertificate(
      String(certificate.cert_id),
      toCertificateFormValues(certificate),
      gtin,
    );
  }
}

/**
 * Step 4b: licences — delete removed, then create/update.
 *
 * @param gtin - Persisted product GTIN.
 * @param values - Full product form values.
 */
async function persistProductLicences(
  gtin: string,
  values: ProductFormSubmitValues,
): Promise<void> {
  const { toCreate, toUpdate, removedIds } = mapLicencesToPayload(values);

  if (removedIds.length > 0) {
    await deleteProductLicences(removedIds);
  }

  for (const licence of toCreate) {
    await createProductLicence(gtin, toLicenceFormValues(licence));
  }

  for (const licence of toUpdate) {
    await updateProductLicence(licence.lic_id, toLicenceFormValues(licence), gtin);
  }
}

/**
 * Step 4c: articles — delete removed (one-by-one), then create/update.
 *
 * @param gtin - Persisted product GTIN.
 * @param values - Full product form values.
 */
async function persistProductArticles(
  gtin: string,
  values: ProductFormSubmitValues,
): Promise<void> {
  const { toCreate, toUpdate, removedIds } = mapArticlesToPayload(values);

  for (const articleId of removedIds) {
    await deleteProductArticles(articleId);
  }

  for (const article of toCreate) {
    await createProductArticle(gtin, toArticleValues(article));
  }

  for (const article of toUpdate) {
    await updateProductArticle(article.id, toArticleValues(article));
  }
}

/**
 * Full product form persist pipeline (create and edit):
 * 1) scalar product POST/PATCH → 2) aggregates → 3) controller_params PATCH →
 * 4) certificates → licences → articles.
 *
 * Fail-fast: throws on the first failed step (caller shows toast).
 * Nested writes use entity API helpers; product POST/PATCH use {@link createProduct}
 * / {@link updateProduct} with Idempotency-Key.
 *
 * @param values - Validated product form values.
 * @param editGtin - When set, step 1 is PATCH for this GTIN; otherwise POST create.
 * @param cachedProduct - Optional cached detail for update payload compatibility.
 * @returns Product from the last product PATCH (controller params) or create response.
 */
export async function persistProductFormValues(
  values: ProductFormSubmitValues,
  editGtin?: string,
  cachedProduct?: Product | null,
): Promise<Product> {
  let saved: Product;
  let gtin: string;
  const isCreate = !editGtin;

  if (editGtin) {
    saved = await updateProduct(
      editGtin,
      prepareUpdate(values, cachedProduct),
      createIdempotencyKey(),
    );
    gtin = saved.gtin || editGtin;
  } else {
    saved = await createProduct(prepareCreate(values), createIdempotencyKey());
    gtin = saved.gtin;
    if (!gtin) {
      throw new Error('Сервер не вернул GTIN созданной продукции');
    }
  }

  try {
    await persistProductAggregates(gtin, values);

    saved = await updateProduct(
      gtin,
      mapControllerParamsToPayload(values),
      createIdempotencyKey(),
    );

    await persistProductCertificates(gtin, values);
    await persistProductLicences(gtin, values);
    await persistProductArticles(gtin, values);
  } catch (error) {
    if (isCreate) {
      const message =
        error instanceof Error ? error.message : 'Не удалось сохранить продукцию';
      throw new PersistProductError(message, gtin);
    }
    throw error;
  }

  return saved;
}
