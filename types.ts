export interface Material {
  id: string;
  name: string;
  type: string;
  baseToughness: number; // In Joules (approximate for standard sample)
  color: string;
  description: string;
  fractureType: 'Ductile' | 'Brittle' | 'Mixed';
}

export interface PendulumConfig {
  mass: number; // kg
  length: number; // meters
  startAngle: number; // degrees
}

export interface TestResult {
  id: string;
  timestamp: number;
  material: Material;
  initialEnergy: number; // Joules
  absorbedEnergy: number; // Joules
  finalAngle: number; // degrees
  didBreak: boolean;
}

export enum SimulationState {
  IDLE = 'IDLE',
  SWINGING_DOWN = 'SWINGING_DOWN',
  IMPACT = 'IMPACT',
  SWINGING_UP = 'SWINGING_UP',
  OSCILLATING = 'OSCILLATING',
  FINISHED = 'FINISHED',
}