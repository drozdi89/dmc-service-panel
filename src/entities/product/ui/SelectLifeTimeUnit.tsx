import { Select, type SelectProps } from 'antd';
import {
  LIFETIME_UNIT_OPTIONS
} from '../model/constants';

export function SelectLifeTimeUnit(props: SelectProps) {
  return (
    <Select
      {...props}
      options={LIFETIME_UNIT_OPTIONS}
    />
  );
}
