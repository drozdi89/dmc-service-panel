import {
  DeviceResourcePicker,
  type DeviceType,
} from '@/entities/device';
import { PrintTemplateResourcePicker } from '@/entities/print-template';
import type { LookupOption } from '@/shared/ui/AsyncLookupSelect';
import { Form, Input } from 'antd';
import type { NamePath } from 'antd/es/form/interface';

/**
 * Props for a device or template picker field on the line editor.
 *
 * Device/template create/edit use entity pickers + AppProviders-mounted Hosts
 * (`DeviceFormModalHost` / `TemplateFormModalHost`).
 *
 * Modes:
 * - **Form-controlled** — pass `name` (resource id). Optional `labelName` syncs a
 *   companion `*Label` field via `form.setFieldValue`. When `valueLabel` is omitted,
 *   the display label is read via `Form.useWatch(labelName)`.
 * - **Controlled** — pass `value` / `onChange` (aggregation modals with labels outside
 *   Form, or legacy LineMainTab). Can combine `name` + `onChange` to update Form id
 *   while syncing external label state.
 */
export interface LineResourcePickerFieldProps {
  layout?: 'vertical' | 'horizontal';
  /** Form field path for the resource id. */
  name?: NamePath;
  /**
   * Optional companion Form field for the display label (`*Label`).
   * Written on select/clear when a Form instance is present.
   * When `valueLabel` is omitted, also watched for display.
   */
  labelName?: NamePath;
  label: string;
  kind: 'device' | 'template';
  deviceType?: DeviceType;
  /** Controlled resource id (legacy / labels outside Form). */
  value?: number | null;
  valueLabel?: string;
  /**
   * Called with normalized id and option label.
   * Use with Form `name` to sync labels kept outside the Form store.
   */
  onChange?: (id: number | null, label?: string) => void;
  disabled?: boolean;
  deviceTypes?: DeviceType[];
  /** Include only these ScaleType values in scale lookup (Qt combo filter). */
  scaleTypes?: number[];
  /** Exclude these ScaleType values from scale lookup. */
  excludeScaleTypes?: number[];
  /** Default scale_type when creating a scale from this picker. */
  defaultScaleType?: number;
}

/** Normalize picker/Select value to `number | null` for Form / callbacks. */
export function normalizeResourceId(
  nextValue: string | number | null | undefined,
): number | null {
  if (nextValue === null || nextValue === undefined || nextValue === '') {
    return null;
  }
  const id = Number(nextValue);
  return Number.isFinite(id) ? id : null;
}

function optionLabelText(option?: LookupOption | null): string | undefined {
  if (option?.label === undefined || option?.label === null) {
    return undefined;
  }
  return String(option.label);
}

function asDisplayLabel(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  return typeof raw === 'string' ? raw : String(raw);
}

/**
 * Thin Form.Item wrapper for device or template picker fields.
 *
 * Add/Edit → store → Host modal; substitution is scoped by `consumerId`.
 * Type-lock is preserved for device create from the line.
 */
export function LineResourcePickerField(props: LineResourcePickerFieldProps) {
  const { labelName, valueLabel } = props;

  if (labelName != null && valueLabel === undefined) {
    return (
      <LineResourcePickerFieldWatchLabel {...props} labelName={labelName} />
    );
  }

  return (
    <LineResourcePickerFieldImpl {...props} effectiveValueLabel={valueLabel} />
  );
}

/**
 * Watches `labelName` so edit load / `setFieldsValue({ id, *Label })` shows the
 * companion label without requiring the caller to pass `valueLabel={useWatch(...)}`.
 */
function LineResourcePickerFieldWatchLabel(
  props: LineResourcePickerFieldProps & { labelName: NamePath },
) {
  const form = Form.useFormInstance();
  const watchedLabel = Form.useWatch(props.labelName, form);

  return (
    <LineResourcePickerFieldImpl
      {...props}
      effectiveValueLabel={asDisplayLabel(watchedLabel)}
    />
  );
}

interface LineResourcePickerFieldImplProps extends LineResourcePickerFieldProps {
  /** Resolved label passed to the entity picker (`valueLabel` or watched form field). */
  effectiveValueLabel?: string;
}

function LineResourcePickerFieldImpl({
  layout = 'vertical',
  name,
  labelName,
  label,
  kind,
  deviceType = 'camera',
  value,
  effectiveValueLabel,
  onChange,
  disabled,
  deviceTypes,
  scaleTypes,
  excludeScaleTypes,
  defaultScaleType,
}: LineResourcePickerFieldImplProps) {
  const form = Form.useFormInstance();
  const isControlled = value !== undefined;

  const handleChange = (
    nextValue: string | number | null | undefined,
    option?: LookupOption | null,
  ) => {
    const id = normalizeResourceId(nextValue);
    const nextLabel = id === null ? undefined : optionLabelText(option);

    if (labelName && form) {
      form.setFieldValue(labelName, nextLabel);
    }
    onChange?.(id, nextLabel);
  };

  const sharedPickerProps = {
    ...(isControlled ? { value: value ?? undefined } : {}),
    valueLabel: effectiveValueLabel,
    disabled,
    allowClear: true as const,
    placeholder: 'Не используется',
    onChange: handleChange,
  };

  return (
    <>
      {/* Register companion label so Form.useWatch / setFieldsValue stay in sync. */}
      {labelName != null ? (
        <Form.Item name={labelName} hidden preserve noStyle>
          <Input type="hidden" />
        </Form.Item>
      ) : null}
      <Form.Item
        label={label}
        style={{ marginBottom: 4 }}
        layout={layout}
        name={name}
        getValueFromEvent={(val: string | number | null | undefined) =>
          normalizeResourceId(val)
        }
        getValueProps={(val: number | null | undefined) => ({
          value: val === null || val === undefined ? undefined : val,
        })}
      >
        {kind === 'device' ? (
          <DeviceResourcePicker
            {...sharedPickerProps}
            deviceType={deviceType}
            types={deviceTypes ?? [deviceType]}
            scaleTypes={scaleTypes}
            excludeScaleTypes={excludeScaleTypes}
            defaultScaleType={defaultScaleType}
            lockDeviceType
          />
        ) : (
          <PrintTemplateResourcePicker {...sharedPickerProps} />
        )}
      </Form.Item>
    </>
  );
}
