import { SelectDevice, type SelectDeviceProps } from './SelectDevice';

export type SelectPrinterProps = Omit<SelectDeviceProps, 'types'>;

export function SelectPrinter(props: SelectPrinterProps) {
  return (
    <SelectDevice {...props} types={['printer']} />
  );
}
