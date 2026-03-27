import { describe, expect, it } from "@jest/globals";
import { CreateInMemoryEntryRepository } from "../../src/repository/InMemoryEntryRepository.js";
import { CreateEntryService } from "../../src/service/EntryService.js";

// Unit tests target service + repository behavior without HTTP routes.
describe("EntryService unit tests", () => {
  it("returns Ok for valid input", async () => {
    const service = CreateEntryService(CreateInMemoryEntryRepository());

    const result = await service.createEntry({
      title: "Valid title",
      body: "This body is long enough",
      tag: "general",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("Valid title");
      expect(result.value.tag).toBe("general");
    }
  });

  it("returns Err for invalid input", async () => {
    const service = CreateEntryService(CreateInMemoryEntryRepository());

    const result = await service.createEntry({
      title: "No",
      body: "short",
      tag: "BAD TAG",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("ValidationError");
    }
  });

  it("filters by status for valid values", async () => {
    const service = CreateEntryService(CreateInMemoryEntryRepository());

    const first = await service.createEntry({
      title: "Entry one",
      body: "Body for entry one",
      tag: "general",
    });
    const second = await service.createEntry({
      title: "Entry two",
      body: "Body for entry two",
      tag: "general",
    });

    if (first.ok) {
      await service.toggleEntry(first.value.id);
    }
    if (second.ok) {
      await service.toggleEntry(second.value.id);
    }

    const completed = await service.filterEntriesByStatus("completed");
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.value.length).toBe(2);
      expect(completed.value.every(entry => entry.status === "completed")).toBe(true);
    }
  });

  it("returns Err for invalid status filter", async () => {
    const service = CreateEntryService(CreateInMemoryEntryRepository());
    const result = await service.filterEntriesByStatus("done");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("ValidationError");
    }
  });
});
