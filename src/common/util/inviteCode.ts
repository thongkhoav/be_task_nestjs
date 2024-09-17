export const generateInviteCode = (uuidInviteCode, prefix) => {
  return prefix + '/' + uuidInviteCode;
};

export const compareInviteCode = (inviteCodeLink, uuidInviteCode, prefix) => {
  return (
    inviteCodeLink.startsWith(prefix + '/') &&
    inviteCodeLink === prefix + '/' + uuidInviteCode
  );
};
