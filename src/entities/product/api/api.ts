import { apiRequest, apiRequestData, getApiBaseUrl } from '@/shared/api';
import { formatDatePickerValue } from '@/shared/lib/dateStringPicker';
import type { ListQueryParams, PaginatedResponse } from '@/shared/types/listQuery';
import type {
  AggregateFormValues,
  CertificateFormValues,
  LicenceFormValues,
  Product,
  ProductAggregate,
  ProductAggregateCreatePayload,
  ProductAggregateUpdatePayload,
  ProductArticle,
  ProductCertificate,
  ProductContents,
  ProductCreatePayload,
  ProductGroupOption,
  ProductLicence,
  ProductUpdatePayload,
} from '../model/types';

/**
 * Maps form/UI priority (boolean Switch or 0|1) to API integer flag.
 *
 * @param priority - Form priority value.
 */
function toCertificatePriority(priority: number | boolean | undefined): number {
  if (typeof priority === 'boolean') {
    return priority ? 1 : 0;
  }
  if (typeof priority === 'number') {
    return priority;
  }
  return 0;
}

/**
 * Formats a form date (Dayjs or string) to API `YYYY-MM-DD`.
 *
 * @param value - DatePicker / form date value.
 */
function toApiDateString(value: CertificateFormValues['cert_date'] | LicenceFormValues['lic_date']): string {
  const formatted = formatDatePickerValue(value);
  return formatted ?? String(value);
}

/**
 * Builds certificate create/update body without client temp `cert_id`.
 *
 * @param values - Certificate form values.
 */
function toCertificateApiBody(values: CertificateFormValues): {
  cert_type: CertificateFormValues['cert_type'];
  cert_number: string;
  cert_date: string;
  well_number?: string;
  priority: number;
} {
  return {
    cert_type: values.cert_type,
    cert_number: values.cert_number,
    cert_date: toApiDateString(values.cert_date),
    ...(values.well_number !== undefined ? { well_number: values.well_number } : {}),
    priority: toCertificatePriority(values.priority),
  };
}

/**
 * Article create/PATCH body: schema fields only (`code`, `name`, `overrides`).
 * Client temp `id` and server-only fields are omitted.
 *
 * @param values - Article row / form values (may include temp `id`).
 */
function toArticleApiBody(values: ProductArticle): {
  code: string;
  name: string;
  overrides?: ProductArticle['overrides'];
} {
  return {
    code: values.code,
    name: values.name,
    ...(values.overrides !== undefined ? { overrides: values.overrides } : {}),
  };
}

/** List query params specific to products admin list. */
export interface ProductsListParams extends ListQueryParams {
  archived?: boolean | null;
  product_groups?: string[];
}

/**
 * Builds query string for products list, including repeated product_groups params.
 *
 * @param path - Base API path.
 * @param params - List query and product-specific filters.
 */
export function buildProductsListPath(
  path: string,
  params: ProductsListParams,
): string {
  const base = getApiBaseUrl();
  const url = new URL(`${base}${path}`, window.location.origin);

  const scalarEntries: Array<[string, string | number | boolean | undefined | null]> = [
    ['size', params.size],
    ['number', params.number],
    ['q', params.q],
    ['sort_by', params.sort_by],
    ['sort_dir', params.sort_dir],
    ['archived', params.archived],
  ];

  for (const [key, value] of scalarEntries) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  if (params.product_groups) {
    for (const group of params.product_groups) {
      url.searchParams.append('product_groups', group);
    }
  }

  return url.pathname + url.search;
}

/**
 * Fetches paginated products for ServerDataTable.
 *
 * @param params - List query contract params plus archived and product_groups filters.
 */
export async function fetchProductsList(
  params: ProductsListParams,
): Promise<PaginatedResponse<Product>> {
  const path = buildProductsListPath('/api/v2/products/list', params);
  return apiRequestData<PaginatedResponse<Product>>(path);
}

/**
 * Lookup-select fetcher for products (`GET /api/v2/products/lookup`).
 * Default page size is 20 (LOOKUP_LIST_SIZE); used by AsyncLookupSelect / SelectProduct.
 *
 * @param params - List query contract params plus archived and product_groups filters.
 */
export async function fetchProductsLookup(
  params: ProductsListParams,
): Promise<PaginatedResponse<Product>> {
  const path = buildProductsListPath('/api/v2/products/lookup', {
    ...params,
    number: params.number ?? 0,
    size: params.size ?? 20,
  });
  return apiRequestData<PaginatedResponse<Product>>(path);
}

/**
 * Fetches a single product by GTIN.
 *
 * @param gtin - Product GTIN.
 * @param signal - Optional abort signal for TanStack Query cancellation.
 */
export async function fetchProduct(
  gtin: string,
  signal?: AbortSignal,
): Promise<Product> {
  return apiRequestData<Product>(`/api/v2/products/${encodeURIComponent(gtin)}`, {
    signal,
  });
}

/**
 * Fetches a single product by GTIN.
 *
 * @param gtin - Product GTIN.
 * @param signal - Optional abort signal for TanStack Query cancellation.
 */
export async function fetchProductSetContents(
  gtin: string,
  signal?: AbortSignal,
): Promise<ProductContents[]> {
  return apiRequestData<ProductContents[]>(`/api/v2/set_contents/${encodeURIComponent(gtin)}`, {
    signal,
  });
}

/**
 * Creates a new product.
 *
 * @param payload - Product data including gtin.
 */
export async function createProduct(
  payload: ProductCreatePayload,
  idempotencyKey: string,
): Promise<Product> {
  return apiRequestData<Product>('/api/v2/products/', {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Updates an existing product.
 *
 * @param gtin - Product GTIN.
 * @param payload - Partial product fields.
 */
export async function updateProduct(
  gtin: string,
  payload: ProductUpdatePayload,
  idempotencyKey: string,
): Promise<Product> {
  return apiRequestData<Product>(`/api/v2/products/${encodeURIComponent(gtin)}`, {
    method: 'PATCH',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Archives or restores a product (PATCH with `archived` only).
 *
 * @param gtin - Product GTIN.
 * @param archived - Target archive flag.
 */
export async function setProductArchived(gtin: string, archived: boolean): Promise<Product> {
  return apiRequestData<Product>(`/api/v2/products/${encodeURIComponent(gtin)}`, {
    method: 'PATCH',
    body: { archived },
  });
}

/**
 * Fetches supported product groups from /info.
 */
export async function fetchProductGroupOptions(): Promise<ProductGroupOption[]> {
  const info = await apiRequest<{
    supported_product_groups?: ProductGroupOption[];
  }>('/info');
  return info.supported_product_groups ?? [];
}

/**
 * Fetches certificates linked to a product.
 *
 * @param gtin - Product GTIN.
 */
export async function fetchProductCertificates(
  gtin: string,
): Promise<ProductCertificate[]> {
  const data = await apiRequestData<PaginatedResponse<ProductCertificate>>(
    `/api/v2/prod_certs/${encodeURIComponent(gtin)}`,
    { params: { size: 200, number: 0 } },
  );
  return data.response;
}

/**
 * Fetches licences linked to a product.
 *
 * @param gtin - Product GTIN.
 */
export async function fetchProductLicences(gtin: string): Promise<ProductLicence[]> {
  const data = await apiRequestData<PaginatedResponse<ProductLicence>>(
    `/api/v2/prod_lic/${encodeURIComponent(gtin)}`,
    { params: { size: 200, number: 0 } },
  );
  return data.response;
}

/**
 * Fetches aggregates linked to a product.
 *
 * @param gtin - Product GTIN.
 */
export async function fetchProductAggregates(gtin: string): Promise<ProductAggregate[]> {
  const data = await apiRequestData<PaginatedResponse<ProductAggregate>>(
    '/api/v2/product_aggregates/',
    { params: { size: 200, number: 0, filter_gtin: gtin } },
  );
  return data.response ?? [];
}

/**
 * Creates a product aggregate (packaging level).
 *
 * @param gtin - Parent product GTIN.
 * @param values - Aggregate form values.
 */
export async function createProductAggregate(
  gtin: string,
  values: AggregateFormValues,
): Promise<ProductAggregate> {
  const body: ProductAggregateCreatePayload = {
    gtin,
    level: values.level,
    name: values.name,
    short_name: values.short_name,
    size: values.size,
    aggr_gtin: values.aggr_gtin ?? null,
    template_id: values.template_id ?? null,
    plain_template_id: values.plain_template_id ?? null,
    code_generator_template_id: values.code_generator_template_id ?? null,
    rows: values.rows ?? 1,
    width_mm: values.width_mm ?? 0,
    package_weight: 0,
    print_only: values.print_only ?? false,
  };
  return apiRequestData<ProductAggregate>('/api/v2/product_aggregates/', {
    method: 'POST',
    body,
  });
}

/**
 * Updates a product aggregate by id.
 *
 * @param id - Aggregate id.
 * @param values - Partial aggregate fields.
 */
export async function updateProductAggregate(
  id: number,
  values: ProductAggregateUpdatePayload,
): Promise<ProductAggregate> {
  return apiRequestData<ProductAggregate>(
    `/api/v2/product_aggregates/${id}`,
    {
      method: 'PATCH',
      body: values,
    },
  );
}

/**
 * Soft-deletes (archives) product aggregates by id.
 *
 * @param aggregateIds - Aggregate ids to archive.
 */
export async function deleteProductAggregates(aggregateIds: number[]): Promise<void> {
  await apiRequestData('/api/v2/product_aggregates/', {
    method: 'DELETE',
    body: { id_product_aggregates: aggregateIds },
  });
}

/**
 * Creates a certificate for a product.
 *
 * @param gtin - Product GTIN.
 * @param values - Certificate form values.
 */
export async function createProductCertificate(
  gtin: string,
  values: CertificateFormValues,
): Promise<ProductCertificate> {
  return apiRequestData<ProductCertificate>('/api/v2/prod_certs/', {
    method: 'POST',
    body: { gtin, ...toCertificateApiBody(values) },
  });
}

/**
 * Updates a certificate for a product (`UpdateCertificateSchema` requires `gtin`).
 *
 * @param id_certificate - Certificate ID.
 * @param values - Certificate form values.
 * @param gtin - Product GTIN (required by API schema on PATCH).
 */
export async function updateProductCertificate(
  id_certificate: string,
  values: CertificateFormValues,
  gtin: string,
): Promise<ProductCertificate> {
  return apiRequestData<ProductCertificate>(`/api/v2/prod_certs/${id_certificate}`, {
    method: 'PATCH',
    body: { gtin, ...toCertificateApiBody(values) },
  });
}

/**
 * Deletes certificates by id.
 *
 * @param certIds - Certificate ids to delete.
 */
export async function deleteProductCertificates(certIds: number[]): Promise<void> {
  await apiRequestData('/api/v2/prod_certs/', {
    method: 'DELETE',
    body: { id_certificates: certIds },
  });
}

/**
 * Creates a licence for a product.
 *
 * @param gtin - Product GTIN.
 * @param values - Licence form values.
 */
export async function createProductLicence(
  gtin: string,
  values: LicenceFormValues,
): Promise<ProductLicence> {
  return apiRequestData<ProductLicence>('/api/v2/prod_lic/', {
    method: 'POST',
    body: {
      gtin,
      lic_number: values.lic_number,
      lic_date: toApiDateString(values.lic_date),
    },
  });
}

/**
 * Updates a production licence by id (`UpdateProdLicSchema`: `number` / `date`).
 *
 * @param licId - Persisted licence id (`id_prod_lic`).
 * @param values - Licence form values (`lic_number` → `number`, `lic_date` → `date`).
 * @param gtin - Optional GTIN when rebinding the licence to another product.
 */
export async function updateProductLicence(
  licId: number,
  values: LicenceFormValues,
  gtin?: string,
): Promise<ProductLicence> {
  return apiRequestData<ProductLicence>(`/api/v2/prod_lic/${licId}`, {
    method: 'PATCH',
    body: {
      ...(gtin !== undefined ? { gtin } : {}),
      number: values.lic_number,
      date: toApiDateString(values.lic_date),
    },
  });
}

/**
 * Deletes licences by id.
 *
 * @param licIds - Licence ids to delete.
 */
export async function deleteProductLicences(licIds: number[]): Promise<void> {
  await apiRequestData('/api/v2/prod_lic/', {
    method: 'DELETE',
    body: { id_prod_lic: licIds },
  });
}

/**
 * Fetches article variants for a product.
 *
 * @param gtin - Product GTIN.
 */
export async function fetchProductArticles(gtin: string): Promise<ProductArticle[]> {
  /** API returns `ResponseData(data=[...])` — a plain array, not PaginateSchema. */
  const data = await apiRequestData<ProductArticle[]>(
    `/api/v2/products/${encodeURIComponent(gtin)}/articles`,
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Creates a product article variant (`CreateProductArticleSchema` fields only).
 *
 * @param gtin - Product GTIN.
 * @param values - Article values (client temp `id` is not sent).
 */
export async function createProductArticle(
  gtin: string,
  values: ProductArticle,
): Promise<ProductArticle> {
  return apiRequestData<ProductArticle>(
    `/api/v2/products/${encodeURIComponent(gtin)}/articles`,
    {
      method: 'POST',
      body: toArticleApiBody(values),
    },
  );
}

/**
 * Updates a product article by numeric id (body without client temp `id`).
 *
 * @param id - Persisted article id.
 * @param values - Article values.
 */
export async function updateProductArticle(
  id: number,
  values: ProductArticle,
): Promise<ProductArticle> {
  return apiRequestData<ProductArticle>(`/api/v2/product_articles/${id}`, {
    method: 'PATCH',
    body: toArticleApiBody(values),
  });
}

/**
 * Deletes a product article by id.
 *
 * @param articleId - Article id to delete.
 */
export async function deleteProductArticles(articleId: number): Promise<void> {
  await apiRequestData(`/api/v2/product_articles/${articleId}`, {
    method: 'DELETE',
  });
}