import type { CSSProperties } from 'react';
import styles from './drawerFilledTable.module.css';

/** Ant Design Drawer `styles` for a full-height body with flex column layout. */
export const DRAWER_FILLED_STYLES = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    paddingBottom: 16,
  },
} as const;

/** Root content wrapper inside a filled drawer body. */
export const DRAWER_FILLED_CONTENT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
  minHeight: 0,
  gap: '0.5rem',
};

export { useTableBodyScrollY } from './useTableBodyScrollY';
export { styles as drawerFilledTableStyles };
