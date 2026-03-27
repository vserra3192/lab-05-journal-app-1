import { beforeEach, afterAll, describe, expect, it } from "@jest/globals";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createComposedApp } from "../../src/composition.js";

// E2E tests verify route-level behavior through Express + Supertest.
function runSuite(mode: "memory" | "prisma") {
  describe(`Entries routes e2e tests (${mode})`, () => {
    const prisma =
      mode === "prisma"
        ? new PrismaClient({
            adapter: new PrismaBetterSqlite3({
              url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
            }),
          })
        : null;

    beforeEach(async () => {
      if (prisma) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Entry" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "title" TEXT NOT NULL,
            "body" TEXT NOT NULL,
            "tag" TEXT NOT NULL DEFAULT 'general',
            "status" TEXT NOT NULL DEFAULT 'active',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await prisma.entry.deleteMany();
      }
    });

    afterAll(async () => {
      if (prisma) {
        await prisma.$disconnect();
      }
    });

    it("GET /entries renders the entries page", async () => {
      const app = createComposedApp(mode).getExpressApp();
      const response = await request(app).get("/entries");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Homework 2 Entries");
    });

    it("POST /entries/new returns an error fragment for invalid input", async () => {
      const app = createComposedApp(mode).getExpressApp();
      const response = await request(app)
        .post("/entries/new")
        .type("form")
        .send({ title: "No", body: "short", tag: "BAD TAG" });

      expect(response.status).toBe(400);
      expect(response.text).toContain("Entry Error");
    });

    it("GET /entries/filter returns an error fragment for invalid status", async () => {
      const app = createComposedApp(mode).getExpressApp();
      const response = await request(app).get("/entries/filter").query({ status: "done" });

      expect(response.status).toBe(400);
      expect(response.text).toContain("Status filter must be all, active, or completed.");
    });
  });
}

runSuite("memory");
runSuite("prisma");
