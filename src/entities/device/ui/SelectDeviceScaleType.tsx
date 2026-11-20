
import { Select, type SelectProps } from 'antd';
import { SCALE_TYPE_OPTIONS } from '../model/constants';

export function SelectDeviceScaleType (props: SelectProps) {
	return <Select
		showSearch
		{...props}
        options={SCALE_TYPE_OPTIONS}
    />
}