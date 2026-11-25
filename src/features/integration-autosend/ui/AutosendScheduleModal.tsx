import type { AutosendSendMode, TaskerSchedule } from '@/entities/integration';
import {
  Button,
  Checkbox,
  Form,
  Modal,
  Radio,
  Space,
  TimePicker,
  Tooltip
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useCallback, useEffect, useState } from 'react';

dayjs.extend(customParseFormat);

/** Props for autosend schedule editor modal. */
export interface AutosendScheduleModalProps {
  open: boolean;
  value: TaskerSchedule;
  onCancel: () => void;
  onOk: (next: TaskerSchedule) => void;
}

/** UI mode: fixed daily times vs repeat interval. */
type ScheduleUiMode = 'schedule' | 'repeat';

const UNIT_CODES_TOOLTIP =
  'Данные в ЧЗ передаются начиная со штучных кодов и далее по всем этапам до последнего уровня агрегации. В ЧЗ передаются все коды.';

const LAST_AGGREGATE_TOOLTIP =
  'Данные в ЧЗ передаются после формирования агрегата последнего уровня по заданию и по его вложениям. В ЧЗ передаются только те коды и упаковки, которые сагрегированы до конца';

const MAX_CODE_DELAY_SECONDS = 23 * 3600 + 59 * 60 + 59;
const ZERO_INTERVAL = '00:00:00';

/** One editable schedule time row. */
interface ScheduleTimeRow {
  key: string;
  time: string;
}

/**
 * Convert delay seconds to a dayjs time-of-day for TimePicker (HH:mm:ss).
 *
 * @param totalSeconds - Delay in seconds (API value).
 */
function secondsToDayjs(totalSeconds: number): Dayjs {
  const clamped = Math.max(0, Math.min(Math.trunc(totalSeconds), MAX_CODE_DELAY_SECONDS));
  return dayjs()
    .hour(Math.floor(clamped / 3600))
    .minute(Math.floor((clamped % 3600) / 60))
    .second(clamped % 60)
    .millisecond(0);
}

/**
 * Convert TimePicker value to delay seconds for API.
 *
 * @param value - Selected time-of-day or null.
 */
function dayjsToSeconds(value: Dayjs | null): number {
  if (!value) {
    return 0;
  }
  return value.hour() * 3600 + value.minute() * 60 + value.second();
}

/**
 * Parse HH:mm:ss (or HH:mm) string for TimePicker.
 *
 * @param value - Stored time string.
 * @param format - dayjs parse format.
 */
function parseTimeString(value: string | null | undefined, format: string): Dayjs {
  const fallback = format === 'HH:mm:ss' ? ZERO_INTERVAL : '00:00';
  const parsed = dayjs(value || fallback, format, true);
  return parsed.isValid() ? parsed : dayjs(fallback, format);
}

/**
 * Sort schedule rows by HH:mm ascending.
 *
 * @param items - Schedule rows to sort.
 */
function sortScheduleRows(items: ScheduleTimeRow[]): ScheduleTimeRow[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Modal for editing autosend schedule and send_mode.
 */
export function AutosendScheduleModal({
  open,
  value,
  onCancel,
  onOk,
}: AutosendScheduleModalProps) {
  const [enabled, setEnabled] = useState(false);
  const [sendMode, setSendMode] = useState<AutosendSendMode>('unit_codes');
  const [codeDelay, setCodeDelay] = useState(0);
  const [repeatInterval, setRepeatInterval] = useState(ZERO_INTERVAL);

  useEffect(() => {
    if (!open) {
      return;
    }
    setEnabled(value.enabled ?? false);
    setSendMode(value.send_mode ?? 'unit_codes');
    setCodeDelay(value.code_delay ?? 0);
    setRepeatInterval(value.repeat_interval ?? ZERO_INTERVAL);
  }, [open, value]);

  const handleOk = useCallback(() => {
    const next: TaskerSchedule = {
      enabled,
      code_delay: codeDelay,
      send_mode: sendMode,
    };
      next.schedule = null;
      next.repeat_interval =
        repeatInterval && repeatInterval !== ZERO_INTERVAL ? repeatInterval : null;

    onOk(next);
  }, [codeDelay, enabled, onOk, repeatInterval, sendMode]);

  return (
    <Modal
      title="Настройка автоматической отправки"
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      width={560}
      footer={
        <Space>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="primary" onClick={handleOk}>
            ОК
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Checkbox
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        >
          Включить расписание
        </Checkbox>

        <Form.Item label="Передавать по">
          <Radio.Group
            value={sendMode}
            disabled={!enabled}
            onChange={(event) => setSendMode(event.target.value as AutosendSendMode)}
          >
            <Tooltip title={UNIT_CODES_TOOLTIP}>
              <Radio value="unit_codes">штучным кодам</Radio>
            </Tooltip>
            <Tooltip title={LAST_AGGREGATE_TOOLTIP}>
              <Radio value="last_aggregate">последнему агрегату</Radio>
            </Tooltip>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Отставание передачи кодов (HH:mm:ss)">
          <TimePicker
            format="HH:mm:ss"
            showNow={false}
            needConfirm={false}
            value={secondsToDayjs(codeDelay)}
            disabled={!enabled}
            onChange={(next) => setCodeDelay(dayjsToSeconds(next))}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Space>
    </Modal>
  );
}
