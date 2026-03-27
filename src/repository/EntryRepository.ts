import { Result } from "../lib/result.js";
import { EntryError } from "../lib/errors.js";

// Canonical entry shape used by controllers/views.
export type Entry = {
  id: number;
  title: string;
  body: string;
  tag: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEntryInput = {
  title: string;
  body: string;
  tag?: string;
};

// Repository contract: storage operations with explicit success/error values.
export interface IEntryRepository {
  add(input: CreateEntryInput): Promise<Result<Entry, EntryError>>;
  getById(id: number): Promise<Result<Entry, EntryError>>;
  getAll(): Promise<Result<Entry[], EntryError>>;
}
