import { Select, type SelectProps } from 'antd';
import {
  MEASURE_UNIT_OPTIONS
} from '../model/constants';

export function SelectMeasureUnit(props: SelectProps) {
  return (
    <Select
      {...props}
      options={MEASURE_UNIT_OPTIONS}
    />
  );
}
