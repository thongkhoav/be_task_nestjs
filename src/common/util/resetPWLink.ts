export const resetPWLink = (frontEndHost: string, token: string) => {
  return `${frontEndHost}/reset-password?token=${token}`;
};
