import { AsyncLookupSelect, type AsyncLookupSelectProps } from '@/shared/ui/AsyncLookupSelect';
import { fetchPrintTemplatesLookup } from '../api/api';
import type { PrintTemplate } from '../model/types';
import { printTemplateQueries } from '../queries';

/**
 * Select-only: server-searchable select of print templates (`AsyncLookupSelect`).
 *
 * Uses canonical query keys from {@link printTemplateQueries} (`['print-templates', 'lookup', …]`).
 * No Create/Edit chrome. For Select+Add (store → Host modal) see
 * {@link PrintTemplateResourcePicker}; `TemplateFormModalHost` mounts in AppProviders.
 */
export function SelectPrintTemplate(
  props: Omit<AsyncLookupSelectProps<PrintTemplate>, 'queryKey' | 'fetchFn' | 'mapOption'>,
) {
  return (
    <AsyncLookupSelect<PrintTemplate>
      queryKey={printTemplateQueries.keys.all()}
      fetchFn={fetchPrintTemplatesLookup}
      mapOption={(item) => ({ value: item.id, label: item.name })}
      {...props}
    />
  );
}
