import {
  isPrintOnlyNoVerify,
  LINE_KIND_LABELS,
  LINE_TYPE,
  resolveLineKind,
  type LineEditorFormState,
  type LineEditorVisibility,
  type LineKind,
} from '@/entities/line';
import { Checkbox, Col, Form, Input, Radio, Row, Space } from 'antd';

/** Props for identity / kind fields on the line main tab. */
export interface LineIdentityFieldsProps {
  visibility: LineEditorVisibility;
}

/** Checkbox ↔ `line_type` PRINTNOVERIFY. */
const printOnlyLineTypeProps = {
  valuePropName: 'checked',
  getValueProps: (lineType: string | null | undefined) => ({
    checked: isPrintOnlyNoVerify(lineType),
  }),
  normalize: (checked: boolean): string =>
    checked ? LINE_TYPE.PRINT_NO_VERIFY : LINE_TYPE.DEFAULT,
} as const;

/** Line kind radio ↔ `is_manual`. */
const lineKindProps = {
  getValueProps: (isManual: boolean | undefined) => ({
    value: resolveLineKind({ is_manual: Boolean(isManual) }),
  }),
  normalize: (kind: LineKind): boolean => kind === 'manual',
} as const;

/**
 * Name, 1C code, flags and line-kind radio.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 */
export function LineIdentityFields({ visibility }: LineIdentityFieldsProps) {
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item required name="linename" label="Название линии" rules={[{ required: true, message: 'Пожалуйста, введите название линии' }]} style={{ marginBottom: 4 }}>
            <Input placeholder="Название производственной линии" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="one_s_line_code" label="Код 1С" style={{ marginBottom: 4 }}>
            <Input placeholder="Код линии в 1С" />
          </Form.Item>
        </Col>
      </Row>
      <Space wrap style={{ marginBottom: 4 }}>
        <Form.Item name="external_line" valuePropName="checked" noStyle>
          <Checkbox>Внешняя линия</Checkbox>
        </Form.Item>
        <Form.Item name="line_type" {...printOnlyLineTypeProps} noStyle>
          <Checkbox>Печать без верификации</Checkbox>
        </Form.Item>
        {/* <Form.Item name="allow_printed_dm" valuePropName="checked" noStyle>
          <Checkbox>Разрешить отправку напечатанных КМ</Checkbox>
        </Form.Item> */}
      </Space>
      {visibility.showLineKind && <Form.Item name="is_manual" {...lineKindProps} style={{ marginBottom: 4, width: '100%' }}>
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
