import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { CreateApp } from "./app.js";
import type { IApp } from "./contracts.js";
import { CreateEntryController } from "./controller/EntryController.js";
import { CreateInMemoryEntryRepository } from "./repository/InMemoryEntryRepository.js";
import { CreatePrismaEntryRepository } from "./repository/PrismaEntryRepository.js";
import { CreateEntryService } from "./service/EntryService.js";
import { CreateLoggingService } from "./service/LoggingService.js";
import type { ILoggingService } from "./service/LoggingService.js";

// Composition root: wires concrete implementations by mode.
export function createComposedApp(
  mode: "memory" | "prisma",
  logger?: ILoggingService,
): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  const repository =
    mode === "prisma"
      ? CreatePrismaEntryRepository(
          new PrismaClient({
            adapter: new PrismaBetterSqlite3({
              url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
            }),
          }),
        )
      : CreateInMemoryEntryRepository();

  const service = CreateEntryService(repository);
  const controller = CreateEntryController(service, resolvedLogger);
  return CreateApp(controller, resolvedLogger);
}
