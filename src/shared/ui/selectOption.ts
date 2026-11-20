/** Option shape for async / lookup selects (`value` + display `label`). */
export interface LookupOption {
  value: string | number;
  label: string;
}

/** Maps a list row to a select option. */
export type LookupOptionMapper<T> = (item: T) => LookupOption;
