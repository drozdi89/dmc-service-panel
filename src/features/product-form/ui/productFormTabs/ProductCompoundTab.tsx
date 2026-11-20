import type { ProductContents } from '@/entities/product/model/types';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface ProductCompoundTabProps {
  contents: ProductContents[];
  loading: boolean;
}

export function ProductCompoundTab({ loading, contents }: ProductCompoundTabProps) {
	const columns: ColumnsType<ProductContents> = [
		{ title: 'Количество', dataIndex: 'amount' },
		{ title: 'GTIN', dataIndex: 'gtin' },
		{ title: 'Название', dataIndex: 'name' },
	];
	return (
		<Table loading={loading} dataSource={contents} columns={columns} />
	)
}
