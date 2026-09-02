import React, { useState } from 'react';
import * as THREE from 'three';
import { sound } from '../game/audio/SoundSynthesizer.js';
import { worldStorage } from '../game/storage/WorldStorage.js';

export function PauseMenu({ game, onResume, onUpdate }) {
  const [renderDist, setRenderDist] = useState(game.chunkManager.renderDistance || 5);
  const [fov, setFov] = useState(game.cameraController.baseFov || 75);
  const [masterVol, setMasterVol] = useState(Math.round(sound.masterVolume * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(sound.sfxVolume * 100));
  const [musicVol, setMusicVol] = useState(Math.round(sound.musicVolume * 100));
  const [audioEnabled, setAudioEnabled] = useState(!sound.muted);
  const [gameMode, setGameMode] = useState(game.player.gameMode);
  const [headBob, setHeadBob] = useState(game.cameraController.enableBobbing);
  const [saveStatus, setSaveStatus] = useState('');

  // Save World Handler
  const handleSave = async () => {
    setSaveStatus('Saving world state...');
    await game.autoSave();
    setTimeout(() => setSaveStatus('World saved to browser IndexedDB!'), 500);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // Export World Handler
  const handleExport = async () => {
    const saveData = {
      playerPos: { x: game.player.physics.position.x, y: game.player.physics.position.y, z: game.player.physics.position.z },
      health: game.player.health,
      hunger: game.player.hunger,
      inventory: game.player.inventory,
      timeOfDay: game.skybox.timeOfDay,
      gameMode: game.player.gameMode,
    };
    worldStorage.exportToJson(saveData);
  };

  // Import World Handler
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const data = worldStorage.importFromJson(content);
        if (data) {
          await game.loadSaveData(data);
          setSaveStatus('World successfully imported!');
          setTimeout(() => setSaveStatus(''), 3000);
          onUpdate();
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none">
      <div
        className="w-[460px] bg-[#222222] p-6 rounded-xs border-4 border-[#555555] shadow-2xl text-white font-mono"
        style={{
          fontFamily: "'Minecraft', 'Courier New', monospace",
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-5 tracking-wider text-yellow-400 drop-shadow">
          GAME MENU
        </h2>

        {/* Buttons & Settings List */}
        <div className="flex flex-col gap-3.5 mb-6">
          {/* Resume Button */}
          <button
            onClick={onResume}
            className="w-full py-2 bg-[#444444] hover:bg-[#555555] active:bg-[#333333] border-2 border-t-[#888888] border-l-[#888888] border-r-[#111111] border-b-[#111111] font-bold text-sm tracking-wide transition-all shadow"
          >
            Back to Game
          </button>

          {/* Game Mode Switch */}
          <div className="flex justify-between items-center bg-[#181818] p-2 border border-[#333333]">
            <span className="text-xs text-gray-300">Game Mode:</span>
            <button
              onClick={() => {
                const nextMode = gameMode === 'survival' ? 'creative' : 'survival';
                game.player.gameMode = nextMode;
                setGameMode(nextMode);
                onUpdate();
              }}
              className="px-3 py-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/20 text-xs font-bold text-yellow-300"
            >
              {gameMode.toUpperCase()}
            </button>
          </div>

          {/* Time of Day Presets */}
          <div className="flex justify-between items-center bg-[#181818] p-2 border border-[#333333]">
            <span className="text-xs text-gray-300">Set Time:</span>
            <div className="flex gap-1.5">
              {[
                { label: 'Day', val: 0.25 },
                { label: 'Noon', val: 0.35 },
                { label: 'Sunset', val: 0.75 },
                { label: 'Night', val: 0.9 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    game.skybox.setTimeOfDay(preset.val);
                    onUpdate();
                  }}
                  className="px-2 py-0.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/20 text-xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render Distance Slider */}
          <div className="flex flex-col bg-[#181818] p-2 border border-[#333333]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Render Distance:</span>
              <span className="text-yellow-400 font-bold">{renderDist} Chunks</span>
            </div>
            <input
              type="range"
              min="3"
              max="9"
              value={renderDist}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setRenderDist(val);
                game.chunkManager.renderDistance = val;
              }}
              className="accent-yellow-400 cursor-pointer"
            />
          </div>

          {/* FOV Slider */}
          <div className="flex flex-col bg-[#181818] p-2 border border-[#333333]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Field of View:</span>
              <span className="text-yellow-400 font-bold">{fov}°</span>
            </div>
            <input
              type="range"
              min="60"
              max="100"
              value={fov}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFov(val);
                game.cameraController.baseFov = val;
              }}
              className="accent-yellow-400 cursor-pointer"
            />
          </div>

          {/* Audio Volume Sliders */}
          <button
            onClick={() => { const next = !audioEnabled; setAudioEnabled(next); sound.setMuted(!next); }}
            aria-pressed={audioEnabled}
            className="flex items-center justify-between bg-[#181818] p-2 border border-[#333333] text-xs font-bold"
          >
            <span>Audio System</span><span className={audioEnabled ? 'text-green-300' : 'text-red-300'}>{audioEnabled ? 'ENABLED' : 'OFF BY DEFAULT'}</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-[#181818] p-2 border border-[#333333]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">SFX Vol:</span>
                <span className="text-yellow-400 font-bold">{sfxVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVol}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSfxVol(val);
                  sound.setVolume(masterVol / 100, val / 100, musicVol / 100);
                }}
                className="accent-yellow-400 cursor-pointer"
              />
            </div>
            <div className="flex flex-col bg-[#181818] p-2 border border-[#333333]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">Music Vol:</span>
                <span className="text-yellow-400 font-bold">{musicVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVol}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setMusicVol(val);
                  sound.setVolume(masterVol / 100, sfxVol / 100, val / 100);
                }}
                className="accent-yellow-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Save & Export World Row */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleSave}
              className="py-1.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/20 text-xs font-bold"
            >
              SAVE WORLD
            </button>
            <button
              onClick={handleExport}
              className="py-1.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/20 text-xs font-bold"
            >
              EXPORT JSON
            </button>
          </div>

          {/* Import JSON file input */}
          <div className="flex items-center justify-between bg-[#181818] p-2 border border-[#333333]">
            <span className="text-xs text-gray-300">Import Save:</span>
            <label className="px-3 py-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-white/20 text-xs font-bold cursor-pointer">
              CHOOSE SAVE FILE
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {/* Respawn Button */}
          <button
            onClick={() => {
              const spawnH = game.worldGen.getHeight(0, 0);
              game.player.respawn(new THREE.Vector3(0.5, spawnH + 2.0, 0.5));
              onResume();
            }}
            className="py-1 bg-red-900/60 hover:bg-red-800 border border-red-500/30 text-xs font-bold text-red-200"
          >
            RESPAWN AT SURFACE
          </button>
        </div>

        {/* Status notice */}
        {saveStatus && (
          <div className="text-center text-xs text-green-400 font-bold py-1 bg-black/40 rounded border border-green-500/30">
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
}
