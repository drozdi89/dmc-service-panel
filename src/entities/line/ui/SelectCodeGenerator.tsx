import { Select, type SelectProps } from 'antd';
import { CODE_GENERATOR_OPTIONS } from '../model/constants';

/** Select of code generators (CodeGeneratorType enum). */
export function SelectCodeGenerator(
  props: SelectProps,
) {
  return (
    <Select
      {...props}
      options={CODE_GENERATOR_OPTIONS}
    />
  );
}
