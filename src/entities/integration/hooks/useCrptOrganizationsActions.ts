import { ApiError } from '@/shared/api';
import { App } from 'antd';
import { useCallback } from 'react';
import { fetchCrptOrganization } from '../api/api';
import { normalizeCrptOrganization } from '../lib/crptOrganization';
import { INTEGRATION_MESSAGES } from '../model/messages';
import type { CrptOrganization } from '../model/types';
import { useDeleteCrptOrganizationMutation, useSaveCrptOrganizationMutation } from '../queries';

/** Callbacks for {@link useCrptOrganizationsActions}. */
export interface CrptOrganizationsActionsOptions {
  /** Called after a fully successful create / update (close the modal). */
  onSaved?: () => void;
}

/**
 * CRPT organizations: detail load for edit, save and delete with toasts.
 */
export function useCrptOrganizationsActions({ onSaved }: CrptOrganizationsActionsOptions = {}) {
  const { message } = App.useApp();
  const texts = INTEGRATION_MESSAGES.crptOrganizations;

  const saveMutation = useSaveCrptOrganizationMutation({
    onSuccess: ({ templateError }, { mode }) => {
      if (templateError) {
        const reason = templateError instanceof ApiError ? templateError.message : null;
        if (mode === 'edit') {
          message.error(reason ? texts.templateNotUpdated(reason) : texts.templateNotUpdatedRetry);
        } else {
          message.error(reason ? texts.templateNotCreated(reason) : texts.templateNotCreatedRetry);
        }
        return;
      }
      message.success(mode === 'edit' ? texts.updated : texts.created);
      onSaved?.();
    },
    onError: (error) => {
      message.error(error instanceof ApiError ? error.message : texts.saveFailed);
    },
  });

  const deleteMutation = useDeleteCrptOrganizationMutation({
    onSuccess: () => {
      message.success(texts.deleted);
    },
    onError: (error) => {
      message.error(error.message || texts.deleteFailed);
    },
  });

  const { mutate: saveMutate } = saveMutation;
  const { mutate: deleteMutate } = deleteMutation;

  /**
   * Loads organization detail for the edit modal; `null` on error or abort.
   */
  const loadForEdit = useCallback(
    async (inn: string, signal: AbortSignal): Promise<CrptOrganization | null> => {
      try {
        return await fetchCrptOrganization(inn, signal);
      } catch (error) {
        if (!signal.aborted) {
          message.error(error instanceof Error ? error.message : texts.loadFailed);
        }
        return null;
      }
    },
    [message, texts],
  );

  const save = useCallback(
    (mode: 'create' | 'edit', organization: CrptOrganization) =>
      saveMutate({ mode, organization: normalizeCrptOrganization(organization) }),
    [saveMutate],
  );

  const remove = useCallback((inn: string) => deleteMutate(inn), [deleteMutate]);

  return {
    loadForEdit,
    save,
    remove,
    isSaving: saveMutation.isPending,
    deletingInn: deleteMutation.isPending ? deleteMutation.variables : null,
  };
}
