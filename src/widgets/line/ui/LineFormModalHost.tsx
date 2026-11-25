import {
  isSameLineFormDialog,
  resetLineFormUiStore,
  useLineFormUiStore,
  useLinePrintedDmRawQuery,
  type LineEditorFormState,
} from '@/entities/line';
import { LineFormModal, type LineFormSubmitContext } from '@/features/line-editor';
import { useSaveLineConfigurationMutation } from '@/services/line-service';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { RESOURCE_FORM_SUBMIT_SAVE } from '@/shared/model/resourceFormUiBridge';
import { App } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';


/**
 * App-level host for production-line create/edit.
 *
 * Subscribes to {@link useLineFormUiStore}, renders {@link LineFormModal},
 * saves via {@link useSaveLineConfigurationMutation} (invalidates line queries),
 * writes `lastSaved` when `consumerId` is set,
 * then closes on «Сохранить» or keeps open on «Применить» (create → edit).
 * Mount once in {@link import('@/App').AppProviders}.
 *
 * Orphan create/edit (no `consumerId`, e.g. LinesListPage) shows success toast;
 * nested picker saves stay silent. After a successful save, line queries are
 * invalidated immediately; `setLastSaved`/`close`/`openEdit`/toast run only if
 * this Host mount is still alive (generation) and `dialog` still matches the
 * submitted snapshot. On unmount bumps generation and resets the store.
 */
export function LineFormModalHost() {
  const { message } = App.useApp();
  const { mutateAsync: saveLine } = useSaveLineConfigurationMutation();
  const dialog = useLineFormUiStore((state) => state.dialog);
  const close = useLineFormUiStore((state) => state.close);
  const setLastSaved = useLineFormUiStore((state) => state.setLastSaved);
  const mountGenerationRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);


  const printedDmQuery = useLinePrintedDmRawQuery();
  const printedDmRaw = printedDmQuery.data ?? null;


  const open = dialog.kind !== 'none';
  const mode = dialog.kind === 'edit' ? 'edit' : 'create';
  const lineId = dialog.kind === 'edit' ? dialog.lineId : undefined;


  useEffect(() => {
    return () => {
      mountGenerationRef.current += 1;
      resetLineFormUiStore();
    };
  }, []);


  const handleSubmit = useCallback(
    async (
      values: LineEditorFormState,
      options: ResourceFormSubmitOptions = RESOURCE_FORM_SUBMIT_SAVE,
      { deletedAggregationLevelIds }: LineFormSubmitContext = {
        deletedAggregationLevelIds: [],
      },
    ) => {
      const submittedGeneration = mountGenerationRef.current;
      const submitted = useLineFormUiStore.getState().dialog;
      if (submitted.kind === 'none') {
        return;
      }


      setSubmitting(true);
      try {
        const editLineId =
          submitted.kind === 'edit' ? submitted.lineId : undefined;
        const result = await saveLine({
          state: values,
          lineId: editLineId,
          deletedAggregationLevelIds,
          printedDmRaw,
        });

        if (mountGenerationRef.current !== submittedGeneration) {
          return;
        }


        const current = useLineFormUiStore.getState().dialog;
        if (!isSameLineFormDialog(submitted, current)) {
          return;
        }


        if (submitted.consumerId) {
          setLastSaved({
            consumerId: submitted.consumerId,
            id: result.lineId,
            name: values.linename,
          });
        } else {
          message.success('Линия сохранена');
        }


        if (options.close) {
          close();
        } else if (submitted.kind === 'create') {
          useLineFormUiStore
            .getState()
            .openEdit(result.lineId, submitted.consumerId);
        }
      } catch (saveError) {
        message.error(
          saveError instanceof Error
            ? saveError.message
            : 'Ошибка сохранения',
        );
      } finally {
        if (mountGenerationRef.current === submittedGeneration) {
          setSubmitting(false);
        }
      }
    },
    [close, message, printedDmRaw, saveLine, setLastSaved],
  );


  return (
    <LineFormModal
      open={open}
      mode={mode}
      lineId={lineId}
      submitting={submitting}
      onCancel={close}
      onSubmit={(values, options, context) => {
        void handleSubmit(values, options, context);
      }}
    />
  );
}

