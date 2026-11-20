import { AsyncLookupSelect } from '@/shared/ui/AsyncLookupSelect';
import { type SelectProps } from 'antd';
import { fetchCrptOrganizations } from '../api/api';
import { type CrptOrganization } from '../model/types';
import { crptOrganizationsQueries } from '../queries';

/**
 * Async lookup select for CRPT organizations (INN → name).
 *
 * Uses canonical integration query keys (`crptOrganizationsQueries.keys.all()`);
 * AsyncLookupSelect appends `'lookup'` + params to match factory lookup keys.
 */
export function SelectCrptOrganizations(props: SelectProps) {
  return (
    <AsyncLookupSelect<CrptOrganization>
      fetchFn={fetchCrptOrganizations}
      queryKey={crptOrganizationsQueries.keys.all()}
      mapOption={(item) => ({ value: item.inn, label: item.name })}
      selectedOption={{ value: '', label: 'Нет организации ЧЗ' }}
      {...props}
    />
  );
}
