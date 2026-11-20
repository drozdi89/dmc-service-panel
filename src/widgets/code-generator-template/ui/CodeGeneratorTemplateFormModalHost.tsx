import {
  CODE_GENERATOR_TEMPLATES_PATH,
  useCodeGeneratorTemplateActions,
  isSameCodeGeneratorTemplateFormDialog,
  resetCodeGeneratorTemplateFormUiStore,
  useCodeGeneratorTemplateFormUiStore,
  type CodeGeneratorTemplate,
} from '@/entities/code-generator-template';
import { CodeGeneratorTemplateFormModal } from '@/features/code-generator-template-form';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { RESOURCE_FORM_SUBMIT_SAVE } from '@/shared/model/resourceFormUiBridge';
import { useCallback, useEffect, useRef } from 'react';


/**
 * App-level host for code-generator-template create/edit.
 *
 * Subscribes to {@link useCodeGeneratorTemplateFormUiStore}, renders
 * {@link CodeGeneratorTemplateFormModal} with preferred `mode` + `templateId`
 * (modal self-loads detail), saves via {@link useCodeGeneratorTemplateActions},
 * writes `lastSaved` when `consumerId` is set, then closes on «Сохранить» or
 * keeps open on «Применить» (create → edit). Mount once in `AppProviders`.
 *
 * Orphan create (no `consumerId`) skips `lastSaved`.
 * After await, `setLastSaved`/`close`/`openEdit` run only if this Host mount is
 * still alive (generation) and `dialog` still matches the submitted snapshot.
 * On unmount bumps generation and resets the store.
 */
export function CodeGeneratorTemplateFormModalHost() {
  const dialog = useCodeGeneratorTemplateFormUiStore((state) => state.dialog);
  const close = useCodeGeneratorTemplateFormUiStore((state) => state.close);
  const setLastSaved = useCodeGeneratorTemplateFormUiStore(
    (state) => state.setLastSaved,
  );
  const mountGenerationRef = useRef(0);


  const { saveMutation } = useCodeGeneratorTemplateActions();


  const open = dialog.kind !== 'none';
  const mode = dialog.kind === 'edit' ? 'edit' : 'create';
  const templateId = dialog.kind === 'edit' ? dialog.templateId : undefined;


  useEffect(() => {
    return () => {
      mountGenerationRef.current += 1;
      resetCodeGeneratorTemplateFormUiStore();
    };
  }, []);


  const handleSubmit = useCallback(
    async (
      values: CodeGeneratorTemplate,
      options: ResourceFormSubmitOptions = RESOURCE_FORM_SUBMIT_SAVE,
    ) => {
      const submittedGeneration = mountGenerationRef.current;
      const submitted = useCodeGeneratorTemplateFormUiStore.getState().dialog;
      if (submitted.kind === 'none') {
        return;
      }


      try {
        let saved: CodeGeneratorTemplate;


        if (submitted.kind === 'edit') {
          saved = await saveMutation.mutateAsync({
            path: `${CODE_GENERATOR_TEMPLATES_PATH}${submitted.templateId}`,
            method: 'PATCH',
            body: {
              name: values.name,
              description: values.description,
              template: values.template,
              counter_config: values.counter_config,
              validation_regex: values.validation_regex,
            },
          });
        } else {
          saved = await saveMutation.mutateAsync({
            path: CODE_GENERATOR_TEMPLATES_PATH,
            method: 'POST',
            body: {
              name: values.name,
              description: values.description,
              template: values.template,
              counter_config: values.counter_config,
              validation_regex: values.validation_regex,
            },
          });
        }


        if (mountGenerationRef.current !== submittedGeneration) {
          return;
        }


        const current = useCodeGeneratorTemplateFormUiStore.getState().dialog;
        if (!isSameCodeGeneratorTemplateFormDialog(submitted, current)) {
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
          useCodeGeneratorTemplateFormUiStore
            .getState()
            .openEdit(saved.id, submitted.consumerId);
        }
      } catch {
        // Errors are surfaced by codeGeneratorTemplateMutations.onError.
      }
    },
    [close, saveMutation, setLastSaved],
  );


  return (
    <CodeGeneratorTemplateFormModal
      open={open}
      mode={mode}
      templateId={templateId}
      submitting={saveMutation.isPending}
      onCancel={close}
      onSubmit={(values, options) => {
        void handleSubmit(values, options);
      }}
    />
  );
}

