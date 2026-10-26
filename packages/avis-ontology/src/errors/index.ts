export class OntologyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OntologyError';
  }
}

export class ValidationError extends OntologyError {
  constructor(message: string, public readonly issues?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SchemaError extends OntologyError {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaError';
  }
}

export class TaxonomyError extends OntologyError {
  constructor(message: string) {
    super(message);
    this.name = 'TaxonomyError';
  }
}

export class RelationshipError extends OntologyError {
  constructor(message: string) {
    super(message);
    this.name = 'RelationshipError';
  }
}

export class EntityError extends OntologyError {
  constructor(message: string) {
    super(message);
    this.name = 'EntityError';
  }
}
