import {
  isPrintOnlyNoVerify,
  LINE_OPTIONS_FIELDS,
  resolveOutputMode,
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
  const isManualField = Form.useWatch('is_manual', form);
  const lineType = Form.useWatch('line_type', form);
  const output = Form.useWatch('output', form);
  const isScaleField = Form.useWatch('is_scale', form);

  if (!visibility.showLineOptions) {
    return null;
  }

  const isManual = Boolean(isManualField) || isPrintOnlyNoVerify(lineType);
  const isScale =
    resolveOutputMode({ output: output ?? 0, is_scale: Boolean(isScaleField) }) === 'scale';

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
