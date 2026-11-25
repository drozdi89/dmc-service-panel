import type { MesSyncBinding } from '@/entities/mes-sync';
import { Form, Modal, Typography } from 'antd';
import { useEffect } from 'react';
import { LineIdsChecklist } from './LineIdsChecklist';

/** Props for edit binding lines modal. */
export interface EditBindingLinesModalProps {
  open: boolean;
  binding: MesSyncBinding | null;
  confirming: boolean;
  onCancel: () => void;
  onSubmit: (lineIds: number[]) => void;
}

/**
 * Replace authorized line ids on an active binding.
 * Desktop parity: EditBindingLinesDialog in mes_sync_settings.py.
 */
export function EditBindingLinesModal({
  open,
  binding,
  confirming,
  onCancel,
  onSubmit,
}: EditBindingLinesModalProps) {
  const [form] = Form.useForm<{ line_ids: number[] }>();

  useEffect(() => {
    if (!open || !binding) {
      return;
    }
    form.setFieldsValue({ line_ids: binding.line_ids ?? [] });
  }, [binding, form, open]);

  return (
    <Modal
      title="Линии привязки"
      open={open}
      onCancel={onCancel}
      onOk={() =>
        void form.validateFields().then((values) => {
          onSubmit(values.line_ids);
        })
      }
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={confirming}
      forceRender
      destroyOnHidden={false}
      width={560}
    >
      {binding ? (
        <Typography.Paragraph type="secondary">
          {binding.label} · node {binding.node_id}
        </Typography.Paragraph>
      ) : null}
      <Form form={form} layout="vertical" disabled={confirming}>
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
