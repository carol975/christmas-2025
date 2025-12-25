import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TreeState } from '../types';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import * as THREE from 'three';

function CameraController({ position, enabled }: { position: [number, number, number]; enabled: boolean }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(...position));
  const lookAtTarget = useRef(new THREE.Vector3(0, 4, 0));

  useFrame(() => {
    if (enabled) {
      targetPosition.current.set(position[0], position[1], position[2]);

      // Smooth camera movement
      camera.position.lerp(targetPosition.current, 0.1);
      camera.lookAt(lookAtTarget.current);
    }
  });

  return null;
}

interface SceneProps {
  state: TreeState;
  cameraPosition?: [number, number, number];
  imageUrls?: string[];
  handControlActive?: boolean;
}

export function Scene({
  state,
  cameraPosition = [0, 4, 20],
  imageUrls,
  handControlActive = false
}: SceneProps) {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
      <CameraController position={cameraPosition} enabled={handControlActive} />
      {!handControlActive && (
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2 + 0.5}
        />
      )}

      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[0, 8, 0]} intensity={1} color="#d4af37" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#d4af37" />
      <pointLight position={[5, 3, -5]} intensity={0.5} color="#d4af37" />

      <Suspense fallback={null}>
        <Environment preset="lobby" />

        <Foliage state={state} count={15000} />
        <Ornaments state={state} />
        <Polaroids state={state} imageUrls={imageUrls} />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      <fog attach="fog" args={['#0a3a2a', 20, 50]} />
    </Canvas>
  );
}
