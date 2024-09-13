export type JwtPayload = {
  email: string;
  sub: string; // user id
  fullName: string;
  role: string;
};
