import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { generateChaosPosition, generateTreePosition, lerpVector3, smoothStep } from '../utils/positions';

interface PolatoidsProps {
  state: TreeState;
  imageUrls?: string[];
}

interface PolaroidInstance {
  chaosPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  chaosRotation: THREE.Euler;
  targetRotation: THREE.Euler;
  imageIndex: number;
}

const DEFAULT_IMAGES = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Q0YWYzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjMwIiBmaWxsPSIjMGY0YzNhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj4yMDI1PC90ZXh0Pjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzBmNGMzYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjZDRhZjM3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7imIU8L3RleHQ+PC9zdmc+',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZmZmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjUwIiBmaWxsPSIjZmYxNzQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7wn46EPC90ZXh0Pjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2MwYzBjMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjUwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7wn46BPC90ZXh0Pjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Q0YWYzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7inJg8L3RleHQ+PC9zdmc+',
];

function PolaroidMesh({ instance, texture, state }: {
  instance: PolaroidInstance;
  texture: THREE.Texture;
  state: TreeState;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(state === 'FORMED' ? 1 : 0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetProgress = state === 'FORMED' ? 1 : 0;
    progressRef.current += (targetProgress - progressRef.current) * 0.7 * delta;
    progressRef.current = THREE.MathUtils.clamp(progressRef.current, 0, 1);

    const smoothProgress = smoothStep(progressRef.current);

    const position = lerpVector3(
      instance.chaosPosition,
      instance.targetPosition,
      smoothProgress
    );

    const chaosQuat = new THREE.Quaternion().setFromEuler(instance.chaosRotation);
    const targetQuat = new THREE.Quaternion().setFromEuler(instance.targetRotation);
    const rotation = chaosQuat.slerp(targetQuat, smoothProgress);

    meshRef.current.position.copy(position);
    meshRef.current.quaternion.copy(rotation);
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.1, 1.3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial map={texture} roughness={0.6} metalness={0.0} />
      </mesh>

      <mesh position={[0, -0.5, 0.001]}>
        <planeGeometry args={[0.9, 0.3]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} metalness={0.0} />
      </mesh>
    </group>
  );
}

export function Polaroids({ state, imageUrls = DEFAULT_IMAGES }: PolatoidsProps) {
  const textures = useLoader(THREE.TextureLoader, imageUrls);

  const instances = useMemo(() => {
    const result: PolaroidInstance[] = [];
    const count = Math.min(imageUrls.length * 3, 30);

    for (let i = 0; i < count; i++) {
      const treePos = generateTreePosition(
        Math.floor(i * (15000 / count)) + Math.floor(Math.random() * 500),
        15000
      );

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 1.5
      );

      const radiusOffset = treePos.clone().normalize().multiplyScalar(0.8);

      const instance: PolaroidInstance = {
        chaosPosition: generateChaosPosition(12),
        targetPosition: treePos.add(offset).add(radiusOffset),
        chaosRotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        targetRotation: new THREE.Euler(
          (Math.random() - 0.5) * 0.3,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.2
        ),
        imageIndex: i % imageUrls.length
      };

      result.push(instance);
    }

    return result;
  }, [imageUrls.length]);

  return (
    <group>
      {instances.map((instance, i) => (
        <PolaroidMesh
          key={i}
          instance={instance}
          texture={textures[instance.imageIndex]}
          state={state}
        />
      ))}
    </group>
  );
}
