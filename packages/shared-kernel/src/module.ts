export type ModuleManifest = {
  id: string;
  permissions: readonly string[];
  nav: readonly { label: string; href: string }[];
  routes: readonly string[];
  jobs: readonly string[];
  publishes: readonly string[];
  subscribesTo: readonly string[];
};

/** Columns every operational table carries. Ids are generated in application code. */
export const recordColumns = [
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "archived_at",
  "version",
  "source_system",
  "source_id",
  "import_batch_id",
] as const;

export const tenantColumn = "organisation_id" as const;
