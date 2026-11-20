import {
  isSamePrintTemplateFormDialog,
  usePrintTemplateActions,
  resetPrintTemplateFormUiStore,
  usePrintTemplateFormUiStore,
  type PrintTemplate,
} from '@/entities/print-template';
import { TemplateFormModal } from '@/features/template-form';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { RESOURCE_FORM_SUBMIT_SAVE } from '@/shared/model/resourceFormUiBridge';
import { useCallback, useEffect, useRef } from 'react';


/**
 * App-level host for print-template create/edit.
 *
 * Subscribes to {@link usePrintTemplateFormUiStore}, renders
 * {@link TemplateFormModal}, saves via {@link usePrintTemplateActions}
 * (invalidates list/lookup), writes `lastSaved` when `consumerId` is set,
 * then closes on «Сохранить» or keeps open on «Применить» (create → edit).
 * Mount once in {@link import('@/App').AppProviders}.
 *
 * Orphan create (no `consumerId`) skips `lastSaved` so Select fields stay intact.
 * After await, `setLastSaved`/`close`/`openEdit` run only if this Host mount is
 * still alive (generation) and `dialog` still matches the submitted snapshot.
 * On unmount bumps generation and resets the store.
 */
export function TemplateFormModalHost() {
  const dialog = usePrintTemplateFormUiStore((state) => state.dialog);
  const close = usePrintTemplateFormUiStore((state) => state.close);
  const setLastSaved = usePrintTemplateFormUiStore((state) => state.setLastSaved);
  const mountGenerationRef = useRef(0);


  const { createMutation, updateMutation, isSavePending } = usePrintTemplateActions();


  const open = dialog.kind !== 'none';
  const mode = dialog.kind === 'edit' ? 'edit' : 'create';
  const templateId = dialog.kind === 'edit' ? dialog.templateId : undefined;


  useEffect(() => {
    return () => {
      mountGenerationRef.current += 1;
      resetPrintTemplateFormUiStore();
    };
  }, []);


  const handleSubmit = useCallback(
    async (
      values: PrintTemplate,
      options: ResourceFormSubmitOptions = RESOURCE_FORM_SUBMIT_SAVE,
    ) => {
      const submittedGeneration = mountGenerationRef.current;
      const submitted = usePrintTemplateFormUiStore.getState().dialog;
      if (submitted.kind === 'none') {
        return;
      }


      try {
        let saved: PrintTemplate;


        if (submitted.kind === 'edit') {
          saved = await updateMutation.mutateAsync({
            id: submitted.templateId,
            name: values.name,
            template: values.template ?? null,
          });
        } else {
          saved = await createMutation.mutateAsync({
            name: values.name,
            template: values.template ?? '',
          });
        }


        if (mountGenerationRef.current !== submittedGeneration) {
          return;
        }


        const current = usePrintTemplateFormUiStore.getState().dialog;
        if (!isSamePrintTemplateFormDialog(submitted, current)) {
          return;
        }


        if (submitted.consumerId) {
          setLastSaved({
            consumerId: submitted.consumerId,
            id: saved.id,
            name: saved.name,
          });
        }


        if (options.close) {
          close();
        } else if (submitted.kind === 'create') {
          usePrintTemplateFormUiStore
            .getState()
            .openEdit(saved.id, submitted.consumerId);
        }
      } catch {
        // Errors are surfaced by usePrintTemplateActions save handlers.
      }
    },
    [close, createMutation, updateMutation, setLastSaved],
  );


  return (
    <TemplateFormModal
      open={open}
      mode={mode}
      templateId={templateId}
      submitting={isSavePending}
      onCancel={close}
      onSubmit={(values, options) => {
        void handleSubmit(values, options);
      }}
    />
  );
}

