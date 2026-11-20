import {
  createAggregationClientKey,
  type AggregationLevelFormState
} from '@/entities/line';
import { StepperNumberInput } from '@/shared/ui/StepperNumberInput';
import { App, Flex, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';

/** Props for automated aggregation level modal. */
export interface AutonomousAggregationLevelModalProps {
  open: boolean;
  initialLevel?: AggregationLevelFormState;
  onCancel: () => void;
  onSave: (level: AggregationLevelFormState) => void;
}

const DEFAULT_LEVEL: Partial<AggregationLevelFormState> = {
  clientKey: createAggregationClientKey(),
  name: '',
  level: 0,
  is_manual: false,
  aggregation_type: 'automated',
};

/**
 * Modal editor for automated aggregation level (Qt AggregationLevel parity).
 */
export function AutonomousAggregationLevelModal({
  open,
  initialLevel,
  onCancel,
  onSave,
}: AutonomousAggregationLevelModalProps) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<AggregationLevelFormState>();

  useEffect(() => {
    if (open) {
      const level = initialLevel ?? DEFAULT_LEVEL;
      form.setFieldsValue(level);
    } else {
      form.resetFields();
    }
  }, [form, initialLevel, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSave({
      ...(initialLevel ?? DEFAULT_LEVEL),
      ...values,
      is_manual: false,
      aggregation_type: 'autonomous',
    });
  };

  return (
    <Modal
      open={open}
      title={initialLevel ? 'Изменение уровня агрегации' : 'Новый уровень агрегации'}
      width={1024}
      onCancel={onCancel}
      onOk={() => {
        void handleSubmit();
      }}
      style={{ top: '1rem' }}
      styles={{ 
        body: { 
          maxHeight: 'calc(100vh - 10rem)', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          marginRight: '-24px',
          paddingRight: '24px',
        } 
      }}
    >
      <Form form={form} layout="vertical" initialValues={DEFAULT_LEVEL}>
        <Flex align="start" orientation='horizontal' justify='space-between' gap='1rem'>
          <Form.Item
            name="name"
            label="Наименование"
            layout='horizontal'
            rules={[{ required: true, message: 'Укажите название' }]}
            style={{ flex: 1, marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item name="level" label="Уровень" layout='horizontal' rules={[{ required: true }]} style={{ marginBottom: 4 }}>
            <StepperNumberInput min={0} max={9} step={1} />
          </Form.Item>
        </Flex>
      </Form>
    </Modal>
  );
}
