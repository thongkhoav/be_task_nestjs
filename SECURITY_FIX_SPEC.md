# Spec: Authentication and Resource Authorization Hardening

## Objective

Prevent authenticated and unauthenticated clients from accessing or mutating rooms, tasks, and chat data outside their membership. Keep JWTs in secure cookies, restore correct task assignment, make null-relation paths safe, retry failed reminder jobs, and enforce database uniqueness for users and active room memberships.

This specification covers the backend `caching` branch and the frontend `authentication-check` branch currently checked out.

## Tech Stack

- Backend: NestJS 10, Socket.IO 4, TypeORM 0.3, PostgreSQL, BullMQ, Jest
- Frontend: Next.js 14, React 18, Axios, Socket.IO client
- Authentication: access and refresh JWTs stored in one HttpOnly authentication cookie

## Commands

- Backend focused tests: `npm test -- --runInBand`
- Backend type check: `npx tsc --noEmit --incremental false`
- Backend build: `npm run build`
- Frontend type check: `npx tsc --noEmit --incremental false`
- Frontend build: `npm run build`
- Compose validation: `docker compose config --quiet`

## Project Structure

- `src/auth`: JWT extraction, cookie lifecycle, and sanitized session responses
- `src/socket`: authenticated Socket.IO handshakes and per-event room authorization
- `src/task`: task ownership, membership, assignment, and status rules
- `src/room`: room membership and member-list authorization
- `src/processors`: BullMQ reminder delivery behavior
- `src/migrations`: forward and reversible database uniqueness changes
- `../fe_task_nextjs/src`: browser auth state, socket initialization, and sensitive-log removal
- `src/**/*.spec.ts`: focused Jest regression tests beside backend source

## Code Style

Use explicit authorization methods and derive identity from the trusted request or socket context:

```ts
const userId = this.socketSecurity.getUserId(client);
await this.socketSecurity.assertRoomMember(client, roomId);
await this.chatService.saveMessage(roomId, userId, content);
```

Do not accept a current-user ID from an HTTP body, query, or socket event.

## Testing Strategy

- Unit-test socket authentication, room authorization, controller identity propagation, task assignment/null safety, cookie response safety, and reminder failure propagation.
- Run backend type checks and all Jest tests after focused tests pass.
- Run frontend type checks/build after removing token-dependent client state.
- Validate a fresh signup, login, room load, and authenticated socket connection in the browser.

## Boundaries

- Always: derive user identity from a verified JWT; authorize every room event; keep tokens out of response bodies and logs; preserve unrelated worktree changes.
- Ask first: change product roles or who may edit a task beyond the existing owner/member/assignee model; add third-party dependencies.
- Never: log credentials, cookies, JWTs, passwords, FCM tokens, or plaintext authentication forms; trust payload user IDs; expose room-member emails to non-members.

## Success Criteria

1. Socket connections without a valid access JWT in the authentication cookie are rejected during the handshake.
2. Every task/chat socket event verifies room membership; sender/updater identity comes from the verified socket, and task status validation always runs.
3. Task create, edit, and list endpoints verify the requester belongs to the relevant room. Room-member listing verifies membership before returning emails.
4. Assignment loads the task room relation, safely handles missing membership, and assigns `assignTaskDto.userId`.
5. Unassigned tasks, non-members, missing room owners, and remove-all-member flows return controlled errors or complete without relation dereferences.
6. Authentication cookies default to HttpOnly, SameSite=Lax, Secure in production, and are cleared with matching options. Sign-in and refresh bodies contain no JWTs.
7. The unsupported Google login action is absent from the current frontend branch.
8. Authentication forms, cookies/tokens, password-bearing records, and FCM tokens are not logged.
9. A failed push or email reminder rejects the BullMQ job so configured retries apply.
10. A reversible migration and matching entity metadata enforce unique user email and one active membership per user/room.
11. Focused tests, backend/frontend type checks and builds, Compose validation, and the fresh-account browser smoke test pass, with unrelated baseline failures reported separately.

## Open Questions

None. The supplied audit defines the approved behavior and scope.
