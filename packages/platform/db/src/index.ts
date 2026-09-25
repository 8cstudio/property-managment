export type QueryExecutor = {
  execute(
    statement: string,
    params?: readonly unknown[],
  ): Promise<readonly unknown[]>;
};

/** Drizzle sits behind this port. Runtime uses the pooled URL; migrations use the direct URL. */
export type UnitOfWork = {
  read: QueryExecutor;
  write: QueryExecutor;
  transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T>;
};
