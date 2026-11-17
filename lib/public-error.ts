/**
 * An error whose message is written for the person using the app and is safe
 * to show. Anything else that gets thrown (database, AI provider, parser,
 * missing-key hints) can carry internal details, so routes show a generic
 * line for those instead (see publicMessage).
 */
export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}

export function publicMessage(err: unknown, fallback: string): string {
  return err instanceof PublicError ? err.message : fallback;
}
