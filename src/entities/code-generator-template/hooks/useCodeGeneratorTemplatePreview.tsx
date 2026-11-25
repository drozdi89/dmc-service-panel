import { App, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { previewCodeGeneratorTemplate } from '../api/api';
import type { CodeGeneratorTemplatePreviewQuery } from '../model/types';

export type CodeGeneratorTemplatePreviewInput = Omit<
  CodeGeneratorTemplatePreviewQuery,
  'task_id'
> & {
  task_id?: number | null;
};

/**
 * Detects aborted/cancelled HTTP requests (AbortSignal / axios CanceledError).
 *
 * @param error - Caught rejection value.
 */
function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { name?: string; code?: string };
  return (
    candidate.name === 'AbortError' ||
    candidate.name === 'CanceledError' ||
    candidate.code === 'ERR_CANCELED'
  );
}

/**
 * Template preview via `POST …/{id}/preview` (never `/generate`): validates
 * `task_id`, shows the generated code in a modal and errors as toasts.
 * `cancel` aborts the in-flight request; aborted results are dropped silently.
 */
export function useCodeGeneratorTemplatePreview() {
  const { message, modal } = App.useApp();
  const abortRef = useRef<AbortController | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsPreviewing(false);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const preview = useCallback(
    async (templateId: number, input: CodeGeneratorTemplatePreviewInput) => {
      const taskId = input.task_id;
      if (taskId === undefined || taskId === null || taskId <= 0) {
        message.error('Укажите ID задания для проверки');
        return;
      }

      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      setIsPreviewing(true);

      try {
        const result = await previewCodeGeneratorTemplate(
          templateId,
          {
            task_id: taskId,
            aggregation_level: input.aggregation_level,
            weight: input.weight,
            package_size: input.package_size,
            aggregate_number: input.aggregate_number,
            factory_number: input.factory_number,
            cell: input.cell,
          },
          abortController.signal,
        );

        if (abortController.signal.aborted) {
          return;
        }

        modal.info({
          title: 'Результат проверки',
          width: 560,
          style: { top: '1rem' },
          content: (
            <div>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                Сгенерированный код (счётчики БД не изменялись):
              </Typography.Paragraph>
              <Typography.Paragraph
                copyable
                code
                style={{ marginBottom: 0, wordBreak: 'break-all' }}
              >
                {result.code}
              </Typography.Paragraph>
            </div>
          ),
        });
      } catch (error) {
        if (abortController.signal.aborted || isAbortError(error)) {
          return;
        }
        message.error(
          error instanceof Error ? error.message : 'Не удалось проверить шаблон',
        );
      } finally {
        if (abortRef.current === abortController) {
          abortRef.current = null;
          setIsPreviewing(false);
        }
      }
    },
    [message, modal],
  );

  return { preview, cancel, isPreviewing };
}
