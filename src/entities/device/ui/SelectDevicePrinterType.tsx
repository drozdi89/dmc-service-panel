
import { Select, type SelectProps } from 'antd';
import { PRINTER_TYPE_OPTIONS } from '../model/constants';

export function SelectDevicePrinterType (props: SelectProps) {
	return <Select
		showSearch
		{...props}
        options={PRINTER_TYPE_OPTIONS}
    />
}