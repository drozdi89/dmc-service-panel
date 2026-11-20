/**
 * Returns the next zero-based page index when the last page looks full; otherwise `undefined`.
 *
 * Used by {@link AsyncSelect} for infinite scroll: load more only if the previous
 * response returned as many items as were requested (`pageSize`).
 *
 * @param lastPageLength - Number of items in the last response.
 * @param requestedSize - Page size that was requested.
 * @param lastPageNumber - Zero-based index of the last fetched page.
 */
export function getNextSelectPageParam(
  lastPageLength: number,
  requestedSize: number,
  lastPageNumber: number,
): number | undefined {
  if (lastPageLength < requestedSize) {
    return undefined;
  }
  return lastPageNumber + 1;
}
