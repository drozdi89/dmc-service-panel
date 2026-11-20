
import { Select, type SelectProps } from 'antd';
import { COUNTER_TYPE_OPTIONS } from '../model/constants';
import type { CounterSpecType } from '../model/types';

export function SelectCounterType (props: SelectProps) {
	return <Select<CounterSpecType>
		{...props}
        options={COUNTER_TYPE_OPTIONS}
    />
}