import { Alert, Typography } from 'antd';
import { DEFAULT_TASKS_LIST_PARAMS, useTaskListQuery } from '@/entities/task';
import { PageSpinner } from '@/shared/ui/loading';

/**
 * Stub page for Web Manager task card grid.
 * Full UI (filters, cards, actions) — follow-up plan after tasks-api migration.
 */
export default function TasksListPage() {
  const { data, isLoading, isError, error } = useTaskListQuery({
    params: DEFAULT_TASKS_LIST_PARAMS,
  });

  if (isLoading && !data) {
    return <PageSpinner tip="Загрузка заданий…" />;
  }

  return (
    <div>
      <Typography.Title level={3}>Задания</Typography.Title>
      <Typography.Paragraph type="secondary">
        Заготовка Web Manager: список карточек через GET /api/v2/tasks/list?view=card.
        Полный UI будет реализован в отдельном плане.
      </Typography.Paragraph>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить список заданий"
          description={error?.message}
        />
      )}

      {data && (
        <Typography.Paragraph>
          Загружено заданий: {data.response.length} из {data.total_records}
        </Typography.Paragraph>
      )}
    </div>
  );
}
