import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, OrnamentConfig } from '../types';
import { generateChaosPosition, generateTreePosition, lerpVector3, smoothStep } from '../utils/positions';

interface OrnamentsProps {
  state: TreeState;
}

interface OrnamentInstance {
  config: OrnamentConfig;
  chaosPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  chaosRotation: THREE.Euler;
  targetRotation: THREE.Euler;
}

const ORNAMENT_CONFIGS: OrnamentConfig[] = [
  { type: 'gift', color: new THREE.Color('#d4af37'), weight: 3.0, scale: 0.3 },
  { type: 'gift', color: new THREE.Color('#c0c0c0'), weight: 3.0, scale: 0.28 },
  { type: 'gift', color: new THREE.Color('#8b0000'), weight: 3.0, scale: 0.32 },

  { type: 'ball', color: new THREE.Color('#d4af37'), weight: 1.5, scale: 0.25 },
  { type: 'ball', color: new THREE.Color('#ff1744'), weight: 1.5, scale: 0.22 },
  { type: 'ball', color: new THREE.Color('#ffffff'), weight: 1.5, scale: 0.24 },
  { type: 'ball', color: new THREE.Color('#0f4c3a'), weight: 1.5, scale: 0.26 },

  { type: 'light', color: new THREE.Color('#fff9c4'), weight: 0.5, scale: 0.15 },
  { type: 'light', color: new THREE.Color('#d4af37'), weight: 0.5, scale: 0.12 },
  { type: 'light', color: new THREE.Color('#ffeb3b'), weight: 0.5, scale: 0.13 },
];

function createGiftGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  return geometry;
}

function createBallGeometry(): THREE.BufferGeometry {
  return new THREE.SphereGeometry(1, 16, 16);
}

function createLightGeometry(): THREE.BufferGeometry {
  return new THREE.SphereGeometry(1, 8, 8);
}

export function Ornaments({ state }: OrnamentsProps) {
  const instances = useMemo(() => {
    const result: OrnamentInstance[] = [];
    const totalOrnaments = 200;

    for (let i = 0; i < totalOrnaments; i++) {
      const config = ORNAMENT_CONFIGS[Math.floor(Math.random() * ORNAMENT_CONFIGS.length)];

      const instance: OrnamentInstance = {
        config,
        chaosPosition: generateChaosPosition(10),
        targetPosition: generateTreePosition(
          Math.floor(i * (15000 / totalOrnaments)),
          15000
        ).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.5
        )),
        chaosRotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        targetRotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      };

      result.push(instance);
    }

    return result;
  }, []);

  return (
    <group>
      <OrnamentGroup
        instances={instances.filter(i => i.config.type === 'gift')}
        geometry={createGiftGeometry()}
        state={state}
      />
      <OrnamentGroup
        instances={instances.filter(i => i.config.type === 'ball')}
        geometry={createBallGeometry()}
        state={state}
      />
      <OrnamentGroup
        instances={instances.filter(i => i.config.type === 'light')}
        geometry={createLightGeometry()}
        state={state}
        emissive
      />
    </group>
  );
}

interface OrnamentGroupProps {
  instances: OrnamentInstance[];
  geometry: THREE.BufferGeometry;
  state: TreeState;
  emissive?: boolean;
}

function OrnamentGroup({ instances, geometry, state, emissive = false }: OrnamentGroupProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef(state === 'FORMED' ? 1 : 0);

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const rotation = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetProgress = state === 'FORMED' ? 1 : 0;
    progressRef.current += (targetProgress - progressRef.current) * 0.8 * delta;
    progressRef.current = THREE.MathUtils.clamp(progressRef.current, 0, 1);

    const smoothProgress = smoothStep(progressRef.current);

    instances.forEach((instance, i) => {
      const weightedProgress = THREE.MathUtils.clamp(
        smoothProgress * (1 + instance.config.weight * 0.1),
        0,
        1
      );

      position.copy(
        lerpVector3(instance.chaosPosition, instance.targetPosition, weightedProgress)
      );

      const chaosQuat = new THREE.Quaternion().setFromEuler(instance.chaosRotation);
      const targetQuat = new THREE.Quaternion().setFromEuler(instance.targetRotation);
      rotation.copy(chaosQuat.slerp(targetQuat, weightedProgress));

      scale.setScalar(instance.config.scale);

      matrix.compose(position, rotation, scale);
      meshRef.current!.setMatrixAt(i, matrix);
      meshRef.current!.setColorAt(i, instance.config.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, instances.length]}>
      <meshStandardMaterial
        metalness={0.8}
        roughness={0.2}
        emissive={emissive ? new THREE.Color('#d4af37') : undefined}
        emissiveIntensity={emissive ? 2.0 : 0}
      />
    </instancedMesh>
  );
}
