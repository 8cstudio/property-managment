"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { cellText } from "../lib/cell-text";
import { matchesSearch } from "../lib/match-search";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Card } from "./card";

export const DATA_TABLE_PAGE_SIZE = 20;

export type DataTableFilter = {
  id: string;
  label: string;
  options: readonly { value: string; label: string }[];
};

export type DataTableRow = {
  key: string;
  cells: ReactNode[];
  /** Optional override for text search matching. */
  searchText?: string;
  /** Values for `filters` props (exact match when set). */
  filterValues?: Record<string, string>;
};

function buildHaystack(row: DataTableRow): string {
  if (row.searchText) return row.searchText.toLowerCase();
  return row.cells.map(cellText).join(" ").toLowerCase();
}

function rowMatchesFilters(
  row: DataTableRow,
  haystack: string,
  appliedFilters: Record<string, string>,
): boolean {
  for (const [id, value] of Object.entries(appliedFilters)) {
    if (!value) continue;
    const exact = row.filterValues?.[id];
    if (exact !== undefined) {
      if (exact !== value) return false;
    } else if (!haystack.includes(value.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function hasActiveCriteria(
  query: string,
  filters: Record<string, string>,
): boolean {
  if (query.trim()) return true;
  return Object.values(filters).some((value) => Boolean(value));
}

export function DataTable({
  columns,
  rows,
  caption,
  emptyMessage = "Nothing here yet.",
  pageSize = DATA_TABLE_PAGE_SIZE,
  searchable = true,
  searchPlaceholder = "Search keywords…",
  filters = [],
}: {
  columns: readonly string[];
  rows: readonly DataTableRow[];
  caption?: string;
  emptyMessage?: string;
  pageSize?: number;
  /** When true (default), shows keyword search and optional filters. */
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: readonly DataTableFilter[];
}) {
  const [page, setPage] = useState(0);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(
    {},
  );

  const showToolbar = searchable || filters.length > 0;

  const indexedRows = useMemo(
    () =>
      rows.map((row) => ({
        row,
        haystack: buildHaystack(row),
      })),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const active = hasActiveCriteria(appliedQuery, appliedFilters);
    if (!active) {
      return indexedRows.map((entry) => entry.row);
    }
    return indexedRows
      .filter((entry) => {
        if (
          appliedQuery.trim() &&
          !matchesSearch(entry.haystack, appliedQuery)
        ) {
          return false;
        }
        return rowMatchesFilters(entry.row, entry.haystack, appliedFilters);
      })
      .map((entry) => entry.row);
  }, [appliedFilters, appliedQuery, indexedRows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const criteriaActive = hasActiveCriteria(appliedQuery, appliedFilters);

  useEffect(() => {
    setPage(0);
  }, [appliedQuery, appliedFilters, rows.length]);

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const visibleRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const from =
    filteredRows.length === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(filteredRows.length, (page + 1) * pageSize);

  function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setAppliedQuery(draftQuery);
    setAppliedFilters({ ...draftFilters });
  }

  function clearSearch() {
    setDraftQuery("");
    setDraftFilters({});
    setAppliedQuery("");
    setAppliedFilters({});
  }

  return (
    <Card className={cn("data-table-card", "panel--neon")}>
      {caption ? <p className="data-table__caption">{caption}</p> : null}
      {showToolbar ? (
        <form className="data-table__toolbar" onSubmit={runSearch}>
          <label className="data-table__search">
            <span className="data-table__search-label">Keywords</span>
            <input
              type="search"
              value={draftQuery}
              placeholder={searchPlaceholder}
              onChange={(event) => setDraftQuery(event.target.value)}
              aria-controls="data-table-body"
            />
          </label>
          {filters.map((filter) => (
            <label key={filter.id} className="data-table__filter">
              <span className="data-table__search-label">{filter.label}</span>
              <select
                value={draftFilters[filter.id] ?? ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    [filter.id]: event.target.value,
                  }))
                }
              >
                {filter.options.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="data-table__toolbar-actions">
            <span
              className="data-table__search-label data-table__search-label--spacer"
              aria-hidden="true"
            >
              Actions
            </span>
            <div className="data-table__toolbar-buttons">
              <Button type="submit">Search</Button>
              <Button
                type="button"
                variant="ghost"
                disabled={
                  !draftQuery.trim() &&
                  !Object.values(draftFilters).some(Boolean) &&
                  !criteriaActive
                }
                onClick={clearSearch}
              >
                Clear
              </Button>
            </div>
          </div>
        </form>
      ) : null}
      <div className="data-table__scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody id="data-table-body">
            {filteredRows.length === 0 ? (
              <tr>
                <td className="data-table__empty" colSpan={columns.length}>
                  {criteriaActive
                    ? "No rows match your search or filters."
                    : emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.key}-${index}`}>{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="data-table__pager">
        <p className="data-table__foot">
          {filteredRows.length === 0
            ? criteriaActive
              ? `0 matches · ${rows.length} total`
              : "0 rows"
            : `Showing ${from}–${to} of ${filteredRows.length}${
                criteriaActive ? ` (filtered from ${rows.length})` : ""
              } · Page ${page + 1} of ${pageCount}`}
        </p>
        <div className="data-table__pager-actions">
          <Button
            type="button"
            variant="ghost"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={page >= pageCount - 1 || filteredRows.length === 0}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
