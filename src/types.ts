import * as THREE from 'three';

export type TreeState = 'CHAOS' | 'FORMED';

export interface DualPosition {
  chaosPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
}

export interface OrnamentConfig {
  type: 'gift' | 'ball' | 'light';
  color: THREE.Color;
  weight: number;
  scale: number;
}

export interface PolaroidConfig {
  imageUrl: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

export interface HandGesture {
  isOpen: boolean;
  position: { x: number; y: number; z: number };
}
