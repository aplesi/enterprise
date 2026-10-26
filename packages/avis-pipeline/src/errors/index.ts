export class PipelineError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'PipelineError';
  }
}
