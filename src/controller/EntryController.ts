import type { Response } from "express";
import { IEntryService } from "../service/EntryService.js";
import { ILoggingService } from "../service/LoggingService.js";
import { EntryError } from "../lib/errors.js";

// Controller methods map service Results to HTTP status + rendered output.
export interface IEntryController {
  showEntries(res: Response): Promise<void>;
  createFromForm(res: Response, title: string, body: string, tag: string): Promise<void>;
  searchEntries(res: Response, q: string): Promise<void>;
}

class EntryController implements IEntryController {
  constructor(
    private readonly service: IEntryService,
    private readonly logger: ILoggingService,
  ) {}

  private isEntryError(value: unknown): value is EntryError {
    return (
      typeof value === "object" &&
      value !== null &&
      "name" in value &&
      "message" in value
    );
  }

  private mapErrorStatus(error: EntryError): number {
    if (error.name === "EntryNotFound") return 404;
    if (error.name === "InvalidContent" || error.name === "ValidationError") return 400;
    return 500;
  }

  // Shared helper for HTMX responses that only need the list fragment.
  private async renderEntryList(res: Response): Promise<void> {
    const entriesResult = await this.service.listEntries();
    if (!entriesResult.ok) {
      res.status(500).render("entries/partials/error", { message: "Unable to load entries." });
      return;
    }

    res.render("entries/partials/entryList", { entries: entriesResult.value });
  }

  async showEntries(res: Response): Promise<void> {
    this.logger.info("Rendering entries page");
    const entriesResult = await this.service.listEntries();
    if (!entriesResult.ok) {
      const message = this.isEntryError(entriesResult.value)
        ? entriesResult.value.message
        : "Unable to load entries.";
      res.status(500).render("entries/index", { entries: [], pageError: message });
      return;
    }

    res.render("entries/index", { entries: entriesResult.value, pageError: null });
  }

  async createFromForm(res: Response, title: string, body: string, tag: string): Promise<void> {
    this.logger.info("Creating entry from form");
    const result = await this.service.createEntry({ title, body, tag });

    if (!result.ok && this.isEntryError(result.value)) {
      const error = result.value;
      const status = this.mapErrorStatus(error);
      if (status === 400) {
        this.logger.warn(`Create entry rejected: ${error.message}`);
      } else {
        this.logger.error(`Create entry failed: ${error.message}`);
      }
      res.status(status).render("entries/partials/error", { message: error.message });
      return;
    }

    if (!result.ok) {
      res.status(500).render("entries/partials/error", { message: "Unable to create entry." });
      return;
    }

    await this.renderEntryList(res);
  }

   async searchEntries(res: Response, q: string): Promise<void> {
    this.logger.info(`Searching entries with query: ${q}`);

    const result = await this.service.search(q);

    // Handle domain errors
    if (!result.ok && this.isEntryError(result.value)) {
      const error = result.value;
      const status = this.mapErrorStatus(error);

      if (status === 400) {
        this.logger.warn(`Search rejected: ${error.message}`);
      } else {
        this.logger.error(`Search failed: ${error.message}`);
      }

      return res
        .status(status)
        .render("entries/partials/error", { message: error.message });
    }

    // Handle unknown failure
    if (!result.ok) {
      return res
        .status(500)
        .render("entries/partials/error", { message: "Unable to search entries." });
    }

    const entries = result.value;

    // HTMX request → return partial only
    if (res.req.headers["hx-request"]) {
      return res.render("entries/partials/entryList", { entries });
    }

    // Normal request → render full page
    return res.render("entries/index", {
      entries,
      pageError: null,
    });
  }
}

export function CreateEntryController(
  service: IEntryService,
  logger: ILoggingService,
): IEntryController {
  return new EntryController(service, logger);
}
