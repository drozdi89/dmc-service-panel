
import { Select, type SelectProps } from 'antd';
import { CONTROLLER_TYPE_OPTIONS } from '../model/constants';

export function SelectDeviceControllerType (props: SelectProps) {
	return <Select
		{...props}
        options={CONTROLLER_TYPE_OPTIONS}
    />
}