export type LogFields = Record<string, unknown>;

export type LoggerPort = {
  info(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
};
