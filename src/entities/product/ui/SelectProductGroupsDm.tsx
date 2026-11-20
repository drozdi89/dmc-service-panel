import { Select, type SelectProps } from 'antd';
import {
  PRODUCT_GROUPS_DM
} from '../model/constants';

export function SelectProductGroupsDm(props: SelectProps) {
  return (
    <Select
      {...props}
      options={PRODUCT_GROUPS_DM}
    />
  );
}
