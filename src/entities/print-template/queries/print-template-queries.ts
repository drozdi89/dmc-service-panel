import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation, factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  createPrintTemplate,
  deletePrintTemplates,
  fetchPrintTemplateById,
  fetchPrintTemplates,
  fetchPrintTemplatesLookup,
  updatePrintTemplate,
} from '../api/api';
import type {
  CreatePrintTemplatePayload,
  PrintTemplate,
  UpdatePrintTemplatePayload,
} from '../model/types';

/** Shared TanStack Query root for list / lookup / detail and CRUD mutations. */
export const PRINT_TEMPLATE_QUERY_ENTRY = ['print-templates'] as const;

const queryApi = factoryQuery<PrintTemplate, ListQueryParams, number>({
  entry: PRINT_TEMPLATE_QUERY_ENTRY,
  fetchList: fetchPrintTemplates,
  fetchLookup: fetchPrintTemplatesLookup,
  fetchDetail: fetchPrintTemplateById,
});

const mutationApi = factoryMutation<PrintTemplate, number>({
  entry: PRINT_TEMPLATE_QUERY_ENTRY,
  fetchCreate: (data) =>
    createPrintTemplate(data as CreatePrintTemplatePayload, createIdempotencyKey()),
  fetchUpdate: (id, data) =>
    updatePrintTemplate(id, data as UpdatePrintTemplatePayload, createIdempotencyKey()),
  fetchDelete: async (id) => {
    await deletePrintTemplates([id], createIdempotencyKey());
    return null;
  },
});

/**
 * Canonical TanStack Query API for print templates (read + create / update / delete).
 *
 * Keys (entry {@link PRINT_TEMPLATE_QUERY_ENTRY}):
 * - list: `['print-templates', 'list', params?]`
 * - lookup: `['print-templates', 'lookup', params?]`
 * - detail: `['print-templates', 'detail', id]`
 *
 * Invalidate after save/delete via `printTemplateQueries.keys.all()`.
 * Pass `printTemplateQueries.keys.all()` as `queryKey` to AsyncLookupSelect
 * (factory appends `'lookup'` + params).
 *
 * CRUD hooks: `useCreateMutation`, `useUpdateMutation`, `useDeleteMutation`
 * (toasts/confirm — in `entities/print-template/hooks`).
 */
export const printTemplateQueries = {
  ...queryApi,
  ...mutationApi,
};