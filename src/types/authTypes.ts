export interface JwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  exp: number;
  iat: number;
}
