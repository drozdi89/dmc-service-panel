import { AsyncLookupSelect, type AsyncLookupSelectProps } from '@/shared/ui/AsyncLookupSelect';
import { fetchCodeGeneratorTemplatesLookup } from '../api/api';
import type { CodeGeneratorTemplate } from '../model/types';
import { codeGeneratorTemplateQueries } from '../queries';

/**
 * Server-searchable select of code generator templates (`AsyncLookupSelect`).
 *
 * Uses canonical query keys from {@link codeGeneratorTemplateQueries}
 * (`['code-generator-templates', 'lookup', …]`).
 */
export function SelectCodeGeneratorTemplate(
  props: Omit<
    AsyncLookupSelectProps<CodeGeneratorTemplate>,
    'queryKey' | 'fetchFn' | 'mapOption'
  >,
) {
  return (
    <AsyncLookupSelect<CodeGeneratorTemplate>
      queryKey={codeGeneratorTemplateQueries.keys.all()}
      fetchFn={fetchCodeGeneratorTemplatesLookup}
      mapOption={(item) => ({ value: item.id, label: item.name })}
      {...props}
    />
  );
}
