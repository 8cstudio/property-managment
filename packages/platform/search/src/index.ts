export type SearchQuery = {
  organisationId: string;
  text: string;
  limit: number;
};

export type SearchPort = {
  search(query: SearchQuery): Promise<readonly string[]>;
};
