import { Select, type SelectProps } from 'antd';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

/**
 * Ant Design Select with a delayed loading indicator.
 *
 * Used as the shared shell by `AsyncSelect`, `AsyncLookupSelect`, and `ResourcePicker`.
 * Prefer those factories for data-backed fields; use this only when wiring a custom Select.
 */
export function SelectLoading(props: SelectProps) {
  const showLoading = useDelayedLoading(Boolean(props.loading));
  return <Select {...props} loading={showLoading} />;
}
