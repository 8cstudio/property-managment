export type TelemetryPort = {
  startSpan(name: string, correlationId: string): { end(): void };
};
