import { PARAMETERS_MESSAGES } from '@/entities/parameters';
import { App, Button, Form, Input, Space } from 'antd';
import { useState } from 'react';

/**
 * Database backup / restore — parity with Qt `btnCreateBackup` / `btnRestoreFromBackup`.
 *
 * Stub: Qt runs local `pg_dump` / restore, and the backend has no REST API for it yet.
 * The directory is local UI state only (not saved); both buttons just show a notice.
 */
export function BackupSection() {
  const { modal } = App.useApp();
  const [backupPath, setBackupPath] = useState('');

  const showStub = (action: string) => {
    modal.info({
      title: `${PARAMETERS_MESSAGES.backup.stubTitle}: ${action}`,
      content: (
        <>
          {PARAMETERS_MESSAGES.backup.stubContent}
          {backupPath ? (
            <>
              <br />
              {backupPath}
            </>
          ) : null}
        </>
      ),
    });
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Каталог сохранения резервных копий">
        <Input
          value={backupPath}
          onChange={(event) => setBackupPath(event.target.value)}
          autoComplete="off"
        />
      </Form.Item>
      <Space wrap>
        <Button type="primary" onClick={() => showStub('сохранить копию базы')}>
          Сохранить копию базы
        </Button>
        <Button onClick={() => showStub('загрузить копию базы')}>Загрузить копию базы</Button>
      </Space>
    </Form>
  );
}
