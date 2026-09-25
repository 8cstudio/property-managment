export type Job<TPayload> = {
  name: string;
  payload: TPayload;
  idempotencyKey?: string;
};

export type JobQueuePort = {
  enqueue<TPayload>(job: Job<TPayload>): Promise<void>;
};
