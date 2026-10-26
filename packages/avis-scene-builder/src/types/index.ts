import { Entity } from 'avis-ontology';

export interface SceneMetadata {
  version: string;
  sourceEntityId: string;
  timestamp: string;
}

export interface SceneObject {
  entityId: string;
  role: 'SUBJECT' | 'SUPPORTING' | 'ENVIRONMENT_PROP';
  visualAttributes: Record<string, unknown>;
}

export interface SceneRelationship {
  sourceId: string;
  targetId: string;
  spatialRelation: string; // e.g., "next_to", "above", "inside"
}

export interface Composition {
  framing: string; // e.g., "close_up", "wide_shot"
  perspective: string; // e.g., "eye_level", "top_down"
  focus: string; // e.g., "subject", "background"
}

export interface Camera {
  lens: string; // e.g., "macro", "wide_angle"
  aperture: string; // e.g., "f/1.8", "f/8"
  motion: string; // e.g., "static", "panning"
}

export interface Lighting {
  type: string; // e.g., "natural", "studio", "harsh"
  direction: string; // e.g., "top", "backlight"
  intensity: string; // e.g., "bright", "dim"
}

export interface Environment {
  locationType: string; // e.g., "underwater", "pond_surface", "laboratory"
  timeOfDay: string; // e.g., "morning", "night"
  weather: string; // e.g., "clear", "rain"
}

export interface RenderingHints {
  style: string; // e.g., "photorealistic", "illustration", "diagram"
  quality: string; // e.g., "high_res", "masterpiece"
}

export interface Scene {
  metadata: SceneMetadata;
  subject: SceneObject;
  supportingObjects: SceneObject[];
  environment: Environment;
  camera: Camera;
  composition: Composition;
  lighting: Lighting;
  colorPalette: string[];
  visualConstraints: string[];
  negativeConstraints: string[];
  relationships: SceneRelationship[];
  renderingHints: RenderingHints;
}
