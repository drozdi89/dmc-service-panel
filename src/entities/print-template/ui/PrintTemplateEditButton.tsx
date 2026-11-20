import { EditOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import {
  usePrintTemplateFormUiStore,
  type ResourceFormConsumerId,
} from '../model/printTemplateFormUiStore';

export interface PrintTemplateEditButtonProps {
  /** Template id to edit; button stays disabled when missing. */
  templateId?: number | null;
  /**
   * When set, Host writes `lastSaved` for this field after save
   * so a matching picker can substitute the updated id/name.
   */
  consumerId?: ResourceFormConsumerId;
  /**
   * Tooltip / accessible label.
   * @default "Изменить"
   */
  label?: string;
  disabled?: boolean;
  /**
   * Optional click override (tests / legacy local modal).
   * When omitted, dispatches `usePrintTemplateFormUiStore.openEdit(templateId, consumerId)`.
   */
  onClick?: () => void;
}

/**
 * Opens print-template edit via {@link usePrintTemplateFormUiStore}.
 *
 * The form modal is rendered by `TemplateFormModalHost` (`widgets/template`),
 * mounted once in AppProviders — this button does not own modal state.
 */
export function PrintTemplateEditButton({
  templateId,
  consumerId,
  label = 'Изменить',
  disabled,
  onClick,
}: PrintTemplateEditButtonProps) {
  const openEdit = usePrintTemplateFormUiStore((s) => s.openEdit);
  const canEdit =
    templateId !== undefined && templateId !== null && !Number.isNaN(templateId);

  return (
    <Tooltip title={canEdit ? label : undefined}>
      <Button
        icon={<EditOutlined />}
        disabled={disabled || !canEdit}
        aria-label={label}
        onClick={() => {
          if (!canEdit) {
            return;
          }
          if (onClick) {
            onClick();
            return;
          }
          openEdit(templateId, consumerId);
        }}
      />
    </Tooltip>
  );
}
