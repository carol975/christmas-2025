import { useEffect, useState } from 'react';
import { Scene } from './components/Scene';
import { TreeState } from './types';
import { useHandGesture } from './hooks/useHandGesture';

function App() {
  const [treeState, setTreeState] = useState<TreeState>('FORMED');
  const { gesture, isEnabled, error, status, enableDetection, disableDetection } = useHandGesture();

  useEffect(() => {
    if (isEnabled) {
      setTreeState(gesture.isOpen ? 'CHAOS' : 'FORMED');
    }
  }, [gesture.isOpen, isEnabled]);

  const toggleGestureControl = () => {
    if (isEnabled) {
      disableDetection();
      setTreeState('FORMED');
    } else {
      enableDetection();
    }
  };

  const manualToggle = () => {
    if (!isEnabled) {
      setTreeState(prev => prev === 'CHAOS' ? 'FORMED' : 'CHAOS');
    }
  };

  const cameraPosition: [number, number, number] = isEnabled
    ? [gesture.position.x * 10, 4 + gesture.position.y * 5, 20 + gesture.position.z]
    : [0, 4, 20];

  return (
    <div className="relative w-full h-screen">
      <Scene state={treeState} cameraPosition={cameraPosition} handControlActive={isEnabled} />

      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <h1 className="text-4xl font-bold text-gold-luxe drop-shadow-lg text-center tracking-wider">
          Merry Christmas And Happy 2026!
        </h1>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
        <button
          onClick={manualToggle}
          disabled={isEnabled}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            isEnabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gold-luxe text-emerald-deep hover:scale-105 hover:shadow-lg'
          }`}
        >
          {treeState === 'CHAOS' ? 'Form Tree' : 'Unleash Chaos'}
        </button>

        <button
          onClick={toggleGestureControl}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            isEnabled
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-emerald-deep text-gold-luxe border-2 border-gold-luxe hover:scale-105'
          }`}
        >
          {isEnabled ? 'Disable Hand Control' : 'Enable Hand Control'}
        </button>
      </div>

      {isEnabled && (
        <div className="absolute top-8 right-8 bg-black/50 text-white px-4 py-3 rounded-lg backdrop-blur-sm z-10 max-w-xs">
          <p className="text-sm font-semibold mb-1">Hand Control Active</p>
          <p className="text-xs text-yellow-300 mb-2">Status: {status}</p>
          {error ? (
            <p className="text-xs text-red-400">Error: {error}</p>
          ) : (
            <>
              <p className="text-xs">
                {gesture.isOpen ? '✋ Hand Open - CHAOS' : '✊ Hand Closed - FORMED'}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Move your hand to control camera
              </p>
              <p className="text-xs opacity-50 mt-2 font-mono">
                x: {gesture.position.x.toFixed(2)} y: {gesture.position.y.toFixed(2)} z: {gesture.position.z.toFixed(2)}
              </p>
            </>
          )}
        </div>
      )}

      <div className="absolute bottom-8 right-8 text-gold-luxe text-xs opacity-70 z-10 text-right">
        <p>State: <span className="font-bold">{treeState}</span></p>
        <p className="mt-1">React 19 • Three.js • R3F</p>
      </div>
    </div>
  );
}

export default App;
