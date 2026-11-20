import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

/** Props for overlay loading on cards, drawers, or modals. */
export interface LoadingOverlayProps {
  loading: boolean;
  children: ReactNode;
  tip?: string;
}

/**
 * Wraps content with a delayed Ant Design Spin overlay.
 */
export function LoadingOverlay({
  loading,
  children,
  tip = 'Загрузка…',
}: LoadingOverlayProps) {
  const spinning = useDelayedLoading(loading);

  return (
    <Spin spinning={spinning} description={tip}>
      {children}
    </Spin>
  );
}
