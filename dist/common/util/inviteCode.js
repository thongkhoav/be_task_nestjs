"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareInviteCode = exports.generateInviteCode = void 0;
const generateInviteCode = (uuidInviteCode, prefix) => {
    return prefix + '/' + uuidInviteCode;
};
exports.generateInviteCode = generateInviteCode;
const compareInviteCode = (inviteCodeLink, uuidInviteCode, prefix) => {
    return (inviteCodeLink.startsWith(prefix + '/') &&
        inviteCodeLink === prefix + '/' + uuidInviteCode);
};
exports.compareInviteCode = compareInviteCode;
//# sourceMappingURL=inviteCode.js.map