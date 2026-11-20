import type {
  CodeGeneratorTemplate,
  CounterSpec,
} from '@/entities/code-generator-template';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import type { NamePath } from 'antd/es/form/interface';

/** Form values for code generator template create/edit. */
export interface CodeGeneratorTemplateFormValues {
  id?: number;
  name: string;
  description?: string | null;
  template: string;
  counter_config: CounterSpec[];
  validation_regex?: string | null;
  /** Read-only flag from detail; system rows cannot be saved. */
  is_system?: boolean;
}

/** Field-level validation error for the form. */
export interface CodeGeneratorTemplateFormFieldError {
  /** Ant Design Form field path. */
  name: NamePath<CodeGeneratorTemplateFormValues>;
  message: string;
}

/**
 * Runtime params for `POST …/{id}/preview` (not part of template save payload).
 *
 * `task_id` and `aggregation_level` are required before the API call.
 * Optional fields mirror API query defaults when left empty / zero.
 */
export interface CodeGeneratorTemplatePreviewFormValues {
  task_id?: number | null;
  aggregation_level: number;
  weight?: number;
  package_size?: number;
  aggregate_number?: number;
  factory_number?: string;
  cell?: string;
}

/**
 * Props for {@link CodeGeneratorTemplateFormModal}.
 *
 * Preferred contract for Host / pages:
 * - `mode` + `templateId` (edit loads detail via `codeGeneratorTemplateQueries.useDetailQuery`)
 * - stable `onSubmit` / `submitting` / `onCancel`
 *
 * Legacy callers may omit `mode` and pass `initialValues` + `loading` instead.
 */
export interface CodeGeneratorTemplateFormModalProps {
  open: boolean;
  title?: string;
  /** Preferred create/edit mode (aligned with TemplateFormModal). */
  mode?: 'create' | 'edit';
  /** Template id for `mode='edit'` when the modal loads detail itself. */
  templateId?: number;
  /**
   * Prefill when the parent owns loading (legacy).
   * Also used as create defaults when `mode` is omitted or `'create'`.
   */
  initialValues?: Partial<CodeGeneratorTemplate>;
  /** External loading overlay when the parent fetches detail (legacy). */
  loading?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: CodeGeneratorTemplateFormValues,
    options: ResourceFormSubmitOptions,
  ) => void;
}
