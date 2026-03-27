import { PrismaClient } from "@prisma/client";
import { Err, Ok, Result } from "../lib/result.js";
import {
  EntryError,
  EntryNotFound,
  UnexpectedDependencyError,
  ValidationError,
} from "../lib/errors.js";
import { CreateEntryInput, Entry, IEntryRepository } from "./EntryRepository.js";

// Convert Prisma model values to the app-level Entry shape.
function toEntry(model: {
  id: number;
  title: string;
  body: string;
  tag: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Entry {
  return {
    id: model.id,
    title: model.title,
    body: model.body,
    tag: model.tag,
    status: model.status,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

class PrismaEntryRepository implements IEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async add(input: CreateEntryInput): Promise<Result<Entry, EntryError>> {
    const title = String(input.title ?? "").trim();
    const body = String(input.body ?? "").trim();
    const tag = String(input.tag ?? "general").trim().toLowerCase();

    if (!title || !body) {
      return Err(ValidationError("Repository received empty title or body."));
    }

    try {
      const created = await this.prisma.entry.create({
        data: { title, body, tag },
      });
      return Ok(toEntry(created));
    } catch {
      // DB/driver failures are mapped to a typed dependency error.
      return Err(UnexpectedDependencyError("Database write failed while creating entry."));
    }
  }

  async getById(id: number): Promise<Result<Entry, EntryError>> {
    try {
      const row = await this.prisma.entry.findUnique({ where: { id } });
      if (!row) {
        return Err(EntryNotFound(`Entry with id ${id} not found.`));
      }
      return Ok(toEntry(row));
    } catch {
      return Err(UnexpectedDependencyError("Database read failed while loading entry."));
    }
  }

  async getAll(): Promise<Result<Entry[], EntryError>> {
    try {
      const rows = await this.prisma.entry.findMany({ orderBy: { id: "desc" } });
      return Ok(rows.map(toEntry));
    } catch {
      return Err(UnexpectedDependencyError("Database read failed while listing entries."));
    }
  }
}

export function CreatePrismaEntryRepository(prisma: PrismaClient): IEntryRepository {
  return new PrismaEntryRepository(prisma);
}
