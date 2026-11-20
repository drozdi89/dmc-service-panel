import { SelectPrinter } from '@/entities/device';
import { getVars } from '@/shared/vars/getVars';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { App, Button, Flex, Form, Input, InputNumber, Segmented, type FormInstance } from 'antd';
import { Fragment, useCallback } from 'react';
import type { TemplateFormValues } from '../model/types';

/** Values for the optional print-preview controls (not persisted with the template). */
export interface TemplatePrintPreviewValues {
  code_type: 'short_code' | 'long_code';
  printer_id: number;
}

/** Props for {@link TemplateFormFields}. */
export interface TemplateFormFieldsProps {
  /** Main create/edit form instance. */
  form: FormInstance<TemplateFormValues>;
  /** Print-preview form (printer + code type); not part of save payload. */
  printingForm: FormInstance<TemplatePrintPreviewValues>;
  /** Disables main fields (e.g. detail load error). */
  disabled?: boolean;
  /** Ant Design Form `initialValues` for create / legacy prefill. */
  initialValues?: Partial<TemplateFormValues>;
}

/**
 * Body of the print-template form: name, template text, and print/help toolbar.
 */
export function TemplateFormFields({
  form,
  printingForm,
  disabled = false,
  initialValues,
}: TemplateFormFieldsProps) {
  const { modal } = App.useApp();

  const showHelp = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      modal.info({
        title: 'Подстановка переменных',
        width: 756,
        scrollLock: false,
        style: {
          top: '1rem',
        },
        styles: {
          body: {
            maxHeight: 'calc(100vh - 10rem)',
            overflowY: 'auto',
          },
        },
        content: (
          <>
            В редакторе шаблонов укажите код шаблона этикетки на языке принтера.
            <br />
            Доступны следующие ключевые слова для подстановки:
            <br />
            {getVars().map(({ name, description }) => (
              <Fragment key={name}>
                {name}: {description}
                <br />
              </Fragment>
            ))}
          </>
        ),
      });
    },
    [modal],
  );

  const handlePrint = useCallback(async () => {
    let values: TemplateFormValues & TemplatePrintPreviewValues;
    try {
      values = {
        ...(await form.validateFields()),
        ...(await printingForm.validateFields()),
      };
    } catch {
      return;
    }
    
    const abortController = new AbortController();
    
    /**
     * TODO: Implement print template preview against a real printer endpoint.
     * Currently surfaces validated form values for debugging.
     */
    const result = await (async (formValues, _signal: AbortSignal) => {
      return JSON.stringify(formValues);
    })(values, abortController.signal);

    if (abortController.signal.aborted) {
      return;
    }

    modal.info({
      title: 'Подстановка переменных',
      width: 756,
      scrollLock: false,
      style: {
        top: '1rem',
      },
      content: result,
    });
  }, [form, modal, printingForm]);

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        disabled={disabled}
        initialValues={initialValues}
      >
        <Form.Item name="id" hidden>
          <InputNumber />
        </Form.Item>
        <Form.Item
          name="name"
          label="Название"
          rules={[{ required: true, message: 'Укажите название' }]}
          style={{ marginBottom: 0 }}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="template"
          label="Тело шаблона"
          rules={[{ required: true, message: 'Укажите текст шаблона' }]}
        >
          <Input.TextArea rows={12} placeholder="Текст шаблона as-is в БД" />
        </Form.Item>
      </Form>
      <Form form={printingForm} disabled={disabled}>
        <Form.Item name="code_type" style={{ marginBottom: 4 }} initialValue="short_code">
          <Segmented
            block
            options={[
              { label: 'Короткий код(вода, пиво)', value: 'short_code' },
              { label: 'Длинный код(антисептик, бад)', value: 'long_code' },
            ]}
          />
        </Form.Item>
        <Flex gap="middle" justify="space-between">
          <Form.Item
            name="printer_id"
            style={{ marginBottom: 0, flex: 1 }}
            rules={[
              {
                required: true,
                message: 'Укажите принтер',
              },
            ]}
          >
            <SelectPrinter />
          </Form.Item>
          <Button onClick={() => void handlePrint()}>Печать</Button>
          <Button onClick={showHelp}>
            <QuestionCircleOutlined />
          </Button>
        </Flex>
      </Form>
    </>
  );
}
