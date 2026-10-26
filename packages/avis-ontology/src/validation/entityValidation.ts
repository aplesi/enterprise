import { EntitySchema } from '../schemas';
import { Entity } from '../types';

export interface ValidationResult {
  success: boolean;
  data?: Entity;
  errors?: any;
}

/**
 * Safely parses raw data without throwing errors.
 * Useful for validating API inputs or untrusted KV store data.
 * @param rawData The unknown data
 */
export function validateEntity(rawData: unknown): ValidationResult {
  const result = EntitySchema.safeParse(rawData);
  if (result.success) {
    return { success: true, data: result.data as Entity };
  } else {
    return { success: false, errors: result.error.format() };
  }
}
