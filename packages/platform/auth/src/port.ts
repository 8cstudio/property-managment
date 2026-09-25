export type HeaderSource = {
  get(name: string): string | null;
};

export type Session = {
  userId: string;
  organisationId: string | null;
};

export type AuthPort = {
  getSession(headers: HeaderSource): Promise<Session | null>;
};
