import type { CrptOrganization, CrptOrganizationFormValues } from '@/entities/integration';
import { Checkbox, Divider, Form, Input, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';

/** Props for CRPT organization create/edit modal. */
export interface CrptOrganizationFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialOrg?: CrptOrganization | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: CrptOrganizationFormValues) => void;
}

const DEFAULT_VALUES: CrptOrganizationFormValues = {
  inn: '',
  name: '',
  kpp: '',
  thumbprint: '',
  is_demo: false,
  oms_id: '',
  oms_connection: '',
  load_wares: false,
  auto_bill: false,
  bill_sum: 0,
  bill_min: 0,
  bill_email: '',
  mods_list: '',
  short_template: false,
};

/**
 * Modal form for CRPT organization create and edit (Qt OrgParams parity).
 */
export function CrptOrganizationFormModal({
  open,
  mode,
  initialOrg,
  saving,
  onCancel,
  onSubmit,
}: CrptOrganizationFormModalProps) {
  const [form] = Form.useForm<CrptOrganizationFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }
    if (mode === 'edit' && initialOrg) {
      form.setFieldsValue({
        inn: initialOrg.inn,
        name: initialOrg.name,
        kpp: initialOrg.kpp ?? '',
        thumbprint: initialOrg.thumbprint,
        is_demo: initialOrg.is_demo,
        oms_id: initialOrg.oms_id,
        oms_connection: initialOrg.oms_connection,
        load_wares: initialOrg.load_wares,
        auto_bill: initialOrg.auto_bill,
        bill_sum: initialOrg.bill_sum,
        bill_min: initialOrg.bill_min,
        bill_email: initialOrg.bill_email ?? '',
        mods_list: initialOrg.mods_list ?? '',
        short_template: (initialOrg.crpt_template_idx ?? 0) === 1,
      });
      return;
    }
    form.setFieldsValue(DEFAULT_VALUES);
  }, [form, initialOrg, mode, open]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  const autoBill = Form.useWatch('auto_bill', form);
  
  return (
    <Modal
      title={mode === 'create' ? 'Новая организация ЧЗ' : 'Редактирование организации ЧЗ'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      okText="Сохранить"
      cancelText="Отмена"
      width={864}
      style={{ top: '1rem' }}
      styles={{ 
        body: { 
          maxHeight: 'calc(100vh - 10rem)', 
          overflowY: 'auto',
          paddingRight: '24px',
          marginRight: '-24px'
        } 
      }}
      confirmLoading={saving}
      okButtonProps={{ disabled: saving }}
    >
      <Form form={form} layout="horizontal" labelCol={{ span: 8 }} disabled={saving}>
        <Form.Item
          name="name"
          label="Наименование"
          rules={[{ required: true, message: 'Укажите наименование' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="inn"
          label="ИНН"
          rules={[
            { required: true, message: 'Укажите ИНН' },
            {
              validator: (_, value: string) => {
                const len = value?.trim().length ?? 0;
                return len === 10 || len === 12
                  ? Promise.resolve()
                  : Promise.reject(new Error('ИНН должен содержать 10 или 12 цифр'));
              },
            },
          ]}
          style={{ marginBottom: 4 }}
        >
          <Input disabled={mode === 'edit'} />
        </Form.Item>
        <Form.Item name="kpp" label="КПП" style={{ marginBottom: 4 }}>
          <Input />
        </Form.Item>
        <Divider titlePlacement='left' style={{ marginBottom: 0, marginTop: 0 }}>
          Параметы подключения к СУЗ
        </Divider>
        <Form.Item name="is_demo" label='Демо-контур' valuePropName="checked" style={{ marginBottom: 4 }}>
          <Checkbox />
        </Form.Item>
        <Form.Item
          name="oms_id"
          label="OMSID"
          rules={[{ required: true, message: 'Укажите OMSID' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item name="oms_connection" label="OMS Connection" style={{ marginBottom: 4 }}>
          <Input />
        </Form.Item>
        <Form.Item
          name="thumbprint"
          label="GLN (отпечаток сертификата)"
          rules={[
            { required: true, message: 'Укажите GLN' },
            {
              validator: (_, value: string) => {
                const text = value?.trim() ?? '';
                return /^\d{13}$/.test(text)
                  ? Promise.resolve()
                  : Promise.reject(new Error('GLN должен содержать 13 цифр'));
              },
            },
          ]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item name="load_wares" label='Автозагрузка номенклатуры' valuePropName="checked" style={{ marginBottom: 4 }}>
          <Checkbox />
        </Form.Item>
        
        <Form.Item name="mods_list" label="Список модификаторов" style={{ marginBottom: 4 }}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="short_template" label='Короткий шаблон КМ (резервный)' valuePropName="checked" style={{ marginBottom: 4 }}>
          <Checkbox />
        </Form.Item>
        <Divider titlePlacement='left' style={{ marginBottom: 0, marginTop: 0 }}>
          <Form.Item name="auto_bill" labelCol={{}} valuePropName="checked" noStyle>
            <Checkbox>
              Автопополнение баланса
            </Checkbox>
          </Form.Item>
        </Divider>
        <Form.Item noStyle shouldUpdate={(prev, next) => prev.auto_bill !== next.auto_bill}>
          {({ getFieldValue }) =>
            (
              <>
                <Form.Item  name="bill_min" label="Минимальный баланс, ₽" style={{ marginBottom: 4 }}>
                  <InputNumber disabled={!getFieldValue('auto_bill') } min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="bill_sum" label="Сумма пополнения, ₽" style={{ marginBottom: 4 }}>
                  <InputNumber disabled={!getFieldValue('auto_bill') } min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="bill_email" label="E-mail для уведомлений" style={{ marginBottom: 4 }}>
                  <Input disabled={!getFieldValue('auto_bill') } type="email" />
                </Form.Item>
              </>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}
