import path from "node:path";
import express, { Request, RequestHandler, Response } from "express";
import Layouts from "express-ejs-layouts";
import { IApp } from "./contracts.js";
import { IEntryController } from "./controller/EntryController.js";
import { ILoggingService } from "./service/LoggingService.js";

// Async handler wrapper so route methods can use await safely.
type AsyncRequestHandler = RequestHandler;

function asyncHandler(fn: AsyncRequestHandler) {
  return function wrapped(req: Request, res: Response, next: (value?: unknown) => void) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

class ExpressApp implements IApp {
  private readonly app: express.Express;

  constructor(
    private readonly controller: IEntryController,
    private readonly logger: ILoggingService,
  ) {
    this.app = express();
    this.registerMiddleware();
    this.registerTemplating();
    this.registerRoutes();
  }

  private registerMiddleware(): void {
    // Static assets + form parser + layout support.
    this.app.use(express.static(path.join(process.cwd(), "static")));
    this.app.use(Layouts);
    this.app.use(express.urlencoded({ extended: true }));
  }

  private registerTemplating(): void {
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(process.cwd(), "src/views"));
    this.app.set("layout", "layouts/base");
  }

  private registerRoutes(): void {
    // Routes stay thin: parse request input, then delegate to controller.
    this.app.get(
      "/",
      asyncHandler(async (_req, res) => {
        this.logger.info("GET /");
        res.redirect("/entries");
      }),
    );

    this.app.get(
      "/entries",
      asyncHandler(async (_req, res) => {
        this.logger.info("GET /entries");
        await this.controller.showEntries(res);
      }),
    );

    this.app.post(
      "/entries/new",
      asyncHandler(async (req, res) => {
        const title = typeof req.body.title === "string" ? req.body.title : "";
        const body = typeof req.body.body === "string" ? req.body.body : "";
        const tag = typeof req.body.tag === "string" ? req.body.tag : "general";
        await this.controller.createFromForm(res, title, body, tag);
      }),
    );

    this.app.use((err: unknown, _req: Request, res: Response, _next: (value?: unknown) => void) => {
      const message = err instanceof Error ? err.message : "Unexpected server error.";
      this.logger.error(message);
      res.status(500).render("entries/partials/error", { message: "Unexpected server error." });
    });
  }

  getExpressApp(): express.Express {
    return this.app;
  }
}

export function CreateApp(controller: IEntryController, logger: ILoggingService): IApp {
  return new ExpressApp(controller, logger);
}
