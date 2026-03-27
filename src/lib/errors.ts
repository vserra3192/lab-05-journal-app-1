// Typed domain/application errors used in Result<..., EntryError> flows.
export type EntryError =
  | { name: "EntryNotFound"; message: string }
  | { name: "InvalidContent"; message: string }
  | { name: "ValidationError"; message: string }
  | { name: "UnexpectedDependencyError"; message: string };

export const EntryNotFound = (message: string): EntryError => ({
  name: "EntryNotFound",
  message,
});

export const InvalidContent = (message: string): EntryError => ({
  name: "InvalidContent",
  message,
});

export const ValidationError = (message: string): EntryError => ({
  name: "ValidationError",
  message,
});

export const UnexpectedDependencyError = (message: string): EntryError => ({
  name: "UnexpectedDependencyError",
  message,
});
