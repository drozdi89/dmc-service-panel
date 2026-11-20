import { Button, type ButtonProps, Tooltip } from 'antd';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

/** Button with delayed loading indicator for save/delete actions. */
export function ButtonLoading({ loading, tooltip, ...props }: ButtonProps & { tooltip?: string }) {
  const showLoading = useDelayedLoading(Boolean(loading));
  return <Tooltip title={tooltip}><Button {...props} loading={showLoading} /></Tooltip>;
}
