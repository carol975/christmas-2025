import * as THREE from 'three';
import { DualPosition } from '../types';

export function generateChaosPosition(radius: number = 8): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * radius;

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

export function generateTreePosition(index: number, total: number): THREE.Vector3 {
  const heightRatio = index / total;
  const y = heightRatio * 10 - 2;

  const maxRadius = 3.5;
  const radius = maxRadius * (1 - heightRatio * 0.8);

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = index * goldenAngle;

  const spiralOffset = Math.sin(heightRatio * Math.PI * 8) * 0.3;
  const finalRadius = radius + spiralOffset;

  return new THREE.Vector3(
    Math.cos(theta) * finalRadius,
    y,
    Math.sin(theta) * finalRadius
  );
}

export function generateDualPositions(count: number): DualPosition[] {
  return Array.from({ length: count }, (_, i) => ({
    chaosPosition: generateChaosPosition(),
    targetPosition: generateTreePosition(i, count)
  }));
}

export function lerpVector3(
  start: THREE.Vector3,
  end: THREE.Vector3,
  alpha: number
): THREE.Vector3 {
  return new THREE.Vector3(
    THREE.MathUtils.lerp(start.x, end.x, alpha),
    THREE.MathUtils.lerp(start.y, end.y, alpha),
    THREE.MathUtils.lerp(start.z, end.z, alpha)
  );
}

export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}
