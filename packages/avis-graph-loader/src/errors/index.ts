export class GraphLoadError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'GraphLoadError';
  }
}

export class TraversalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TraversalError';
  }
}
