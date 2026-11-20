/** Form values for print template create/edit (persisted fields). */
export interface TemplateFormValues {
  id?: number;
  name: string;
  template: string;
}

/** Empty defaults for create mode. */
export const EMPTY_TEMPLATE_FORM_VALUES: TemplateFormValues = {
  id: undefined,
  name: '',
  template: '',
};
