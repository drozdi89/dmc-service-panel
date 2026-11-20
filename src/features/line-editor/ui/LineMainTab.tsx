import {
  computeLineEditorVisibility,
  createDefaultLineFormState,
  type LineEditorFormState,
  type LineEditorResourceLabels,
  type LineEditorVisibility,
} from '@/entities/line';
import { Form, Space } from 'antd';
import {
  LineOptionsFields,
  LineScaleWorkplacesFields,
  LineSerializationFields
} from './lineFormSections';

/** Props for the main line editor tab (Form-driven). */
export interface LineMainTabProps {
  /**
   * Whether the editor is creating a new line (kind toggle enabled).
   * Used when computing visibility from Form values.
   */
  isNew: boolean;
  /**
   * Optional precomputed visibility (e.g. from page).
   * When omitted, derived via {@link computeLineEditorVisibility} + Form.useWatch.
   */
  visibility?: LineEditorVisibility;
  resourceLabels: LineEditorResourceLabels;
  onResourceLabelsChange: (next: LineEditorResourceLabels) => void;
}

/**
 * Main tab: line type, name, devices, templates and line options.
 *
 * Must render inside an antd {@link Form} bound to {@link LineEditorFormState}.
 * Fields use Form.Item / useWatch — no controlled `state` / `onChange` patch API.
 */
export function LineMainTab({
  isNew,
  visibility: visibilityProp,
  resourceLabels,
  onResourceLabelsChange,
}: LineMainTabProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const watchedValues = Form.useWatch([], form) as LineEditorFormState | undefined;
  const visibility =
    visibilityProp ??
    computeLineEditorVisibility(
      {
        ...createDefaultLineFormState(),
        ...(watchedValues ?? {}),
      },
      isNew,
    );

  return (
    <Space orientation="vertical" size="small" style={{ width: '100%' }}>
      <LineOptionsFields visibility={visibility} />
      <LineSerializationFields
        visibility={visibility}
        resourceLabels={resourceLabels}
        onResourceLabelsChange={onResourceLabelsChange}
      />
      <LineScaleWorkplacesFields
        visibility={visibility}
        resourceLabels={resourceLabels}
        onResourceLabelsChange={onResourceLabelsChange}
      />
    </Space>
  );
}
