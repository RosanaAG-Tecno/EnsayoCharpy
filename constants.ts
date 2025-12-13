import { Material, PendulumConfig } from './types';

export const DEFAULT_CONFIG: PendulumConfig = {
  mass: 20, // kg
  length: 0.8, // meters
  startAngle: 135, // degrees
};

export const GRAVITY = 9.81;

export const MATERIALS: Material[] = [
  {
    id: 'steel-1045',
    name: 'Acero AISI 1045',
    type: 'Metal',
    baseToughness: 180, // High toughness
    color: '#64748b',
    description: 'Acero de medio carbono. Alta resistencia y buena tenacidad al impacto.',
    fractureType: 'Ductile'
  },
  {
    id: 'al-6061',
    name: 'Aluminio 6061',
    type: 'Metal',
    baseToughness: 90, // Medium toughness
    color: '#cbd5e1',
    description: 'Aleación de aluminio endurecida. Versátil, ligera y tenacidad moderada.',
    fractureType: 'Mixed'
  },
  {
    id: 'cast-iron',
    name: 'Hierro Fundido Gris',
    type: 'Metal',
    baseToughness: 15, // Very brittle
    color: '#475569',
    description: 'Material frágil con baja resistencia al impacto pero alta amortiguación.',
    fractureType: 'Brittle'
  },
  {
    id: 'titanium-grade5',
    name: 'Titanio Grado 5',
    type: 'Metal',
    baseToughness: 210, // Very high
    color: '#94a3b8',
    description: 'Excelente relación resistencia-peso y resistencia a la corrosión.',
    fractureType: 'Ductile'
  },
  {
    id: 'pvc-rigid',
    name: 'PVC Rígido',
    type: 'Polímero',
    baseToughness: 10, // Brittle at high speed impact
    color: '#e2e8f0',
    description: 'Termoplástico común. Comportamiento frágil bajo impacto a alta velocidad.',
    fractureType: 'Brittle'
  }
];