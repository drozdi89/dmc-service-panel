import { Spin } from 'antd';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

/** Props for table loading indicator. */
export interface TableLoadingStateProps {
  loading: boolean;
}

/**
 * Returns Ant Design Table `loading` prop with delayed visibility.
 *
 * @param loading - Whether the table data is being fetched.
 */
export function useTableLoadingState(loading: boolean): { spinning: boolean } {
  const spinning = useDelayedLoading(loading);
  return { spinning };
}

/**
 * Standalone table loading wrapper when Table loading prop is insufficient.
 */
export function TableLoadingState({ loading }: TableLoadingStateProps) {
  const { spinning } = useTableLoadingState(loading);
  if (!spinning) {
    return null;
  }
  return <Spin />;
}
