import { PlusOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import {
  usePrintTemplateFormUiStore,
  type ResourceFormConsumerId,
} from '../model/printTemplateFormUiStore';

export interface PrintTemplateCreateButtonProps {
  /**
   * When set, `TemplateFormModalHost` writes `lastSaved` for this field after save
   * so a matching picker can substitute the new id/name.
   * Omit for orphan create (no field substitution).
   */
  consumerId?: ResourceFormConsumerId;
  /**
   * Tooltip / accessible label.
   * @default "Добавить"
   */
  label?: string;
  disabled?: boolean;
  /**
   * Optional click override (tests / legacy local modal).
   * When omitted, dispatches `usePrintTemplateFormUiStore.openCreate(consumerId)`.
   */
  onClick?: () => void;
}

/**
 * Opens print-template create via {@link usePrintTemplateFormUiStore}.
 *
 * The form modal is rendered by `TemplateFormModalHost` (`widgets/template`),
 * mounted once in AppProviders — this button does not own modal state.
 */
export function PrintTemplateCreateButton({
  consumerId,
  label = 'Добавить',
  disabled,
  onClick,
}: PrintTemplateCreateButtonProps) {
  const openCreate = usePrintTemplateFormUiStore((s) => s.openCreate);

  return (
    <Tooltip title={label}>
      <Button
        icon={<PlusOutlined />}
        disabled={disabled}
        aria-label={label}
        onClick={() => {
          if (onClick) {
            onClick();
            return;
          }
          openCreate(consumerId);
        }}
      />
    </Tooltip>
  );
}
