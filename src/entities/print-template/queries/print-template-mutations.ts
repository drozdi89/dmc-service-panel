import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation } from '@/shared/queries';
import {
  createPrintTemplate,
  deletePrintTemplates,
  updatePrintTemplate,
} from '../api/api';
import type {
  CreatePrintTemplatePayload,
  PrintTemplate,
  UpdatePrintTemplatePayload,
} from '../model/types';

/** Create / update / delete mutations for print templates. */
export const printTemplateFactory = factoryMutation<PrintTemplate, number>({
  entry: ['print-templates'],
  fetchCreate: (data) =>
    createPrintTemplate(data as CreatePrintTemplatePayload, createIdempotencyKey()),
  fetchUpdate: (id, data) =>
    updatePrintTemplate(id, data as UpdatePrintTemplatePayload, createIdempotencyKey()),
  fetchDelete: async (id) => {
    await deletePrintTemplates([id], createIdempotencyKey());
    return null;
  },
});