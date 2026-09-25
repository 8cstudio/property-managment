export type StoredObject = {
  key: string;
  version: number;
  organisationId: string;
};

export type StoragePort = {
  put(object: StoredObject, body: Uint8Array): Promise<void>;
  signedUrl(key: string): Promise<string>;
};
