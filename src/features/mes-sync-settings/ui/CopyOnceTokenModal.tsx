import { Button, Input, Modal, Space, Typography } from 'antd';

/** Props for one-time Service token dialog (create/rotate). */
export interface CopyOnceTokenModalProps {
  open: boolean;
  token: string | null;
  title?: string;
  onCopy: (token: string) => void;
  onClose: () => void;
}

/**
 * Shows plaintext Service token once after create/rotate.
 * Desktop parity: CopyOnceTokenDialog in mes_sync_settings.py.
 */
export function CopyOnceTokenModal({
  open,
  token,
  title = 'Service token',
  onCopy,
  onClose,
}: CopyOnceTokenModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      forceRender
      footer={
        <Space>
          <Button
            type="primary"
            disabled={!token}
            onClick={() => {
              if (token) {
                onCopy(token);
              }
            }}
          >
            Копировать
          </Button>
          <Button onClick={onClose}>Закрыть</Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
        Скопируйте токен сейчас — он больше не будет показан. Вставьте его в DataManager → «Обмен
        MES» как Service token.
      </Typography.Paragraph>
      <Input.TextArea value={token ?? ''} readOnly autoSize={{ minRows: 3, maxRows: 6 }} />
    </Modal>
  );
}
