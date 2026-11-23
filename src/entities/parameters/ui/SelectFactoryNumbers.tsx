import { AsyncLookupSelect } from '@/shared/ui/AsyncLookupSelect';
import { type SelectProps } from 'antd';
import { fetchFactoryNumbers } from '../api/api';
import { type FactoryNumberRow } from '../model/types';
import { factoryNumbersQueries } from '../queries';

/**
 * Async lookup select for factory numbers.
 *
 * Uses canonical keys from {@link factoryNumbersQueries} (`['parameters', 'factory-numbers']`);
 * AsyncLookupSelect appends `'lookup'` + params to match factory lookup keys.
 */
export function SelectFactoryNumbers(props: SelectProps) {
  return (
    <AsyncLookupSelect<FactoryNumberRow>
      fetchFn={fetchFactoryNumbers}
      queryKey={factoryNumbersQueries.keys.all()}
      mapOption={(item) => ({ value: item.id, label: item.factory_number })}
      selectedOption={{ value: '', label: 'Номер по умолчанию' }}
      {...props}
    />
  );
}
