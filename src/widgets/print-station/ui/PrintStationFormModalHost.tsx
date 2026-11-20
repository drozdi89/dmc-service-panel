import {
  isSamePrintStationFormDialog,
  mapFormValuesToCreatePayload,
  mapFormValuesToUpdatePayload,
  printStationMutations,
  resetPrintStationFormUiStore,
  usePrintStationFormUiStore,
  type CreatePrintStationPayload,
  type PrintStation,
} from '@/entities/print-station';
import { PrintStationFormModal } from '@/features/print-station-form';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { RESOURCE_FORM_SUBMIT_SAVE } from '@/shared/model/resourceFormUiBridge';
import { useCallback, useEffect, useRef } from 'react';


/**
 * App-level host for print-station create/edit.
 *
 * Subscribes to {@link usePrintStationFormUiStore}, renders
 * {@link PrintStationFormModal}, saves via {@link printStationMutations}
 * (invalidates list/lookup), writes `lastSaved` when `consumerId` is set,
 * then closes on «Сохранить» or keeps open on «Применить» (create → edit).
 * Mount once in {@link AppProviders}.
 *
 * Orphan create (no `consumerId`) skips `lastSaved` so Select fields stay intact.
 * After await, `setLastSaved`/`close`/`openEdit` run only if this Host mount is
 * still alive (generation) and `dialog` still matches the submitted snapshot.
 * On unmount bumps generation and resets the store.
 */
export function PrintStationFormModalHost() {
  const dialog = usePrintStationFormUiStore((state) => state.dialog);
  const close = usePrintStationFormUiStore((state) => state.close);
  const setLastSaved = usePrintStationFormUiStore((state) => state.setLastSaved);
  const mountGenerationRef = useRef(0);


  const { saveMutation } = printStationMutations();


  const open = dialog.kind !== 'none';
  const mode = dialog.kind === 'edit' ? 'edit' : 'create';
  const stationId = dialog.kind === 'edit' ? dialog.stationId : undefined;


  useEffect(() => {
    return () => {
      mountGenerationRef.current += 1;
      resetPrintStationFormUiStore();
    };
  }, []);


  const handleSubmit = useCallback(
    async (
      values: CreatePrintStationPayload,
      options: ResourceFormSubmitOptions = RESOURCE_FORM_SUBMIT_SAVE,
    ) => {
      const submittedGeneration = mountGenerationRef.current;
      const submitted = usePrintStationFormUiStore.getState().dialog;
      if (submitted.kind === 'none') {
        return;
      }


      try {
        let saved: PrintStation;


        if (submitted.kind === 'edit') {
          saved = await saveMutation.mutateAsync({
            path: `/api/v2/print_stations/${submitted.stationId}`,
            method: 'PATCH',
            body: mapFormValuesToUpdatePayload(values),
          });
        } else {
          saved = await saveMutation.mutateAsync({
            path: '/api/v2/print_stations/',
            method: 'POST',
            body: mapFormValuesToCreatePayload(values),
          });
        }


        if (mountGenerationRef.current !== submittedGeneration) {
          return;
        }


        const current = usePrintStationFormUiStore.getState().dialog;
        if (!isSamePrintStationFormDialog(submitted, current)) {
          return;
        }


        if (submitted.consumerId) {
          setLastSaved({
            consumerId: submitted.consumerId,
            id: saved.station_id,
            name: saved.name,
          });
        }


        if (options.close) {
          close();
        } else if (submitted.kind === 'create') {
          usePrintStationFormUiStore
            .getState()
            .openEdit(saved.station_id, submitted.consumerId);
        }
      } catch {
        // Errors are surfaced by printStationMutations.onError.
      }
    },
    [close, saveMutation, setLastSaved],
  );


  return (
    <PrintStationFormModal
      open={open}
      mode={mode}
      stationId={stationId}
      submitting={saveMutation.isPending}
      onCancel={close}
      onSubmit={(values, options) => {
        void handleSubmit(values, options);
      }}
    />
  );
}

