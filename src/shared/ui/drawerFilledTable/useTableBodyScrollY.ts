import { useEffect, useState } from 'react';

/**
 * Measure Table scroll.y so the body fills the host (pagination is outside the table).
 *
 * @param host - Table host element (flex child with minHeight 0).
 * @param enabled - Whether measurement should run.
 * @param layoutKey - Re-measure when toolbar height changes (e.g. alert visibility).
 */
export function useTableBodyScrollY(
  host: HTMLDivElement | null,
  enabled: boolean,
  layoutKey: string | number | boolean = 0,
): number | undefined {
  const [scrollY, setScrollY] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !host) {
      setScrollY(undefined);
      return;
    }

    const update = () => {
      const header = host.querySelector(
        '.ant-table-header, .ant-table-thead',
      ) as HTMLElement | null;
      const headerH = header?.offsetHeight ?? 39;
      setScrollY(Math.max(120, host.clientHeight - headerH));
    };

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(host);
    const frame = requestAnimationFrame(() => {
      update();
      requestAnimationFrame(update);
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enabled, host, layoutKey]);

  return scrollY;
}
