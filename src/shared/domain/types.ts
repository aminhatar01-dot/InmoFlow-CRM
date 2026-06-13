export type AppRole = "owner" | "admin" | "manager" | "agent";

export type MembershipStatus = "invited" | "active" | "suspended" | "removed";

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: AppRole;
};

export type Pagination = {
  limit: number;
  offset: number;
};

export type SortDirection = "asc" | "desc";
