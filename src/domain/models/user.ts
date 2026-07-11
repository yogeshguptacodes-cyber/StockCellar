/**
 * User entity. v1 has no authentication; this shape is what the future
 * Node.js backend will hydrate after login.
 */
export interface User {
  readonly id: string;
  readonly displayName: string;
  readonly shopName: string;
  readonly email: string | null;
}
