import { Button, Checkbox, Form, Modal, Space, type CheckboxChangeEvent } from 'antd';
import { useEffect, useState } from 'react';

/** Autosend product flag values editable in the details modal. */
export interface AutosendFlagsFormValues {
  auto_apply: boolean;
  auto_introduce: boolean;
  auto_aggregate: boolean;
  skip_serialization: boolean;
  auto_export_to_1c: boolean;
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


  const handleChange = ({ target }: CheckboxChangeEvent) => {
    setValues((prev) => ({ 
      ...prev, 
      [target.name as keyof AutosendFlagsFormValues]: target.checked
    }));
  };

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
            name="auto_apply"
            checked={values.auto_apply}
            onChange={handleChange}
          >
            Нанесение
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            name='auto_introduce'
            checked={values.auto_introduce}
            onChange={handleChange}
          >
            Ввод в оборот
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            name='auto_aggregate'
            checked={values.auto_aggregate}
            onChange={handleChange}
          >
            Агрегация
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            name='auto_export_to_1c'
            checked={values.auto_export_to_1c}
            onChange={handleChange}
          >
            Передавать в 1С
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox
            name='skip_serialization'
            checked={values.skip_serialization}
            onChange={handleChange}
          >
            Пропуск сериализации
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
