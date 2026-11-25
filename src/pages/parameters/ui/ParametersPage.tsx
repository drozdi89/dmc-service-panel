import { useSlaveConfigurationQuery } from '@/entities/parameters';
import { BackupSection } from '@/features/parameters-backup';
import { CodeCleanupSection } from '@/features/parameters-code-cleanup';
import { FactoryNumbersSection } from '@/features/parameters-factory-numbers';
import { FtpSection } from '@/features/parameters-ftp';
import { MarkingOptionsSection } from '@/features/parameters-marking-options';
import { StatisticsSection } from '@/features/parameters-statistics';
import { TelegramSection } from '@/features/parameters-telegram';
import { WatchdogSection } from '@/features/parameters-watchdog';
import { Alert, Card, Space, Typography } from 'antd';

/**
 * Parameters admin page — composition of self-contained sections:
 * marking options, Telegram, factory numbers, FTP, Watchdog, statistics,
 * code cleanup, backup (stub).
 */
export default function ParametersPage() {
  const slaveQuery = useSlaveConfigurationQuery();
  const isSlaveMode = slaveQuery.data?.slave_mode === true;

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Параметры
      </Typography.Title>

      {isSlaveMode ? (
        <Alert
          type="info"
          showIcon
          message="Slave-режим"
          description="Часть настроек скрыта, как в Service Panel при включённом slave-режиме."
        />
      ) : null}

      <Card title="Настройки маркировки">
        <MarkingOptionsSection />
      </Card>

      <Card title="Telegram">
        <TelegramSection />
      </Card>

      <Card title="Заводские номера">
        <FactoryNumbersSection />
      </Card>

      {slaveQuery.isSuccess && !isSlaveMode ? (
        <Card title="FTP-обмен">
          <FtpSection />
        </Card>
      ) : null}

      <Card title="Watchdog">
        <WatchdogSection />
      </Card>

      <Card title="Статистика">
        <StatisticsSection />
      </Card>

      <Card title="Очистка старых кодов">
        <CodeCleanupSection />
      </Card>

      <Card title="Резервное копирование">
        <BackupSection />
      </Card>
    </Space>
  );
}
