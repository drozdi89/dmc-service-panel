import {
  resetPrintTemplateFormUiStore,
  usePrintTemplateFormUiStore,
} from '../model/printTemplateFormUiStore';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  EditOutlined: () => null,
}));

import { PrintTemplateCreateButton } from './PrintTemplateCreateButton';
import { PrintTemplateEditButton } from './PrintTemplateEditButton';

describe('PrintTemplateCreateButton', () => {
  beforeEach(() => {
    resetPrintTemplateFormUiStore();
  });

  it('dispatches openCreate with consumerId', () => {
    render(<PrintTemplateCreateButton consumerId="field-a" />);

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'create',
      consumerId: 'field-a',
    });
  });

  it('uses onClick override instead of store', () => {
    const onClick = vi.fn();
    render(<PrintTemplateCreateButton consumerId="field-a" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'none',
    });
  });
});

describe('PrintTemplateEditButton', () => {
  beforeEach(() => {
    resetPrintTemplateFormUiStore();
  });

  it('dispatches openEdit with templateId and consumerId', () => {
    render(
      <PrintTemplateEditButton templateId={42} consumerId="field-b" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Изменить' }));

    expect(usePrintTemplateFormUiStore.getState().dialog).toEqual({
      kind: 'edit',
      templateId: 42,
      consumerId: 'field-b',
    });
  });

  it('stays disabled without templateId', () => {
    render(<PrintTemplateEditButton consumerId="field-b" />);
    expect(screen.getByRole('button', { name: 'Изменить' })).toBeDisabled();
  });
});
