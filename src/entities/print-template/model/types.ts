import type { components } from '@/shared/api';

/** Print template row from list/detail API. */
export type PrintTemplate = components['schemas']['GetPrintTemplatesSchema'];

/** Payload for creating a print template. */
export type CreatePrintTemplatePayload =
  components['schemas']['PrintTemplatesSchema'];

/** Payload for updating a print template. */
export type UpdatePrintTemplatePayload =
  components['schemas']['UpdatePrintTemplatesSchema'];

/** Payload for deleting print templates. */
export type DeletePrintTemplatesPayload =
  components['schemas']['DeletePrintTemplatesSchema'];
