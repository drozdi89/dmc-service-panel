import {
  RESOURCE_FORM_SUBMIT_APPLY,
  RESOURCE_FORM_SUBMIT_SAVE,
  type ResourceFormSubmitOptions,
} from '@/shared/model/resourceFormUiBridge';
import { ButtonLoading } from '@/shared/ui/loading';
import type { ReactNode } from 'react';

export type ResourceFormModalFooterProps = {
  /** Disables Cancel / Apply / Save (e.g. detail still loading). */
  submitDisabled?: boolean;
  /** Shows loading on Apply and Save while mutation is in flight. */
  submitting?: boolean;
  onCancel: () => void;
  /**
   * Invoked after validation with save/apply options.
   * Host persists; closes only when `options.close` is true.
   */
  onSubmit: (options: ResourceFormSubmitOptions) => void;
};

/**
 * Standard modal footer: Отмена | Применить | Сохранить.
 *
 * «Применить» persists without closing; «Сохранить» persists and closes.
 * Returns an array suitable for Ant Design `Modal` `footer`.
 *
 * @param props - Footer handlers and disabled/loading state.
 */
export function resourceFormModalFooter({
  submitDisabled = false,
  submitting = false,
  onCancel,
  onSubmit,
}: ResourceFormModalFooterProps): ReactNode[] {
  return [
    <ButtonLoading key="cancel" onClick={onCancel} disabled={submitting}>
      Отмена
    </ButtonLoading>,
    <ButtonLoading
      key="apply"
      loading={submitting}
      disabled={submitDisabled}
      onClick={() => {
        onSubmit(RESOURCE_FORM_SUBMIT_APPLY);
      }}
    >
      Применить
    </ButtonLoading>,
    <ButtonLoading
      key="save"
      type="primary"
      loading={submitting}
      disabled={submitDisabled}
      onClick={() => {
        onSubmit(RESOURCE_FORM_SUBMIT_SAVE);
      }}
    >
      Сохранить
    </ButtonLoading>,
  ];
}
