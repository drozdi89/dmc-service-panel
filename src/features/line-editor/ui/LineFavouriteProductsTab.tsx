import type { LineEditorFormState, LineEditorVisibility } from '@/entities/line';
import { productQueries } from '@/entities/product';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { SearchLoading } from '@/shared/ui/loading';
import { Checkbox, Form, List, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';

/** Props for favourite products tab (GTIN list lives in parent Form). */
export interface LineFavouriteProductsTabProps {
  /** Empty-state lock for manual / loaded-manual lines. */
  disabled?: boolean;
  visibility: LineEditorVisibility;
}

/**
 * Favourite products tab with searchable checkbox list.
 * Reads/writes `favourite_gtins` via Form.
 */
export function LineFavouriteProductsTab({ disabled, visibility }: LineFavouriteProductsTabProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const favouriteGtins = Form.useWatch('favourite_gtins', form) ?? [];

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedSearch(search);

  const { data, isFetching } = productQueries.useListQuery(
    {
      size: 200,
      number: 0,
      q: debouncedSearch.trim() || undefined,
      archived: false,
    },
    { enabled: !visibility.disableProductsTab },
  );

  const products = data?.response ?? [];
  const favouriteSet = useMemo(() => new Set(favouriteGtins), [favouriteGtins]);

  const toggleGtin = (gtin: string, checked: boolean) => {
    const next = new Set(favouriteSet);
    if (checked) {
      next.add(gtin);
    } else {
      next.delete(gtin);
    }
    form.setFieldValue('favourite_gtins', [...next]);
  };

  if (visibility.disableProductsTab) {
    return (
      <Typography.Text type="secondary">
        Избранная продукция недоступна для ручных линий.
      </Typography.Text>
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <SearchLoading
        placeholder="Поиск по GTIN или названию…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        allowClear
        loading={isFetching}
      />

      <List
        size="small"
        bordered
        loading={isFetching}
        dataSource={products}
        locale={{ emptyText: 'Продукция не найдена' }}
        renderItem={(product) => (
          <List.Item>
            <Checkbox
              checked={favouriteSet.has(product.gtin)}
              onChange={(event) => toggleGtin(product.gtin, event.target.checked)}
            >
              [{product.gtin}] {product.name}
            </Checkbox>
          </List.Item>
        )}
      />
    </Space>
  );
}
