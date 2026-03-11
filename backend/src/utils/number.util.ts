export const toNumericString = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) {
    return undefined;
  }

  return num.toString();
};

export const toPositiveNumber = (value: unknown, fallback: number): number => {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num) || num <= 0) {
    return fallback;
  }

  return num;
};
