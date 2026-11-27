import {
  codeGeneratorTemplateQueries,
  useCodeGeneratorTemplatePreview,
  type CodeGeneratorTemplate,
} from '@/entities/code-generator-template';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { ButtonLoading, LoadingOverlay } from '@/shared/ui/loading';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
} from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  createDefaultFormValues,
  createDefaultPreviewFormValues,
  selectFormData,
} from '../model/defaults';
import { CodeGeneratorTemplateHelpContent } from '../model/helpContent';
import type {
  CodeGeneratorTemplateFormModalProps,
  CodeGeneratorTemplatePreviewFormValues,
} from '../model/types';
import {
  normalizeCounterConfig,
  validateCodeGeneratorTemplateForm,
} from '../model/validation';
import { CounterConfigList } from './CounterConfigList';
import { CounterStatusTable } from './CounterStatusTable';
import { VariablesCatalogModal } from './VariablesCatalogModal';

/**
 * Inserts `{name}` at the textarea cursor (or appends when selection is unknown).
 *
 * @param textAreaRef - Ant Design TextAreaRef of the template TextArea.
 * @param current - Current template string.
 * @param variableName - Placeholder name without braces.
 */
function insertPlaceholderAtCursor(
  textAreaRef: TextAreaRef | null,
  current: string,
  variableName: string,
): string {
  const placeholder = `{${variableName}}`;
  const el = textAreaRef?.resizableTextArea?.textArea ?? null;
  if (!el || typeof el.selectionStart !== 'number') {
    return `${current}${placeholder}`;
  }
  const start = el.selectionStart;
  const end = el.selectionEnd ?? start;
  const next = `${current.slice(0, start)}${placeholder}${current.slice(end)}`;
  const caret = start + placeholder.length;
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(caret, caret);
  });
  return next;
}

/** Lifts the persisted template `id` from the form to the modal state. */
function TemplateIdWatch({
  onTemplateIdChange,
}: {
  onTemplateIdChange: (id: number | undefined) => void;
}) {
  const watchedId = Form.useWatch('id', Form.useFormInstance<CodeGeneratorTemplate>());

  useEffect(() => {
    onTemplateIdChange(
      typeof watchedId === 'number' && watchedId > 0 ? watchedId : undefined,
    );
  }, [onTemplateIdChange, watchedId]);

  return null;
}

function CounterStatusSection() {
  const form = Form.useFormInstance<CodeGeneratorTemplate>();
  const counterConfig = Form.useWatch('counter_config', form);
  const counters = Form.useWatch('counters', form);
  return <CounterStatusTable counterConfig={counterConfig} counters={counters} />;
}

/**
 * Modal form for code generator template create/edit.
 *
 * Preferred contract: `mode` + `templateId` — edit self-loads detail via
 * {@link codeGeneratorTemplateQueries.useDetailQuery}. Legacy callers may pass
 * `initialValues` + `loading` without `mode`.
 *
 * Preview uses `POST …/{id}/preview` only (never `/generate`). Requires a
 * persisted template `id` and a real `task_id`.
 * System templates stay read-only (footer «Закрыть», form disabled).
 */
export function CodeGeneratorTemplateFormModal({
  open,
  title,
  mode,
  templateId: templateIdProp,
  initialValues,
  loading: externalLoading = false,
  submitting = false,
  onCancel,
  onSubmit,
}: CodeGeneratorTemplateFormModalProps) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<CodeGeneratorTemplate>();
  const [previewForm] = Form.useForm<CodeGeneratorTemplatePreviewFormValues>();
  const templateRef = useRef<TextAreaRef>(null);
  const [variablesOpen, setVariablesOpen] = useState(false);
  const {
    preview,
    cancel: cancelPreview,
    isPreviewing: previewing,
  } = useCodeGeneratorTemplatePreview();

  const resolvedMode: 'create' | 'edit' =
    mode ??
    (templateIdProp != null || initialValues?.id != null ? 'edit' : 'create');

  const resolvedTemplateId =
    templateIdProp ??
    (typeof initialValues?.id === 'number' ? initialValues.id : undefined);

  /** Self-load detail only when caller opted into the preferred `mode` contract. */
  const canLoad =
    open && mode === 'edit' && resolvedTemplateId !== undefined;

  const {
    data: loadedTemplate,
    isLoading: isLoadingTemplate,
    isError: isLoadError,
  } = codeGeneratorTemplateQueries.useDetailQuery(resolvedTemplateId ?? 0, {
    enabled: canLoad,
  });

  const mappedFromInitial = useMemo(
    () =>
      initialValues
        ? selectFormData(initialValues)
        : createDefaultFormValues(),
    [initialValues],
  );

  const mappedFromLoaded = useMemo(
    () =>
      loadedTemplate ? selectFormData(loadedTemplate) : undefined,
    [loadedTemplate],
  );

  const formSource = canLoad ? mappedFromLoaded : mappedFromInitial;

  const readOnly = Boolean(
    canLoad
      ? loadedTemplate?.is_system
      : formSource?.is_system ?? initialValues?.is_system,
  );

  const [watchedTemplateId, setWatchedTemplateId] = useState<number | undefined>(
    undefined,
  );
  const templateId =
    watchedTemplateId !== undefined
      ? watchedTemplateId
      : typeof formSource?.id === 'number' && formSource.id > 0
        ? formSource.id
        : resolvedTemplateId !== undefined && resolvedTemplateId > 0
          ? resolvedTemplateId
          : undefined;
  const canPreview = templateId !== undefined;

  const overlayLoading = canLoad ? isLoadingTemplate : externalLoading;

  const submitDisabled =
    submitting ||
    (canLoad && (isLoadingTemplate || isLoadError || !loadedTemplate)) ||
    (!canLoad && mode === undefined && externalLoading);

  const resolvedTitle =
    title ??
    (resolvedMode === 'edit' ? 'Изменение шаблона' : 'Новый шаблон');

  const handleCancel = useCallback(() => {
    cancelPreview();
    onCancel();
  }, [cancelPreview, onCancel]);

  useEffect(() => {
    if (!open) {
      setWatchedTemplateId(undefined);
      setVariablesOpen(false);
      cancelPreview();
      return;
    }

    if (canLoad) {
      if (mappedFromLoaded) {
        form.setFieldsValue(mappedFromLoaded);
      }
      return;
    }

    form.setFieldsValue(mappedFromInitial);
  }, [
    canLoad,
    cancelPreview,
    form,
    mappedFromInitial,
    mappedFromLoaded,
    open,
    previewForm,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }
    previewForm.setFieldsValue(createDefaultPreviewFormValues());
  }, [open, previewForm]);

  const showHelp = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      modal.info({
        title: 'Справка по шаблонам генератора кодов',
        width: 640,
        scrollLock: false,
        style: { top: '1rem' },
        styles: {
          body: {
            maxHeight: 'calc(100vh - 10rem)',
            overflowY: 'auto',
          },
        },
        content: <CodeGeneratorTemplateHelpContent />,
      });
    },
    [modal],
  );

  const handleInsertVariable = useCallback(
    (variableName: string) => {
      if (readOnly) {
        return;
      }
      const current = String(form.getFieldValue('template') ?? '');
      const next = insertPlaceholderAtCursor(
        templateRef.current,
        current,
        variableName,
      );
      form.setFieldsValue({ template: next });
    },
    [form, readOnly],
  );

  const handlePreview = useCallback(async () => {
    if (!canPreview || templateId === undefined) {
      return;
    }

    let previewValues: CodeGeneratorTemplatePreviewFormValues;

    try {
      await form.validateFields(['name', 'template', 'counter_config']);
      previewValues = await previewForm.validateFields();
    } catch {
      return;
    }

    await preview(templateId, previewValues);
  }, [canPreview, form, preview, previewForm, templateId]);

  const handleSubmit = useCallback(
    async (options: ResourceFormSubmitOptions) => {
      if (readOnly) {
        handleCancel();
        return;
      }

      let values: CodeGeneratorTemplate;
      try {
        values = await form.validateFields();
      } catch {
        return;
      }

      const clientErrors = validateCodeGeneratorTemplateForm(values);
      if (clientErrors.length > 0) {
        form.setFields(
          clientErrors.map((error) => ({
            name: error.name,
            errors: [error.message],
          })),
        );
        return;
      }

      onSubmit(
        {
          ...values,
          name: values.name.trim(),
          description: values.description?.trim() || null,
          template: values.template.trim(),
          validation_regex: values.validation_regex?.trim() || null,
          counter_config: normalizeCounterConfig(values.counter_config),
          is_system: readOnly,
        },
        options,
      );
    },
    [form, handleCancel, onSubmit, readOnly],
  );

  const formDisabled = readOnly || Boolean(isLoadError && canLoad);

  const footer = readOnly
    ? [
        <ButtonLoading key="close" onClick={handleCancel}>
          Закрыть
        </ButtonLoading>,
      ]
    : resourceFormModalFooter({
        submitting,
        submitDisabled,
        onCancel: handleCancel,
        onSubmit: (options) => {
          void handleSubmit(options);
        },
      });

  return (
    <>
      <Modal
        open={open}
        destroyOnHidden={false}
        title={resolvedTitle}
        width={800}
        onCancel={handleCancel}
        keyboard={!submitting}
        style={{ top: '1rem' }}
      styles={{
        body: {
          height: 'calc(100vh - 10rem)',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
      }}
        footer={footer}
      >
        <LoadingOverlay loading={overlayLoading}>
          {isLoadError && canLoad ? (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message="Не удалось загрузить данные шаблона"
              description="Сохранение недоступно. Закройте окно и попробуйте снова."
            />
          ) : null}
          {readOnly ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Системный шаблон"
              description="Системные шаблоны нельзя изменять. Откройте копию через создание нового шаблона."
            />
          ) : null}
          <Form
            form={form}
            layout="vertical"
            disabled={formDisabled}
            initialValues={createDefaultFormValues()}
          >
            <TemplateIdWatch onTemplateIdChange={setWatchedTemplateId} />
            <Form.Item name="id" hidden>
              <InputNumber />
            </Form.Item>
            <Form.Item
              name="name"
              label="Имя"
              layout="horizontal"
              rules={[{ required: true, message: 'Укажите имя шаблона' }]}
            >
              <Input placeholder="Уникальное имя шаблона" />
            </Form.Item>
            <Form.Item name="description" label="Описание" layout="horizontal">
              <Input placeholder="Краткое описание" />
            </Form.Item>
            <Form.Item
              name="template"
              label="Шаблон кода"
              rules={[
                { required: true, message: 'Заполните строку шаблона' },
              ]}
              tooltip="Строка шаблона с плейсхолдерами в фигурных скобках, например: 01{gtin:>014}21{serial:06d}"
            >
              <Input.TextArea
                ref={templateRef}
                rows={8}
                placeholder="01{gtin:>014}21{serial:06d}"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <CounterConfigList disabled={formDisabled} catalogEnabled={open} />
            </Form.Item>

            {resolvedMode === 'edit' ? (
              <CounterStatusSection />
            ) : null}

            <Form.Item
              name="validation_regex"
              label="Регулярное выражение"
              tooltip="Необязательно: полное совпадение с сгенерированным кодом на линии"
              layout="horizontal"
            >
              <Input placeholder="^…$" />
            </Form.Item>
          </Form>

          <Form
            form={previewForm}
            layout="vertical"
            initialValues={createDefaultPreviewFormValues()}
            style={{ marginTop: 8 }}
          >
            <Flex justify="space-between" align="flex-start" wrap gap="small">
              <Form.Item
                name="task_id"
                label="ID задания"
                rules={[
                  {
                    required: true,
                    message: 'Укажите ID задания',
                  },
                ]}
                style={{ marginBottom: 8, minWidth: 120 }}
                layout="horizontal"
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: '100%' }}
                  disabled={!canPreview}
                />
              </Form.Item>
              <Form.Item
                name="aggregation_level"
                label="Уровень агрегации"
                rules={[
                  {
                    required: true,
                    message: 'Укажите уровень агрегации',
                  },
                ]}
                tooltip="−1 — единица (unit); 0…N — уровни агрегации"
                style={{ marginBottom: 8, minWidth: 160 }}
                layout="horizontal"
              >
                <InputNumber
                  min={-1}
                  max={99}
                  precision={0}
                  style={{ width: '100%' }}
                  disabled={!canPreview}
                />
              </Form.Item>
              <Button onClick={() => setVariablesOpen(true)}>
                Справочник переменных
              </Button>
              <Button
                loading={previewing}
                disabled={!canPreview || overlayLoading || previewing}
                onClick={() => {
                  void handlePreview();
                }}
              >
                Проверить
              </Button>
              <Button
                icon={<QuestionCircleOutlined />}
                onClick={showHelp}
                aria-label="Справка"
              />
            </Flex>
          </Form>
        </LoadingOverlay>
      </Modal>

      <VariablesCatalogModal
        open={variablesOpen}
        onCancel={() => setVariablesOpen(false)}
        onInsert={handleInsertVariable}
      />
    </>
  );
}

export type { CodeGeneratorTemplateFormModalProps };

