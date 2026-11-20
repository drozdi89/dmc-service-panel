import { Tag } from 'antd';
import { useCallback } from 'react';

/** Single filter chip definition. */
export interface TypeFilterChip {
  key: string;
  label: string;
}

/** Props for toggle filter chips (e.g. device types). */
export interface TypeFilterChipsProps {
  options: TypeFilterChip[];
  selectedKeys: string[];
  onChange: (selectedKeys: string[]) => void;
  /** Allow multiple active chips; when false, only one chip is active. */
  multiple?: boolean;
}

/**
 * Toggle chips for multi-select type filters in list toolbars.
 */
export function TypeFilterChips({
  options,
  selectedKeys,
  onChange,
  multiple = true,
}: TypeFilterChipsProps) {
  const toggle = useCallback(
    (key: string, active: boolean) => {
      if (multiple) {
        onChange(
          active
            ? [...selectedKeys, key]
            : selectedKeys.filter((item) => item !== key),
        );
        return;
      }
      onChange(active ? [key] : []);
    },
    [multiple, onChange, selectedKeys],
  );

  return (
    <>
      {options.map((option) => {
        const checked = selectedKeys.includes(option.key);
        return (
          <Tag.CheckableTag
            key={option.key}
            checked={checked}
            onChange={(active) => toggle(option.key, active)}
          >
            {option.label}
          </Tag.CheckableTag>
        );
      })}
    </>
  );
}
