import React from 'react';

export function DebugOverlay({ gameState }) {
  if (!gameState || !gameState.showDebug) return null;

  const {
    fps = 60,
    posX = '0.00',
    posY = '0.00',
    posZ = '0.00',
    biome = 'Plains',
    timeOfDay = 0.25,
    gameMode = 'survival',
  } = gameState;

  const blockX = Math.floor(parseFloat(posX));
  const blockY = Math.floor(parseFloat(posY));
  const blockZ = Math.floor(parseFloat(posZ));
  const chunkX = Math.floor(blockX / 16);
  const chunkZ = Math.floor(blockZ / 16);

  const timeHour = Math.floor(timeOfDay * 24);
  const timeMin = Math.floor((timeOfDay * 24 * 60) % 60);
  const timeFormatted = `${String(timeHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}`;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 p-3 flex justify-between text-xs text-white select-none font-mono"
      style={{
        textShadow: '1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000',
        fontFamily: "'Minecraft', 'Courier New', monospace",
      }}
    >
      {/* Left Column */}
      <div className="flex flex-col gap-1 max-w-sm">
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Minecraft 3D (Three.js WebGL Engine)
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          {fps} fps ({(1000 / Math.max(1, fps)).toFixed(1)} ms)
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          XYZ: {posX} / {posY} / {posZ}
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Block: {blockX} {blockY} {blockZ} [Chunk: {chunkX}, {chunkZ}]
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Biome: <span className="text-green-300 font-bold">{biome}</span>
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Day Time: {timeFormatted} ({(timeOfDay * 100).toFixed(1)}%)
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Game Mode: <span className="text-yellow-300 uppercase">{gameMode}</span>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-1 items-end max-w-sm text-right">
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Resolution: {window.innerWidth} x {window.innerHeight}
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Voxel Mesher: 4-Corner Smooth Ambient Occlusion
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Audio Engine: 100% Web Audio Synthesized
        </div>
        <div className="bg-black/45 px-2 py-0.5 rounded-xs inline-block">
          Physics: Swept AABB & Step Climbing
        </div>
      </div>
    </div>
  );
}
