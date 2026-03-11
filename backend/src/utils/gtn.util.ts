export const shouldGenerateGtn = (gtnGeneration?: string | null): boolean => {
  if (!gtnGeneration) {
    return false;
  }

  const mode = gtnGeneration.trim().toLowerCase();
  if (!mode) {
    return false;
  }

  return !['manual', 'none', 'off', 'false', 'no'].includes(mode);
};

export const generateGtn = (productCode?: string | null): string => {
  const prefix = (productCode || 'GTN').toUpperCase().slice(0, 10);
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${prefix}-${time}${random}`;
};
