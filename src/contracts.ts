import type express from "express";

// Small app boundary used by server startup and tests.
export interface IApp {
  getExpressApp(): express.Express;
}

// Runtime process boundary for "listen on port".
export interface IServer {
  start(port: number): void;
}
