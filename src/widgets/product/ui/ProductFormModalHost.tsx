import {
  isPersistProductError,
  isSameProductFormDialog,
  resetProductFormUiStore,
  useProductFormSave,
  useProductFormUiStore,
  type ProductFormSubmitValues,
} from '@/entities/product';
import { ProductFormModal } from '@/features/product-form';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { RESOURCE_FORM_SUBMIT_SAVE } from '@/shared/model/resourceFormUiBridge';
import { useCallback, useEffect, useRef } from 'react';


/**
 * App-level host for product create/edit.
 *
 * Subscribes to {@link useProductFormUiStore}, renders {@link ProductFormModal},
 * saves via {@link useProductFormSave} (invalidates list/lookup/detail), writes
 * `lastSaved` when `consumerId` is set, then closes on «Сохранить» or keeps open
 * on «Применить» (create → edit). Mount once in {@link import('@/App').AppProviders}.
 *
 * Orphan create/edit (no `consumerId`, e.g. ProductsPage) shows success toast;
 * nested picker saves stay silent. After await, `setLastSaved`/`close`/`openEdit`
 * run only if this Host mount is still alive (generation) and `dialog` still
 * matches the submitted snapshot. On unmount bumps generation and resets the store.
 */
export function ProductFormModalHost() {
  const dialog = useProductFormUiStore((state) => state.dialog);
  const close = useProductFormUiStore((state) => state.close);
  const setLastSaved = useProductFormUiStore((state) => state.setLastSaved);
  const mountGenerationRef = useRef(0);


  const showSuccessMessage =
    (dialog.kind === 'create' || dialog.kind === 'edit') &&
    dialog.consumerId == null;
  const { saveProduct, isPending } = useProductFormSave({ showSuccessMessage });


  const open = dialog.kind !== 'none';
  const mode = dialog.kind === 'edit' ? 'edit' : 'create';
  const gtin = dialog.kind === 'edit' ? dialog.gtin : undefined;


  useEffect(() => {
    return () => {
      mountGenerationRef.current += 1;
      resetProductFormUiStore();
    };
  }, []);


  const handleSubmit = useCallback(
    async (
      values: ProductFormSubmitValues,
      options: ResourceFormSubmitOptions = RESOURCE_FORM_SUBMIT_SAVE,
    ) => {
      const submittedGeneration = mountGenerationRef.current;
      const submitted = useProductFormUiStore.getState().dialog;
      if (submitted.kind === 'none') {
        return;
      }


      try {
        const editGtin = submitted.kind === 'edit' ? submitted.gtin : undefined;
        const saved = await saveProduct(values, editGtin);


        if (mountGenerationRef.current !== submittedGeneration) {
          return;
        }


        const current = useProductFormUiStore.getState().dialog;
        if (!isSameProductFormDialog(submitted, current)) {
          return;
        }


        if (submitted.consumerId) {
          setLastSaved({
            consumerId: submitted.consumerId,
            gtin: saved.gtin,
            name: saved.name,
          });
        }


        if (options.close) {
          close();
        } else if (submitted.kind === 'create') {
          useProductFormUiStore
            .getState()
            .openEdit(saved.gtin, submitted.consumerId);
        }
      } catch (error) {
        // Create step 1 may have succeeded; switch to edit so retry uses PATCH.
        if (
          submitted.kind === 'create' &&
          isPersistProductError(error) &&
          error.gtin &&
          mountGenerationRef.current === submittedGeneration
        ) {
          const current = useProductFormUiStore.getState().dialog;
          if (isSameProductFormDialog(submitted, current)) {
            useProductFormUiStore
              .getState()
              .openEdit(error.gtin, submitted.consumerId);
          }
        }
        // Errors are surfaced by useProductFormSave toast.
      }
    },
    [close, saveProduct, setLastSaved],
  );


  return (
    <ProductFormModal
      open={open}
      mode={mode}
      gtin={gtin}
      submitting={isPending}
      onCancel={close}
      onSubmit={(values, options) => {
        void handleSubmit(values, options);
      }}
    />
  );
}

