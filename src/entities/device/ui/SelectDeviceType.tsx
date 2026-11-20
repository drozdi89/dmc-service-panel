
import { Select, type SelectProps } from 'antd';
import { DEVICE_TYPE_SELECT_OPTIONS } from '../model/constants';

export function SelectDeviceType (props: SelectProps) {
	return <Select
		{...props}
        options={DEVICE_TYPE_SELECT_OPTIONS}
    />
}