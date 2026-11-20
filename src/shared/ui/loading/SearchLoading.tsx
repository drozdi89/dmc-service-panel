import { LoadingOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

/** Search input with delayed suffix spinner during debounced server search. */
export function SearchLoading(props: SearchProps) {
  const showLoading = useDelayedLoading(Boolean(props.loading));
  return (
    <Input.Search
      {...props}
      suffix={showLoading ? <LoadingOutlined spin /> : props.suffix}
    />
  );
}
