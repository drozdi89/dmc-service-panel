import { Flex, Spin } from 'antd';
import type { ReactNode } from 'react';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

/** Props for full-page loading spinner. */
export interface PageSpinnerProps {
  /** Whether loading is active. */
  loading?: boolean;
  /** Optional tip text below the spinner. */
  tip?: string;
  /** Minimum height of the spinner container. */
  minHeight?: number | string;
  /** Content to render when not loading. */
  children?: ReactNode;
}

/**
 * Full-page or route-level loading indicator for lazy routes and initial loads.
 */
export function PageSpinner({
  loading = true,
  tip = 'Загрузка…',
  minHeight = '60vh',
  children,
}: PageSpinnerProps) {
  const showLoading = useDelayedLoading(loading);

  if (!loading) {
    return children ?? null;
  }

  if (!showLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight }}>
        {children}
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight }}>
      <Spin size="large" description={tip}>
        <div style={{ minHeight: 48, minWidth: 48 }} />
      </Spin>
    </Flex>
  );
}
