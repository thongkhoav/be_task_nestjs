export const delayMsCalculator = (
  dueDate: Date,
  timeBeforeDeadlineInMinutes: number = 30,
): number => {
  const now = new Date().getTime();
  const dueTime = new Date(dueDate).getTime();
  return dueTime - now - timeBeforeDeadlineInMinutes * 60 * 1000; // Subtracting the time before deadline
};
