export const timeBeforeDeadline = 2 * 60 * 1000; // 30 minutes in milliseconds
export const delayMsCalculator = (dueDate: Date): number => {
  const now = new Date().getTime();
  const dueTime = new Date(dueDate).getTime();
  return dueTime - now - timeBeforeDeadline; // Subtracting the time before deadline
};
