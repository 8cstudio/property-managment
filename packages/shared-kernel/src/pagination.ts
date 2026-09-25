export type PageQuery = {
  limit: number;
  cursor?: string;
};

export type Page<T> = {
  items: readonly T[];
  nextCursor: string | null;
};
