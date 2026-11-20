import { Input, Modal } from 'antd';

/** Props for hardware info read-only modal. */
export interface HardwareInfoModalProps {
  open: boolean;
  text: string;
  onClose: () => void;
}

/**
 * Modal with decoded client hardware (`pc_data`) text.
 */
export function HardwareInfoModal({ open, text, onClose }: HardwareInfoModalProps) {
  return (
    <Modal
      title="Информация об оборудовании"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <Input.TextArea value={text} readOnly autoSize={{ minRows: 8, maxRows: 20 }} />
    </Modal>
  );
}
