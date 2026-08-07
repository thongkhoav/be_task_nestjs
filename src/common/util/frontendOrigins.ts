export const parseFrontendOrigins = (value?: string): string[] => {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set(origins)];
};
