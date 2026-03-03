import { asc, desc } from 'drizzle-orm';

type PaginationInput = {
  limit?: string;
  offset?: string;
  page?: string;
  pageNum?: string;
};

export const parsePagination = (query: PaginationInput) => {
  const limit = Math.min(parseInt(query.limit || '10', 10) || 10, 100);
  const offsetParam = query.offset;
  const pageParam = query.pageNum ?? query.page;

  const pageNumRaw = pageParam ? parseInt(pageParam, 10) : NaN;
  const pageNum = Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : undefined;

  const offset = offsetParam
    ? Math.max(parseInt(offsetParam, 10) || 0, 0)
    : Math.max(((pageNum ?? 1) - 1) * limit, 0);

  return { limit, offset, pageNum };
};

export const toPagination = (limit: number, offset: number, total: number, pageNum?: number) => ({
  limit,
  offset,
  total,
  page: pageNum ?? Math.floor(offset / limit) + 1,
  totalPages: Math.ceil(total / limit),
});

export const resolveSortDirection = (direction?: string) =>
  direction?.toLowerCase() === 'desc' ? desc : asc;

export const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) {
    return false;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);

  return hasUpper && hasLower && hasDigit;
};
