import type { CreateMesSyncBindingPayload } from '@/entities/mes-sync';
import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { LineIdsChecklist } from './LineIdsChecklist';

/** Props for create MES Sync binding modal. */
export interface CreateBindingModalProps {
  open: boolean;
  confirming: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateMesSyncBindingPayload) => void;
}

/**
 * Create binding: label, edge node_id, authorized lines.
 * Desktop parity: CreateBindingDialog in mes_sync_settings.py.
 */
export function CreateBindingModal({
  open,
  confirming,
  onCancel,
  onSubmit,
}: CreateBindingModalProps) {
  const [form] = Form.useForm<CreateMesSyncBindingPayload>();

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({ label: '', node_id: '', line_ids: [] });
  }, [form, open]);

  return (
    <Modal
      title="Новая привязка DataManager"
      open={open}
      onCancel={onCancel}
      onOk={() => void form.validateFields().then(onSubmit)}
      okText="Создать"
      cancelText="Отмена"
      confirmLoading={confirming}
      forceRender
      destroyOnHidden={false}
      width={560}
    >
      <Form form={form} layout="vertical" disabled={confirming}>
        <Form.Item
          name="label"
          label="Метка"
          rules={[{ required: true, message: 'Укажите метку' }]}
        >
          <Input placeholder="Например: Цех 1" />
        </Form.Item>
        <Form.Item
          name="node_id"
          label="Идентификатор узла (node_id)"
          rules={[
            { required: true, message: 'Укажите UUID узла DataManager' },
            {
              pattern:
                /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
              message: 'Ожидается UUID',
            },
          ]}
          extra="Скопируйте «Идентификатор узла» из DataManager → Обмен MES."
        >
          <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </Form.Item>
        <Form.Item
          name="line_ids"
          label="Производственные линии"
          rules={[{ required: true, type: 'array', min: 1, message: 'Выберите хотя бы одну линию' }]}
        >
          <LineIdsChecklist />
        </Form.Item>
      </Form>
    </Modal>
  );
}
