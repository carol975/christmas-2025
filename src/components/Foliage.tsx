import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DualPosition, TreeState } from '../types';
import { generateDualPositions, lerpVector3, smoothStep } from '../utils/positions';

interface FoliageProps {
  count?: number;
  state: TreeState;
}

const vertexShader = `
  attribute vec3 chaosPos;
  attribute vec3 targetPos;
  uniform float progress;
  uniform float time;
  varying vec3 vColor;

  void main() {
    vec3 pos = mix(chaosPos, targetPos, progress);

    float wave = sin(time * 2.0 + pos.y * 0.5) * 0.1 * (1.0 - progress);
    pos.x += wave;
    pos.z += wave;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (8.0 / -mvPosition.z) * (1.0 + progress * 0.5);
    gl_Position = projectionMatrix * mvPosition;

    vColor = mix(
      vec3(0.2, 0.6, 0.3),
      vec3(0.06, 0.3, 0.15),
      progress
    );
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    vec3 goldHighlight = vec3(0.83, 0.69, 0.22) * 0.3;
    vec3 finalColor = vColor + goldHighlight * (1.0 - dist * 2.0);

    gl_FragColor = vec4(finalColor, alpha * 0.9);
  }
`;

export function Foliage({ count = 15000, state }: FoliageProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const progressRef = useRef(state === 'FORMED' ? 1 : 0);

  const { positions, chaosPositions, targetPositions } = useMemo(() => {
    const dualPositions = generateDualPositions(count);
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const pos = new Float32Array(count * 3);

    dualPositions.forEach((dp, i) => {
      chaos[i * 3] = dp.chaosPosition.x;
      chaos[i * 3 + 1] = dp.chaosPosition.y;
      chaos[i * 3 + 2] = dp.chaosPosition.z;

      target[i * 3] = dp.targetPosition.x;
      target[i * 3 + 1] = dp.targetPosition.y;
      target[i * 3 + 2] = dp.targetPosition.z;

      pos[i * 3] = chaos[i * 3];
      pos[i * 3 + 1] = chaos[i * 3 + 1];
      pos[i * 3 + 2] = chaos[i * 3 + 2];
    });

    return { positions: pos, chaosPositions: chaos, targetPositions: target };
  }, [count]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        progress: { value: progressRef.current },
        time: { value: 0 }
      }
    });
  }, []);

  useEffect(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      geometry.setAttribute('chaosPos', new THREE.BufferAttribute(chaosPositions, 3));
      geometry.setAttribute('targetPos', new THREE.BufferAttribute(targetPositions, 3));
    }
  }, [chaosPositions, targetPositions]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const targetProgress = state === 'FORMED' ? 1 : 0;
    const speed = 1.2;
    progressRef.current += (targetProgress - progressRef.current) * speed * delta;
    progressRef.current = THREE.MathUtils.clamp(progressRef.current, 0, 1);

    const smoothProgress = smoothStep(progressRef.current);

    shaderMaterial.uniforms.progress.value = smoothProgress;
    shaderMaterial.uniforms.time.value += delta;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
}
