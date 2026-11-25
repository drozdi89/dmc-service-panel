import {
  CODE_CLEANUP_DAYS_MAX,
  CODE_CLEANUP_DAYS_MIN,
  CODE_CLEANUP_INTERVAL_HOURS_MAX,
  CODE_CLEANUP_INTERVAL_HOURS_MIN,
  useCodeCleanupSettings,
  type CodeCleanupSettings,
} from '@/entities/parameters';
import { ButtonLoading, QueryStateBoundary } from '@/shared/ui/loading';
import { Checkbox, Col, Form, InputNumber, Row, Space, TimePicker, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useEffect } from 'react';

dayjs.extend(customParseFormat);

const TIME_FORMAT = 'HH:mm';

/** Form value (`HH:MM` string) to TimePicker value. */
function timeToPickerValue(value: string | undefined): { value: Dayjs | null } {
  const parsed = value ? dayjs(value, TIME_FORMAT, true) : null;
  return { value: parsed?.isValid() ? parsed : null };
}

/** TimePicker value to form value (`HH:MM` string). */
function pickerValueToTime(value: Dayjs | null): string {
  return value ? value.format(TIME_FORMAT) : '';
}

function CodeCleanupFields({ isSaving }: { isSaving: boolean }) {
  const form = Form.useFormInstance<CodeCleanupSettings>();
  const enabled = Form.useWatch('enabled', form);

  return (
      <>
        <Typography.Paragraph type="secondary">
          Удаляет коды и агрегаты у завершённых заданий старше указанного срока.
        </Typography.Paragraph>

        <Form.Item name="enabled" valuePropName="checked">
          <Checkbox>Очищать старые коды по расписанию</Checkbox>
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Хранить коды"
              tooltip="Задания старше этого срока попадают под очистку."
            >
              <Space.Compact block style={{ width: '100%' }}>
                <Form.Item name="days" noStyle>
                  <InputNumber
                    min={CODE_CLEANUP_DAYS_MIN}
                    max={CODE_CLEANUP_DAYS_MAX}
                    disabled={!enabled}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Space.Addon>дней</Space.Addon>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="start_time"
              label="Время начала"
              getValueProps={timeToPickerValue}
              normalize={pickerValueToTime}
            >
              <TimePicker
                format={TIME_FORMAT}
                allowClear={false}
                disabled={!enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Интервал между запусками"
              tooltip="Минимальный интервал между прогонами очистки."
            >
              <Space.Compact block style={{ width: '100%' }}>
                <Form.Item name="interval_hours" noStyle>
                  <InputNumber
                    min={CODE_CLEANUP_INTERVAL_HOURS_MIN}
                    max={CODE_CLEANUP_INTERVAL_HOURS_MAX}
                    disabled={!enabled}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Space.Addon>часов</Space.Addon>
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <ButtonLoading type="primary" htmlType="submit" loading={isSaving}>
            Сохранить настройки очистки
          </ButtonLoading>
        </Form.Item>
      </>
  );
}

/**
 * Scheduled cleanup of old codes — parity with Qt `gbxCodeCleanup`.
 * Loads and saves its own data; toasts come from the entity hook.
 */
export function CodeCleanupSection() {
  const [form] = Form.useForm<CodeCleanupSettings>();
  const { settings, isLoading, error, save, isSaving } = useCodeCleanupSettings();

  useEffect(() => {
    if (!isLoading && settings) {
      form.setFieldsValue(settings);
    }
  }, [form, isLoading, settings]);

  return (
    <QueryStateBoundary
      loading={isLoading}
      error={error}
      errorTitle="Не удалось загрузить настройки очистки старых кодов"
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <CodeCleanupFields isSaving={isSaving} />
      </Form>
    </QueryStateBoundary>
  );
}
