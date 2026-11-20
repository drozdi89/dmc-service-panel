import type { components } from '@/shared/api/types';
import type { Dayjs } from 'dayjs';

/** Product row from GET /api/v2/products/list. */
export type Product = components['schemas']['GetProductsSchema'];

/** PATCH body for product updates. */
export type ProductUpdatePayload = components['schemas']['UpdateProductsSchema'];

/** POST body for new products (gtin required). */
export type ProductCreatePayload = components['schemas']['GetProductsSchema'];

/** Product certificate row (list/detail includes cert_id). */
export type ProductCertificate = components['schemas']['CertificateSchema'] & {
  cert_id?: number;
};

/** Product licence row (list/detail includes lic_id). */
export type ProductLicence = components['schemas']['ProdLicSchema'] & {
  lic_id?: number;
};

/** Product aggregate row from list/detail. */
export type ProductAggregate = components['schemas']['ProductAggregatesSchema'] & {
  id?: number;
  archived?: boolean;
};
export type ProductContents = components['schemas']['ProductContentsSchema'];
export type ProductControllerParam = components['schemas']['ProductControllerParamSchema'];
export type ProductArticle = components['schemas']['ProductArticleSchema'];
export type ProductArticleOverrides = components['schemas']['ProductArticleOverridesSchema'];

/** POST body for creating a product aggregate. */
export type ProductAggregateCreatePayload =
  components['schemas']['ProductAggregatesSchema'];

/** PATCH body for updating a product aggregate. */
export type ProductAggregateUpdatePayload =
  components['schemas']['UpdateProductAggregatesSchema'];

/** DELETE body for soft-archiving product aggregates. */
export type ProductAggregateDeletePayload =
  components['schemas']['DeleteProductAggregatesSchema'];

/** Supported product group from GET /info. */
export interface ProductGroupOption {
  id: number;
  name: string;
  description: string;
}

/** Certificate type enum values. */
export type CertificateType = ProductCertificate['cert_type'];

/** Contract commissioning INN role in the product form. */
export type CommissioningType = 'owner' | 'producer';

/**
 * Main product form values (create/edit).
 * UI convenience fields (`commissioning_*`, `vet_raw_control`) are mapped in
 * `productFormMapping` — they are not sent to the API as-is.
 */
export interface ProductFormValues extends Product {
  /** Form-only alias for bio VET label; stored as `vet_control`. */
  vet_raw_control?: boolean;
  commissioning_type?: CommissioningType;
  commissioning_inn?: string | null;
  additional_text?: string | null;
  aggregates?: ProductAggregate[];
  aggregates_removed?: ProductAggregate['id'][];
  certificates?: ProductCertificate[];
  certificates_removed?: ProductCertificate['cert_id'][];
  licences?: ProductLicence[];
  licences_removed?: ProductLicence['lic_id'][];
  controller_params?: ProductControllerParam[];
  controller_params_removed?: ProductControllerParam['id'][];
  articles?: ProductArticle[];
  articles_removed?: ProductArticle['id'][];
}

/** Nested aggregate create form values (gtin supplied by Host/section). */
export interface AggregateFormValues {
  id?: number | string;
  level: number;
  name: string;
  short_name: string;
  aggr_gtin?: string | null;
  size: number;
  rows: number;
  width_mm: number;
  template_id?: number | null;
  code_generator_template_id?: number | null;
  print_only?: boolean;
  plain_template_id?: number | null;
}

/** Certificate form values. */
export interface CertificateFormValues {
  cert_id?: number | string | null;
  cert_type: CertificateType;
  cert_number: string;
  /** API string or Dayjs in DatePicker; normalize keeps `YYYY-MM-DD`. */
  cert_date: Dayjs | string;
  well_number?: string;
  /** Switch may store boolean; mapped to 0/1 on save. */
  priority?: number | boolean;
}

/** Licence form values. */
export interface LicenceFormValues {
  lic_id?: number | string | null;
  lic_number: string;
  /** DatePicker Dayjs in UI; formatted to `YYYY-MM-DD` on submit. */
  lic_date: Dayjs | string;
}
