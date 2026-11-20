import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation } from '@/shared/queries';
import {
  createCodeGeneratorTemplate,
  deleteCodeGeneratorTemplates,
  updateCodeGeneratorTemplate,
} from '../api/api';
import type {
  CodeGeneratorTemplate,
  CreateCodeGeneratorTemplatePayload,
  UpdateCodeGeneratorTemplatePayload,
} from '../model/types';

/** Create / update / delete mutations for code generator templates. */
export const codeGeneratorTemplateFactory = factoryMutation<CodeGeneratorTemplate, number>({
  entry: ['code-generator-templates'],
  fetchCreate: (data) =>
    createCodeGeneratorTemplate(
      data as CreateCodeGeneratorTemplatePayload,
      createIdempotencyKey(),
    ),
  fetchUpdate: (id, data) =>
    updateCodeGeneratorTemplate(
      id,
      data as UpdateCodeGeneratorTemplatePayload,
      createIdempotencyKey(),
    ),
  fetchDelete: async (id) => {
    await deleteCodeGeneratorTemplates([id], createIdempotencyKey());
    return null;
  },
});