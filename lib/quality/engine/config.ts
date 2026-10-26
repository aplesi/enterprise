export interface EngineConfig {
  strictMode: boolean
  failThreshold: number
  warningThreshold: number
}

export const DEFAULT_CONFIG: EngineConfig = {
  strictMode: true,
  failThreshold: 80,
  warningThreshold: 90
}
