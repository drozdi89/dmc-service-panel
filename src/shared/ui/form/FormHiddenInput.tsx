import { Input, type InputProps } from 'antd';

/** Registers a hidden form field (avoids empty Form.Item layout warning). */
export function FormHiddenInput(props: InputProps) {
  return <Input {...props} type="hidden" />;
}