# FSD scaffold — reference

## Эталоны в репозитории

| Сценарий | Смотреть |
|----------|----------|
| Простой CRUD + Host | `widgets/print-station`, `entities/print-station` |
| factoryMutation | `entities/print-template/queries/print-template-mutations.ts` |
| Модалка с табами + visibility | `features/product-form` + `ProductFormModalTabs` |
| useWatch под Form | `features/print-station-form/ui/PrintStationFormFields.tsx` |
| Сложная форма (линия) | `features/line-editor`, `services/line-service` |

## FormModal (feature) — скелет

```tsx
export function ExampleFormModal({ open, onCancel, onSubmit, submitting }: Props) {
  const [form] = Form.useForm<Example>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(createDefaults());
  }, [open, form]);

  return (
    <Modal open={open} destroyOnHidden={false} onCancel={onCancel} …>
      <Form form={form} layout="vertical">
        <ExampleFormBody />
      </Form>
    </Modal>
  );
}

function ExampleFormBody() {
  const form = Form.useFormInstance<Example>();
  const name = Form.useWatch('name', form);
  …
}
```

## FormModalHost (widget) — скелет

```tsx
export function ExampleFormModalHost() {
  const dialog = useExampleFormUiStore((s) => s.dialog);
  const { save, isPending } = useExampleFormSave();
  const open = dialog.kind !== 'none';

  return (
    <ExampleFormModal
      open={open}
      mode={dialog.kind === 'edit' ? 'edit' : 'create'}
      submitting={isPending}
      onCancel={…}
      onSubmit={(values, options) => void save(values, options)}
    />
  );
}
```

Подключение: `import { ExampleFormModalHost } from '@/widgets/example'` в `AppProviders`.

## Entity mutation

```ts
export const exampleFactory = factoryMutation({
  keys: exampleQueryKeys,
  fetchCreate: createExample,
  fetchUpdate: updateExample,
  fetchDelete: deleteExample,
  normalizeId: (item) => item.id,
});
```

Тосты — в `hooks/useExampleActions.ts`, не в `queries/*-mutations.ts`.