import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type UserRole = "super_admin" | "finance" | "cs" | "technician";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
