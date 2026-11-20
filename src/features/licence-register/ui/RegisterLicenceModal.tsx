import type { MactLicenceInfo } from '@/entities/licence';
import { formatDate } from '@/entities/licence';
import { Modal, Select, Space, Typography } from 'antd';

const { Text } = Typography;

/** Props for client licence registration modal. */
export interface RegisterLicenceModalProps {
  open: boolean;
  clientId: string | null;
  availableLicences: MactLicenceInfo[];
  selectedLicencePin: string | null;
  confirmLoading: boolean;
  onSelectedLicencePinChange: (pin: string) => void;
  onCancel: () => void;
  onRegister: () => void;
}

/**
 * Modal to bind an available MACT licence pin to a DMC client.
 */
export function RegisterLicenceModal({
  open,
  clientId,
  availableLicences,
  selectedLicencePin,
  confirmLoading,
  onSelectedLicencePinChange,
  onCancel,
  onRegister,
}: RegisterLicenceModalProps) {
  return (
    <Modal
      title="Привязать лицензию"
      open={open}
      onCancel={onCancel}
      onOk={onRegister}
      okText="Привязать"
      cancelText="Отмена"
      confirmLoading={confirmLoading}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text>Клиент: {clientId}</Text>
        <Select<string>
          style={{ width: '100%' }}
          placeholder="Выберите лицензию"
          value={selectedLicencePin}
          onChange={onSelectedLicencePinChange}
          options={availableLicences.map((lic) => ({
            value: lic.pin,
            label: `${lic.lic_type} до ${formatDate(lic.valid_until)} (${lic.valid_days} дн.)`,
          }))}
        />
      </Space>
    </Modal>
  );
}
