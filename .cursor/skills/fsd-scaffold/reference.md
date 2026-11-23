# FSD scaffold — reference

## Эталоны в репозитории

| Сценарий | Смотреть |
|----------|----------|
| Простой CRUD + Host | `widgets/print-station`, `entities/print-station` |
| factoryQuery + factoryMutation (merged) | `entities/print-template/queries/print-template-queries.ts` |
| Модалка с табами + visibility | `features/product-form` + `ProductFormModalTabs` |
| useWatch под Form | `features/print-station-form/ui/PrintStationFormFields.tsx` |
| Сложная форма (линия) | `features/line-editor`, `services/line-service` |
| CRUD Host + list delete | один `use*Actions` (device: `saveDevice` + `showSuccessMessage`; product: `useProductFormSave` + persist) |
| После create/update | `factoryMutation`: `setQueryData(detail)` из ответа, invalidate только list/lookup — не `keys.all()` при открытой detail-модалке |

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

## Entity queries (read + CRUD)

```ts
export const EXAMPLE_QUERY_ENTRY = ['examples'] as const;

const queryApi = factoryQuery({ entry: EXAMPLE_QUERY_ENTRY, … });
const mutationApi = factoryMutation({ entry: EXAMPLE_QUERY_ENTRY, … });

export const exampleQueries = { ...queryApi, ...mutationApi };
```

Один файл в `entities/<name>/queries/` (или доменный файл + `keys.ts` для integration/parameters).
Тосты — в `hooks/use*Actions.ts`; `useInvalidatingMutation` — рядом с queries той же сущности (device, integration).