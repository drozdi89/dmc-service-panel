import { Select, type SelectProps } from 'antd';
import {
  CRPT_TEMPLATE_IDX
} from '../model/constants';

export function SelectCrptTemplateIdx(props: SelectProps) {
  return (
    <Select
      {...props}
      options={CRPT_TEMPLATE_IDX}
    />
  );
}
