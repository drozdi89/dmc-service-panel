import type { PrintTemplate } from '@/entities/print-template';

/** Empty defaults for create mode (API object shape). */
export const EMPTY_TEMPLATE_FORM_VALUES: PrintTemplate = {
  id: 0,
  name: '',
  template: '',
};
