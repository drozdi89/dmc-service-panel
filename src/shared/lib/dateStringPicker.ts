import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

/**
 * Parse API / form date into a Dayjs instance for Ant Design DatePicker.
 *
 * @param value - Dayjs, `YYYY-MM-DD` string, or empty.
 */
export function parseDatePickerValue(
  value: Dayjs | string | null | undefined,
): Dayjs | null {
  if (value == null || value === '') {
    return null;
  }
  if (dayjs.isDayjs(value)) {
    return value;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/**
 * Format Ant Design DatePicker form value to API date string (`YYYY-MM-DD`).
 *
 * @param value - Dayjs from DatePicker or an already-formatted string.
 */
export function formatDatePickerValue(
  value: Dayjs | string | null | undefined,
): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (dayjs.isDayjs(value)) {
    return value.format('YYYY-MM-DD');
  }
  return String(value);
}

/**
 * Form.Item props: DatePicker always gets Dayjs, form store keeps `YYYY-MM-DD`.
 *
 * Passing a raw string as DatePicker `value` crashes rc-picker
 * (`getUDayjs(...).isValid is not a function`) — e.g. after `setFieldsValue` from API.
 */
export const dateStringPickerValueProps = {
  getValueProps: (value: Dayjs | string | null | undefined) => ({
    value: parseDatePickerValue(value),
  }),
  normalize: (value: Dayjs | string | null | undefined): string | null =>
    formatDatePickerValue(value),
};
