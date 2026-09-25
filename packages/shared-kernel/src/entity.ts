export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  readonly type: TType;
  readonly occurredAt: Date;
  readonly payload: TPayload;
};

export abstract class Entity<TId extends string> {
  readonly id: TId;

  constructor(id: TId) {
    this.id = id;
  }
}

export abstract class AggregateRoot<TId extends string> extends Entity<TId> {
  readonly #events: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this.#events.push(event);
  }

  pullEvents(): readonly DomainEvent[] {
    const events = [...this.#events];
    this.#events.length = 0;
    return events;
  }
}
