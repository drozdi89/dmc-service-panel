import { App } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { MES_SYNC_MESSAGES } from '../model/messages';
import type {
  CreateMesSyncBindingPayload,
  MesSyncBindingCreated,
  UpdateMesSyncBindingLinesPayload,
} from '../model/types';
import {
  useCreateMesSyncBindingMutation,
  useMesSyncServerQuery,
  useRevokeMesSyncBindingMutation,
  useRotateMesSyncBindingMutation,
  useUpdateMesSyncBindingLinesMutation,
  useUpdateMesSyncServerMutation,
} from '../queries';

/**
 * Ensures durable server_node_id exists (Qt ensure_server_node_id parity).
 * Runs once when GET returns empty.
 */
export function useEnsureMesSyncServerNodeId() {
  const { message } = App.useApp();
  const serverQuery = useMesSyncServerQuery();
  const ensureMutation = useUpdateMesSyncServerMutation({
    onSuccess: () => {
      message.success(MES_SYNC_MESSAGES.serverEnsured);
    },
    onError: (error) => {
      message.error(error.message);
    },
  });
  const { mutate } = ensureMutation;
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!serverQuery.isSuccess || attemptedRef.current || ensureMutation.isPending) {
      return;
    }
    const existing = serverQuery.data.server_node_id?.trim();
    if (existing) {
      return;
    }
    attemptedRef.current = true;
    mutate(crypto.randomUUID());
  }, [
    ensureMutation.isPending,
    mutate,
    serverQuery.data?.server_node_id,
    serverQuery.isSuccess,
  ]);

  return {
    serverNodeId: serverQuery.data?.server_node_id ?? null,
    isLoading: serverQuery.isLoading || ensureMutation.isPending,
    error: serverQuery.error,
  };
}

/** Binding CRUD actions with toasts and revoke confirm. */
export function useMesSyncBindingActions() {
  const { message, modal } = App.useApp();
  const showError = (error: Error) => message.error(error.message);

  const createMutation = useCreateMesSyncBindingMutation({
    onError: showError,
  });
  const updateLinesMutation = useUpdateMesSyncBindingLinesMutation({
    onSuccess: () => {
      message.success(MES_SYNC_MESSAGES.bindingUpdated);
    },
    onError: showError,
  });
  const revokeMutation = useRevokeMesSyncBindingMutation({
    onSuccess: () => {
      message.success(MES_SYNC_MESSAGES.bindingRevoked);
    },
    onError: showError,
  });
  const rotateMutation = useRotateMesSyncBindingMutation({
    onError: showError,
  });

  const createBinding = useCallback(
    async (payload: CreateMesSyncBindingPayload): Promise<MesSyncBindingCreated | null> => {
      try {
        const created = await createMutation.mutateAsync(payload);
        message.success(MES_SYNC_MESSAGES.bindingCreated);
        return created;
      } catch {
        return null;
      }
    },
    [createMutation, message],
  );

  const updateLines = useCallback(
    (bindingId: string, payload: UpdateMesSyncBindingLinesPayload) => {
      updateLinesMutation.mutate({ bindingId, payload });
    },
    [updateLinesMutation],
  );

  const rotateBinding = useCallback(
    async (bindingId: string): Promise<MesSyncBindingCreated | null> => {
      try {
        const rotated = await rotateMutation.mutateAsync(bindingId);
        message.success(MES_SYNC_MESSAGES.bindingRotated);
        return rotated;
      } catch {
        return null;
      }
    },
    [message, rotateMutation],
  );

  const confirmRevoke = useCallback(
    (bindingId: string, label: string) => {
      modal.confirm({
        title: MES_SYNC_MESSAGES.revokeConfirmTitle,
        content: `${MES_SYNC_MESSAGES.revokeConfirmContent} (${label})`,
        okText: MES_SYNC_MESSAGES.revokeOk,
        okButtonProps: { danger: true },
        cancelText: 'Отмена',
        onOk: () => revokeMutation.mutateAsync(bindingId),
      });
    },
    [modal, revokeMutation],
  );

  const copyToken = useCallback(
    async (token: string) => {
      try {
        await navigator.clipboard.writeText(token);
        message.success(MES_SYNC_MESSAGES.tokenCopied);
      } catch {
        message.error(MES_SYNC_MESSAGES.copyFailed);
      }
    },
    [message],
  );

  return {
    createBinding,
    updateLines,
    rotateBinding,
    confirmRevoke,
    copyToken,
    isCreating: createMutation.isPending,
    isUpdatingLines: updateLinesMutation.isPending,
    isRotating: rotateMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}
