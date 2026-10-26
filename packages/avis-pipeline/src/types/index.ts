import { Entity } from 'avis-ontology';
import { Scene } from 'avis-scene-builder';
import { DecisionObject } from 'avis-rule-engine';

export interface PipelineContext {
  articleId: string;
  rawSeedData: unknown;
  targetEntityId: string;
}

export interface PipelineResult {
  articleId: string;
  entity: Entity;
  decision: DecisionObject;
  scene: Scene;
  prompt: string;
}
