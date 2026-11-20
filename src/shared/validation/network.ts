/**
 * Validates TCP/UDP port (1–65535, Qt `PORT_REGEX_VALIDATOR` parity).
 *
 * @param value - Port number or string.
 * @returns Error message when invalid; `null` when valid.
 */
export function validatePort(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return 'Укажите порт';
  }

  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric < 1 || numeric > 65535) {
    return 'Порт должен быть от 1 до 65535';
  }

  return null;
}

/**
 * Ant Design Form rule factory for port fields.
 *
 * @param required - Whether empty value should fail validation.
 */
export function portFormRule(required = true) {
  return {
    validator: async (_: unknown, value: number | string | null | undefined) => {
      const message = validatePort(value);
      if (message) {
        if (!required && (value === null || value === undefined || value === '')) {
          return;
        }
        throw new Error(message);
      }
    },
  };
}
