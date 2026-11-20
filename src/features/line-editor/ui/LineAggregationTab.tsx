import {
  canAddAutomatedAggregationLevel,
  canSwapAggregationLevels,
  MAX_AGGREGATION_LEVELS,
  reindexAggregationLevels,
  type AggregationLevelFormState,
  type AggregationLevelLabels,
  type AggregationType,
  type LineEditorFormState,
  type LineEditorResourceLabels,
  type LineEditorVisibility,
} from '@/entities/line';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Form, List, Space } from 'antd';
import { useMemo, useState } from 'react';
import { AutomatedAggregationLevelModal, AutonomousAggregationLevelModal, ManualAggregationLevelModal } from './AggregationLevel';

/** Props for aggregation levels tab (list data lives in parent Form). */
export interface LineAggregationTabProps {
  visibility: LineEditorVisibility;
  resourceLabels: LineEditorResourceLabels;
  onResourceLabelsChange: (next: LineEditorResourceLabels) => void;
}

type LevelModalState =
  | { open: false }
  | { open: true; mode: 'create' | 'edit'; index?: number; aggregation_type: AggregationType };

function syncLevelLabels(
  labels: AggregationLevelLabels[],
  levels: AggregationLevelFormState[],
): AggregationLevelLabels[] {
  return levels.map((_, index) => labels[index] ?? {});
}

/**
 * Aggregation tab with level list and modals.
 * Reads/writes `aggregation_levels` and `deleted_aggregation_level_ids` via Form.
 */
export function LineAggregationTab({
  visibility,
  resourceLabels,
  onResourceLabelsChange,
}: LineAggregationTabProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const levels = Form.useWatch('aggregation_levels', form) ?? [];
  const deletedIds = Form.useWatch('deleted_aggregation_level_ids', form) ?? [];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalState, setModalState] = useState<LevelModalState>({ open: false });

  const atMax = levels.length >= MAX_AGGREGATION_LEVELS;
  const canAddAuto =
    !visibility.disableAutoAggregationAdd && canAddAutomatedAggregationLevel(levels) && !atMax;

  const canMoveUp =
    selectedIndex !== null &&
    selectedIndex > 0 &&
    canSwapAggregationLevels(levels, selectedIndex, selectedIndex - 1);

  const canMoveDown =
    selectedIndex !== null &&
    selectedIndex < levels.length - 1 &&
    canSwapAggregationLevels(levels, selectedIndex, selectedIndex + 1);

  const addMenuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'automated',
        label: 'Автоматизированная',
        disabled: !canAddAuto,
      },
      {
        key: 'autonomous',
        label: 'Автономная агрегация',
        disabled: !canAddAuto,
      },
      {
        key: 'manual',
        label: 'Ручная (ТСД)',
        disabled: atMax,
      },
    ],
    [atMax, canAddAuto],
  );

  const updateLevels = (nextLevels: AggregationLevelFormState[]) => {
    form.setFieldValue('aggregation_levels', reindexAggregationLevels(nextLevels));
    onResourceLabelsChange({
      ...resourceLabels,
      aggregation_levels: syncLevelLabels(resourceLabels.aggregation_levels, nextLevels),
    });
  };

  const openEditModal = (index: number) => {
    const level = levels[index];
    setSelectedIndex(index);
    setModalState({
      open: true,
      mode: 'edit',
      aggregation_type: level.aggregation_type,
      index,
    });
  };

  const handleAddMenu: MenuProps['onClick'] = ({ key }) => {
    setModalState({ open: true, mode: 'create', aggregation_type: key as AggregationType });
  };

  const handleEdit = () => {
    if (selectedIndex === null) {
      return;
    }
    openEditModal(selectedIndex);
  };

  const handleDelete = () => {
    if (selectedIndex === null) {
      return;
    }
    const level = levels[selectedIndex];
    const nextDeleted = level.id ? [...deletedIds, level.id] : deletedIds;
    const nextLevels = levels.filter((_, index) => index !== selectedIndex);
    const nextAggregationLabels = resourceLabels.aggregation_levels.filter(
      (_, index) => index !== selectedIndex,
    );
    form.setFieldsValue({
      aggregation_levels: reindexAggregationLevels(nextLevels),
      deleted_aggregation_level_ids: nextDeleted,
    });
    onResourceLabelsChange({
      ...resourceLabels,
      aggregation_levels: syncLevelLabels(nextAggregationLabels, nextLevels),
    });
    setSelectedIndex(null);
  };

  const moveLevel = (up: boolean) => {
    if (selectedIndex === null) {
      return;
    }
    const targetIndex = up ? selectedIndex - 1 : selectedIndex + 1;
    if (!canSwapAggregationLevels(levels, selectedIndex, targetIndex)) {
      return;
    }
    const next = [...levels];
    const nextLabels = [...resourceLabels.aggregation_levels];
    [next[selectedIndex], next[targetIndex]] = [next[targetIndex], next[selectedIndex]];
    [nextLabels[selectedIndex], nextLabels[targetIndex]] = [
      nextLabels[targetIndex],
      nextLabels[selectedIndex],
    ];
    form.setFieldValue('aggregation_levels', reindexAggregationLevels(next));
    onResourceLabelsChange({
      ...resourceLabels,
      aggregation_levels: syncLevelLabels(nextLabels, reindexAggregationLevels(next)),
    });
    setSelectedIndex(targetIndex);
  };

  const handleModalSave = (
    level: AggregationLevelFormState,
    levelLabels: AggregationLevelLabels,
  ) => {
    if (modalState.open && modalState.mode === 'edit' && modalState.index !== undefined) {
      const next = [...levels];
      next[modalState.index] = { ...level, level: modalState.index };
      const nextAggregationLabels = [...resourceLabels.aggregation_levels];
      nextAggregationLabels[modalState.index] = levelLabels;
      form.setFieldValue('aggregation_levels', reindexAggregationLevels(next));
      onResourceLabelsChange({
        ...resourceLabels,
        aggregation_levels: syncLevelLabels(nextAggregationLabels, next),
      });
    } else {
      const nextLevels = [
        ...levels,
        {
          ...level,
          level: levels.length,
        },
      ];
      form.setFieldValue('aggregation_levels', reindexAggregationLevels(nextLevels));
      onResourceLabelsChange({
        ...resourceLabels,
        aggregation_levels: [...resourceLabels.aggregation_levels, levelLabels],
      });
    }
    setModalState({ open: false });
  };

  const editingLevel =
    modalState.open && modalState.mode === 'edit' && modalState.index !== undefined
      ? levels[modalState.index]
      : undefined;

  const editingLevelLabels =
    modalState.open && modalState.mode === 'edit' && modalState.index !== undefined
      ? resourceLabels.aggregation_levels[modalState.index]
      : undefined;

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Dropdown menu={{ items: addMenuItems, onClick: handleAddMenu }}>
          <Button type="primary" icon={<PlusOutlined />}>
            Добавить уровень
          </Button>
        </Dropdown>
        <Button icon={<EditOutlined />} disabled={selectedIndex === null} onClick={handleEdit}>
          Изменить
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={selectedIndex === null}
          onClick={handleDelete}
        >
          Удалить
        </Button>
        <Button
          icon={<ArrowUpOutlined />}
          disabled={!canMoveUp}
          aria-label="Переместить уровень вверх"
          onClick={() => moveLevel(true)}
        />
        <Button
          icon={<ArrowDownOutlined />}
          disabled={!canMoveDown}
          aria-label="Переместить уровень вниз"
          onClick={() => moveLevel(false)}
        />
      </Space>

      <List
        bordered
        dataSource={levels}
        locale={{ emptyText: 'Уровни агрегации не заданы' }}
        renderItem={(item, index) => {
          const tag = item.is_manual ? 'M' : 'A';
          const selected = selectedIndex === index;
          return (
            <List.Item
              onClick={() => setSelectedIndex(index)}
              onDoubleClick={() => openEditModal(index)}
              style={{
                cursor: 'pointer',
                background: selected ? 'rgba(22, 119, 255, 0.08)' : undefined,
              }}
            >
              <List.Item.Meta title={<>[{tag}] {item.name} ур. {item.level + 1}</>} />
            </List.Item>
          );
        }}
      />

      {modalState.open && modalState.aggregation_type === 'manual' ? (
        <ManualAggregationLevelModal
          open
          initialLevel={editingLevel}
          initialLabels={editingLevelLabels}
          onCancel={() => setModalState({ open: false })}
          onSave={handleModalSave}
        />
      ) : null}

      {modalState.open && modalState.aggregation_type === 'autonomous' ? (
        <AutonomousAggregationLevelModal
          open
          initialLevel={editingLevel}
          onCancel={() => setModalState({ open: false })}
          onSave={handleModalSave}
        />
      ) : null}

      {modalState.open && modalState.aggregation_type === 'automated' ? (
        <AutomatedAggregationLevelModal
          open
          initialLevel={editingLevel}
          initialLabels={editingLevelLabels}
          onCancel={() => setModalState({ open: false })}
          onSave={handleModalSave}
        />
      ) : null}
    </Space>
  );
}