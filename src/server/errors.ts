export type ErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "DUPLICATE_NAME"
  | "EMPTY_QUEUE"
  | "STALE"
  | "INVALID_STATE";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  VALIDATION: 400,
  DUPLICATE_NAME: 409,
  EMPTY_QUEUE: 409,
  STALE: 409,
  INVALID_STATE: 409,
};

/** An expected, user-facing failure. `message` is shown to the manager as-is. */
export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.status = STATUS[code];
  }
}
