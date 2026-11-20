import { LinkOutlined } from '@ant-design/icons';
import { Card, Descriptions, Typography } from 'antd';

const { Text, Link } = Typography;

/** Props for MACT licence summary card. */
export interface LicenceMactSummaryCardProps {
  licenceSummary: string;
  subscriptionText: string;
  personalAccountUrl: string | null;
}

/**
 * Displays MACT licence counts, subscription status and personal account link.
 */
export function LicenceMactSummaryCard({
  licenceSummary,
  subscriptionText,
  personalAccountUrl,
}: LicenceMactSummaryCardProps) {
  return (
    <Card size="small">
      <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
        <Descriptions.Item label="Лицензии MACT">{licenceSummary}</Descriptions.Item>
        <Descriptions.Item label="Подписка">{subscriptionText}</Descriptions.Item>
        <Descriptions.Item label="Личный кабинет">
          {personalAccountUrl ? (
            <Link href={personalAccountUrl} target="_blank" rel="noopener noreferrer">
              <LinkOutlined /> Регистрация личного кабинета DMC
            </Link>
          ) : (
            <Text type="secondary">Данные о регистрации ЛК отсутствуют..</Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
