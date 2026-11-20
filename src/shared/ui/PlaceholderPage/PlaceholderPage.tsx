import { Typography } from 'antd';

/** Props for module placeholder pages. */
export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Stub page for modules not yet implemented in subtasks #3–#10.
 */
export function PlaceholderPage({
  title,
  description = 'Раздел будет реализован в следующих подзадачах плана Web UI.',
}: PlaceholderPageProps) {
  return (
    <div>
      <Typography.Title level={3}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
    </div>
  );
}
