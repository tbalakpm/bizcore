import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  userId: number | null;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getContext(): Partial<RequestContext> {
  return asyncLocalStorage.getStore() ?? {};
}

export function setUserId(userId: number): void {
  const context = asyncLocalStorage.getStore();
  if (context) {
    context.userId = userId;
  }
}
