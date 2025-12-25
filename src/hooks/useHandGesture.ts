import { useEffect, useRef, useState } from 'react';
import { HandGesture } from '../types';

export function useHandGesture() {
  const [gesture, setGesture] = useState<HandGesture>({
    isOpen: false,
    position: { x: 0, y: 0, z: 0 }
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Inactive');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!isEnabled) return;

    let mounted = true;

    const initializeHandDetection = async () => {
      try {
        console.log('Initializing hand detection...');
        setStatus('Requesting camera...');

        // Request camera permissions first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });
        console.log('Camera stream obtained');
        setStatus('Camera obtained');

        const videoElement = document.createElement('video');
        videoElement.style.position = 'fixed';
        videoElement.style.top = '10px';
        videoElement.style.right = '10px';
        videoElement.style.width = '200px';
        videoElement.style.height = '150px';
        videoElement.style.zIndex = '1000';
        videoElement.style.border = '2px solid white';
        document.body.appendChild(videoElement);
        videoRef.current = videoElement;

        videoElement.srcObject = stream;
        await videoElement.play();
        console.log('Video element playing');
        setStatus('Loading MediaPipe...');

        // Load MediaPipe from CDN dynamically
        if (!(window as any).Hands) {
          await new Promise((resolve, reject) => {
            const script1 = document.createElement('script');
            script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
            script1.crossOrigin = 'anonymous';
            script1.onload = () => {
              const script2 = document.createElement('script');
              script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
              script2.crossOrigin = 'anonymous';
              script2.onload = resolve as any;
              script2.onerror = reject;
              document.head.appendChild(script2);
            };
            script1.onerror = reject;
            document.head.appendChild(script1);
          });
        }

        console.log('MediaPipe libraries loaded');
        setStatus('Initializing hand detector...');

        const Hands = (window as any).Hands;
        const Camera = (window as any).Camera;

        const hands = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        await hands.initialize();
        console.log('Hands initialized');

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        console.log('Hand detection options set');
        setStatus('Ready - waiting for hand...');

        let frameCount = 0;
        hands.onResults((results: any) => {
          if (!mounted) return;

          frameCount++;
          if (frameCount % 30 === 0) {
            console.log('Results received:', {
              hasHands: results.multiHandLandmarks?.length > 0,
              handCount: results.multiHandLandmarks?.length || 0,
              frameCount
            });
          }

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setStatus('Hand detected!');
            const landmarks = results.multiHandLandmarks[0];

            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const ringTip = landmarks[16];
            const pinkyTip = landmarks[20];

            const palmBase = landmarks[0];

            const distance = (p1: any, p2: any) =>
              Math.sqrt(
                Math.pow(p1.x - p2.x, 2) +
                Math.pow(p1.y - p2.y, 2) +
                Math.pow(p1.z - p2.z, 2)
              );

            const avgDistance = (
              distance(thumbTip, palmBase) +
              distance(indexTip, palmBase) +
              distance(middleTip, palmBase) +
              distance(ringTip, palmBase) +
              distance(pinkyTip, palmBase)
            ) / 5;

            const isOpen = avgDistance > 0.3;

            const wrist = landmarks[0];
            const handCenter = {
              x: (wrist.x - 0.5) * 2,
              y: -(wrist.y - 0.5) * 2,
              z: -wrist.z * 10
            };

            if (frameCount % 30 === 0) {
              console.log('Hand detected:', { isOpen, position: handCenter, avgDistance });
            }

            setGesture({
              isOpen,
              position: handCenter
            });
          } else {
            setStatus('No hand detected');
            setGesture((prev: HandGesture) => ({
              ...prev,
              isOpen: false
            }));
          }
        });

        handsRef.current = hands;

        const camera = new Camera(videoElement, {
          onFrame: async () => {
            if (handsRef.current && mounted) {
              await handsRef.current.send({ image: videoElement });
            }
          },
          width: 1280,
          height: 720
        });

        cameraRef.current = camera;
        await camera.start();
        console.log('Camera started, hand detection active');
        setError(null);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Hand detection initialization failed:', err);
        setError(errorMessage);
        setStatus('Error: ' + errorMessage);
      }
    };

    initializeHandDetection();

    return () => {
      mounted = false;

      if (cameraRef.current) {
        cameraRef.current.stop();
      }

      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.remove();
      }

      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [isEnabled]);

  return {
    gesture,
    isEnabled,
    error,
    status,
    enableDetection: () => setIsEnabled(true),
    disableDetection: () => setIsEnabled(false)
  };
}
