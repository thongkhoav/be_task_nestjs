export const resolvePort = (
  value: string | number | undefined,
  defaultPort: number,
): number => {
  const port =
    value === undefined || value === '' ? defaultPort : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
};
