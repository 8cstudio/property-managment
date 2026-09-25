declare const brand: unique symbol;

export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

export type EntityId = Brand<string, "EntityId">;

type RandomSource = {
  getRandomValues(bytes: Uint8Array): Uint8Array;
};

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const source = (globalThis as { crypto?: RandomSource }).crypto;
  if (!source) {
    throw new Error("crypto.getRandomValues is required to generate ids");
  }
  return source.getRandomValues(bytes);
}

function byteAt(bytes: Uint8Array, index: number): number {
  const value = bytes[index];
  if (value === undefined) {
    throw new Error("uuid byte index out of range");
  }
  return value;
}

/** UUIDv7 from application code so ids do not depend on a Postgres version. */
export function uuidV7(now = Date.now()): EntityId {
  const bytes = randomBytes(16);
  const time = BigInt(now);
  bytes[0] = Number((time >> 40n) & 0xffn);
  bytes[1] = Number((time >> 32n) & 0xffn);
  bytes[2] = Number((time >> 24n) & 0xffn);
  bytes[3] = Number((time >> 16n) & 0xffn);
  bytes[4] = Number((time >> 8n) & 0xffn);
  bytes[5] = Number(time & 0xffn);
  bytes[6] = (byteAt(bytes, 6) & 0x0f) | 0x70;
  bytes[8] = (byteAt(bytes, 8) & 0x3f) | 0x80;

  const hex = [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as EntityId;
}
