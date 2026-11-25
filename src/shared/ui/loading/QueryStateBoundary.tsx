import { Alert } from 'antd';
import type { ReactNode } from 'react';
import { PageSpinner } from './PageSpinner';

/** Props for {@link QueryStateBoundary}. */
export interface QueryStateBoundaryProps {
  /** Initial load in progress. */
  loading: boolean;
  /** Load error, when the query failed. */
  error?: Error | null;
  /** Alert title for the error state. */
  errorTitle?: string;
  /** Spinner container height. */
  minHeight?: number | string;
  /** Content rendered once data is ready. */
  children: ReactNode;
}

/**
 * Section-level loading / error wrapper: spinner while loading, `Alert` on error,
 * otherwise children.
 */
export function QueryStateBoundary({
  loading,
  error,
  errorTitle = 'Не удалось загрузить данные',
  minHeight = 120,
  children,
}: QueryStateBoundaryProps) {
  if (loading) {
    return <PageSpinner minHeight={minHeight} />;
  }

  if (error) {
    return <Alert type="error" showIcon message={errorTitle} description={error.message} />;
  }

  return children;
}
