import { AsyncSelect } from '@/shared/ui/AsyncSelect';
import { type SelectProps } from 'antd';
import { fetchProductGroupOptions } from '../api/api';
import { productRelatedQueryKeys } from '../queries';

/**
 * Async select of supported product groups (`GET /info`).
 *
 * Shares the canonical groups key prefix with {@link useProductGroupsQuery}
 * (`['products', 'groups']`; AsyncSelect appends `'select'`).
 */
export function SelectProductGroups(props: SelectProps) {
  return (
    <AsyncSelect
      showSearch={{ optionFilterProp: 'label' }}
      {...props}
      fetchFn={fetchProductGroupOptions}
      queryKey={productRelatedQueryKeys.groups()}
      mapOption={(group) => ({
        value: group.name,
        label: group.description || group.name,
      })}
      selectedOption={{ value: 'NaN', label: 'Не маркируеться' }}
    />
  );
}
