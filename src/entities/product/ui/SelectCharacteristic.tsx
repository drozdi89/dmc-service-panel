import { Select, type SelectProps } from 'antd';
import {
  CHARACTERISTIC_OPTIONS
} from '../model/constants';

export function SelectCharacteristic(props: SelectProps) {
  return (
    <Select
      {...props}
      options={[{
        value: null,
        label: 'Отсутствует',
      }].concat(CHARACTERISTIC_OPTIONS)}
    />
  );
}
