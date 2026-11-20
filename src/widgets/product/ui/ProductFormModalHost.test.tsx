import type { Product, ProductFormSubmitValues } from '@/entities/product';

const emptyRemoved = {
  aggregates_removed: [],
  certificates_removed: [],
  licences_removed: [],
  controller_params_removed: [],
  articles_removed: [],
} as const;
import {
  PersistProductError,
  resetProductFormUiStore,
  useProductFormUiStore,
} from '@/entities/product';
import type { ProductFormModalProps } from '@/features/product-form';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveProduct } = vi.hoisted(() => ({ saveProduct: vi.fn() }));

vi.mock('@/entities/product', async () => {
  const store = await import('@/entities/product/model/productFormUiStore');
  const persist = await import('@/entities/product/queries/product-persist');
  return {
    ...store,
    PersistProductError: persist.PersistProductError,
    isPersistProductError: persist.isPersistProductError,
    useProductFormSave: () => ({
      saveProduct,
      isPending: false,
    }),
  };
});

vi.mock('@/features/product-form', () => ({
  ProductFormModal: ({ open, onSubmit, onCancel }: ProductFormModalProps) =>
    open ? (
      <div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                ...emptyRemoved,
                gtin: '4601234567890',
                name: 'Saved',
              } as ProductFormSubmitValues,
              { close: true },
            )
          }
        >
          submit
        </button>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                ...emptyRemoved,
                gtin: '4601234567890',
                name: 'Saved',
              } as ProductFormSubmitValues,
              { close: false },
            )
          }
        >
          apply
        </button>
        <button type="button" onClick={onCancel}>
          cancel
        </button>
      </div>
    ) : null,
}));

import { ProductFormModalHost } from './ProductFormModalHost';

const savedProduct = {
  gtin: '4601234567890',
  name: 'Saved',
} as Product;

describe('ProductFormModalHost', () => {
  beforeEach(() => {
    resetProductFormUiStore();
    saveProduct.mockReset();
  });

  it('sets lastSaved and closes when dialog still matches after save', async () => {
    saveProduct.mockResolvedValue(savedProduct);
    useProductFormUiStore.getState().openCreate('field-a');

    render(<ProductFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const state = useProductFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        gtin: '4601234567890',
        name: 'Saved',
      });
    });
  });

  it('keeps dialog open and switches create to edit on apply', async () => {
    saveProduct.mockResolvedValue(savedProduct);
    useProductFormUiStore.getState().openCreate('field-a');

    render(<ProductFormModalHost />);
    screen.getByRole('button', { name: 'apply' }).click();

    await waitFor(() => {
      const state = useProductFormUiStore.getState();
      expect(state.dialog).toEqual({
        kind: 'edit',
        gtin: '4601234567890',
        consumerId: 'field-a',
      });
      expect(state.lastSaved).toEqual({
        consumerId: 'field-a',
        gtin: '4601234567890',
        name: 'Saved',
      });
    });
  });

  it('switches create dialog to edit when PersistProductError carries gtin', async () => {
    saveProduct.mockRejectedValue(
      new PersistProductError('nested failed', '4601234567890'),
    );
    useProductFormUiStore.getState().openCreate('field-a');

    render(<ProductFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      const state = useProductFormUiStore.getState();
      expect(state.dialog).toEqual({
        kind: 'edit',
        gtin: '4601234567890',
        consumerId: 'field-a',
      });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('does not close or set lastSaved when dialog changed mid-save', async () => {
    let resolveSave!: (value: Product) => void;
    saveProduct.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useProductFormUiStore.getState().openCreate('field-a');
    render(<ProductFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveProduct).toHaveBeenCalled();
    });

    act(() => {
      useProductFormUiStore.getState().close();
      useProductFormUiStore.getState().openCreate('field-b');
    });

    await act(async () => {
      resolveSave(savedProduct);
    });

    await waitFor(() => {
      const state = useProductFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-b' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('skips lastSaved when dialog was closed mid-save', async () => {
    let resolveSave!: (value: Product) => void;
    saveProduct.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useProductFormUiStore.getState().openCreate('field-a');
    render(<ProductFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveProduct).toHaveBeenCalled();
    });

    act(() => {
      useProductFormUiStore.getState().close();
    });

    await act(async () => {
      resolveSave(savedProduct);
    });

    await waitFor(() => {
      const state = useProductFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'none' });
      expect(state.lastSaved).toBeNull();
    });
  });

  it('resets store on unmount so a stale dialog does not reopen', () => {
    useProductFormUiStore.getState().openCreate('field-a');
    useProductFormUiStore.getState().setLastSaved({
      consumerId: 'field-a',
      gtin: '4600000000000',
      name: 'Stale',
    });

    const { unmount } = render(<ProductFormModalHost />);
    unmount();

    const state = useProductFormUiStore.getState();
    expect(state.dialog).toEqual({ kind: 'none' });
    expect(state.lastSaved).toBeNull();
  });

  it('does not apply stale save after unmount when a matching dialog reopens', async () => {
    let resolveSave!: (value: Product) => void;
    saveProduct.mockImplementation(
      () =>
        new Promise<Product>((resolve) => {
          resolveSave = resolve;
        }),
    );

    useProductFormUiStore.getState().openCreate('field-a');
    const { unmount } = render(<ProductFormModalHost />);
    screen.getByRole('button', { name: 'submit' }).click();

    await waitFor(() => {
      expect(saveProduct).toHaveBeenCalled();
    });

    unmount();

    act(() => {
      useProductFormUiStore.getState().openCreate('field-a');
    });

    await act(async () => {
      resolveSave(savedProduct);
    });

    await waitFor(() => {
      const state = useProductFormUiStore.getState();
      expect(state.dialog).toEqual({ kind: 'create', consumerId: 'field-a' });
      expect(state.lastSaved).toBeNull();
    });
  });
});
