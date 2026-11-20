import {
  LINE_KIND_LABELS,
  type LineEditorFormState,
  type LineEditorVisibility
} from '@/entities/line';
import { Checkbox, Col, Form, Input, Radio, Row, Space } from 'antd';

/** Props for identity / kind fields on the line main tab. */
export interface LineIdentityFieldsProps {
  visibility: LineEditorVisibility;
}

/**
 * Name, 1C code, flags and line-kind radio.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 */
export function LineIdentityFields({ visibility }: LineIdentityFieldsProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item required name="name" label="Название линии" rules={[{ required: true, message: 'Пожалуйста, введите название линии' }]} style={{ marginBottom: 4 }}>
            <Input placeholder="Название производственной линии" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="one_s_code" label="Код 1С" style={{ marginBottom: 4 }}>
            <Input placeholder="Код линии в 1С" />
          </Form.Item>
        </Col>
      </Row>
      <Space wrap style={{ marginBottom: 4 }}>
        <Form.Item name="external_line" valuePropName="checked" noStyle>
          <Checkbox>Внешняя линия</Checkbox>
        </Form.Item>
        <Form.Item name="print_only_no_verify" valuePropName="checked" noStyle>
          <Checkbox>Печать без верификации</Checkbox>
        </Form.Item>
        {/* <Form.Item name="allow_printed_dm" valuePropName="checked" noStyle>
          <Checkbox>Разрешить отправку напечатанных КМ</Checkbox>
        </Form.Item> */}
      </Space>
      {visibility.showLineKind && <Form.Item name="lineKind" style={{ marginBottom: 4, width: '100%' }}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          disabled={visibility.disableLineKindToggle}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
        >
          <Radio.Button value="automated" style={{ flex: 1 }}>{LINE_KIND_LABELS.automated}</Radio.Button>
          <Radio.Button value="manual" style={{ flex: 1 }}>{LINE_KIND_LABELS.manual}</Radio.Button>
        </Radio.Group>
      </Form.Item>}
    </>
  );
}
