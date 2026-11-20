import {
  LINE_OPTIONS_FIELDS,
  type LineEditorFormState,
  type LineEditorVisibility,
} from '@/entities/line';
import { Checkbox, Divider, Flex, Form } from 'antd';

/** Props for line options checkboxes. */
export interface LineOptionsFieldsProps {
  visibility: LineEditorVisibility;
}

/**
 * Line runtime options (`options.*`) when the section is visible.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 */
export function LineOptionsFields({ visibility }: LineOptionsFieldsProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const lineKind = Form.useWatch('lineKind', form);
  const outputMode = Form.useWatch('outputMode', form);
  const printOnlyNoVerify = Form.useWatch('print_only_no_verify', form);

  if (!visibility.showLineOptions) {
    return null;
  }

  const isManual = lineKind === 'manual' || Boolean(printOnlyNoVerify);
  const isScale = outputMode === 'scale';

  return (
    <>
      <Divider titlePlacement="start" style={{ margin: 0 }}>
        Параметры линии
      </Divider>
      <Flex orientation="vertical" gap="0">
        {LINE_OPTIONS_FIELDS.map((field) => (
          <Form.Item
            key={field.key}
            name={['options', field.key]}
            valuePropName="checked"
            noStyle
          >
            <Checkbox
              disabled={
                (Boolean(field.disabledWhenManual) && isManual) ||
                (Boolean(field.disabledWhenScale) && isScale) ||
                (field.key === 'can_add_task' && visibility.disableCanAddTask)
              }
            >
              {field.label}
            </Checkbox>
          </Form.Item>
        ))}
      </Flex>
    </>
  );
}
