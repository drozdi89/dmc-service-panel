import { Button, Checkbox, Form, Modal, Space } from 'antd';
import { useEffect, useState } from 'react';

/** Autosend product flag values editable in the details modal. */
export interface AutosendFlagsFormValues {
  auto_apply: boolean;
  auto_introduce: boolean;
  auto_send_aggregate: boolean;
  skip_serialization: boolean;
}

/** Props for bulk autosend flags modal. */
export interface AutosendFlagsModalProps {
  open: boolean;
  initialValues: AutosendFlagsFormValues;
  onCancel: () => void;
  onOk: (values: AutosendFlagsFormValues) => void;
}

/**
 * Modal to set autosend flags for selected products (Qt AutosendDetailsDialog parity).
 */
export function AutosendFlagsModal({
  open,
  initialValues,
  onCancel,
  onOk,
}: AutosendFlagsModalProps) {
  const [values, setValues] = useState<AutosendFlagsFormValues>(initialValues);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValues(initialValues);
  }, [initialValues, open]);

  return (
    <Modal
      title="Задать параметры автоотправки"
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      width={420}
      footer={
        <Space>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="primary" onClick={() => onOk(values)}>
            ОК
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Form.Item>
          <Checkbox
            checked={values.auto_apply}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, auto_apply: event.target.checked }))
            }
          >
            Нанесение
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            checked={values.auto_introduce}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, auto_introduce: event.target.checked }))
            }
          >
            Ввод в оборот
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            checked={values.auto_send_aggregate}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                auto_send_aggregate: event.target.checked,
              }))
            }
          >
            Агрегация
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            checked={values.skip_serialization}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                skip_serialization: event.target.checked,
              }))
            }
          >
            Пропуск сериализации
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
