import { Select, type SelectProps } from 'antd';

export function SelectProductControllerAddressType(props: SelectProps) {
  return (
    <Select
      {...props}
      options={[{
        label: 'Регистр',
        value: 'register',
      }, {
        label: 'Коил',
        value: 'coil',
      }]}
    />
  );
}
