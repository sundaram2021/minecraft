import React, { useEffect, useRef, useState } from 'react';
import { Game } from './game/core/Game.js';
import { HUD } from './components/HUD.jsx';
import { InventoryUI } from './components/InventoryUI.jsx';
import { CraftingTableUI } from './components/CraftingTableUI.jsx';
import { FurnaceUI } from './components/FurnaceUI.jsx';
import { ChestUI } from './components/ChestUI.jsx';
import { PauseMenu } from './components/PauseMenu.jsx';
import { DebugOverlay } from './components/DebugOverlay.jsx';
import { BuildMenuUI } from './components/BuildMenuUI.jsx';
import { WebMCPOverlay } from './components/WebMCPOverlay.jsx';
import { sound } from './game/audio/SoundSynthesizer.js';

export function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  const [gameState, setGameState] = useState({
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    oxygen: 20,
    maxOxygen: 20,
    inventory: [],
    selectedSlotIndex: 0,
    gameMode: 'survival',
    fps: 60,
    posX: '0.00',
    posY: '0.00',
    posZ: '0.00',
    biome: 'Plains',
    timeOfDay: 0.25,
    isPaused: false,
    isInventoryOpen: false,
    isCraftingTableOpen: false,
    isFurnaceOpen: false,
    isChestOpen: false,
    isWebMCPOpen: false,
    furnacePos: null,
    chestPos: null,
    showDebug: false,
    weather: 'Clear',
  });

  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Game Engine
    const game = new Game(containerRef.current, (state) => {
      setGameState({ ...state });
    });
    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
      }
    };
  }, []);

  const handleStartGame = () => {
    sound.ensureContext();
    if (gameRef.current) {
      gameRef.current.inputManager.requestPointerLock();
    }
    setIsStarted(true);
  };

  const handleSlotSelect = (index) => {
    if (gameRef.current) {
      gameRef.current.inputManager.onHotbarSelect(index);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* 1. Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 2. Start / Click to Play Splash Screen */}
      {!isStarted && (
        <div
          onClick={handleStartGame}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer text-white text-center p-6 select-none"
          style={{ fontFamily: "'Minecraft', 'Courier New', monospace" }}
        >
          <div className="max-w-lg bg-[#222222]/90 p-8 border-4 border-[#555555] shadow-2xl rounded-xs">
            <h1 className="text-3xl sm:text-4xl font-black text-yellow-400 mb-2 drop-shadow-md tracking-wider">
              MINECRAFT 3D
            </h1>
            <p className="text-sm text-green-400 font-bold mb-6">
              Procedural WebGL Voxel Sandbox Engine
            </p>

            <div className="bg-[#111111] p-4 border border-white/20 text-left text-xs text-gray-300 mb-6 space-y-2 leading-relaxed">
              <p><span className="key-glyph">MOVE</span> <strong className="text-white">WASD:</strong> Walk / Swim</p>
              <p><span className="key-glyph">PACE</span> <strong className="text-white">Ctrl / Shift:</strong> Sprint / Sneak</p>
              <p><span className="key-glyph">JUMP</span> <strong className="text-white">Space:</strong> Jump / Swim Up (Double-tap Space to Fly in Creative)</p>
              <p><span className="key-glyph">MINE</span> <strong className="text-white">Left Click:</strong> Mine + Attack (Shears on Sheep)</p>
              <p><span className="key-glyph">BUILD</span> <strong className="text-white">Right Click:</strong> Place / Eat / Open Crafting / Furnace / Chest / Hoe Farmland</p>
              <p><span className="key-glyph">PACK</span> <strong className="text-white">E:</strong> Inventory & 2x2 Crafting — 120+ Blocks, 14 Biomes</p>
              <p><span className="key-glyph">SLOTS</span> <strong className="text-white">1-9 / Wheel:</strong> Select a tool • <strong className="text-white">Shift + ← / →:</strong> Cycle tools</p>
              <p><span className="key-glyph">AGENT</span> <strong className="text-white">M:</strong> WebMCP AI Agent Bridge & Tools (OpenAI Logo, etc.)</p>
              <p><span className="key-glyph">INFO</span> <strong className="text-white">F3:</strong> Debug  •  <strong className="text-white">Esc:</strong> Pause / Save</p>
            </div>

            <button
              id="start-game-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleStartGame();
              }}
              className="w-full py-3 bg-green-600 hover:bg-green-500 border-2 border-t-green-300 border-l-green-300 border-r-green-900 border-b-green-900 font-bold text-base tracking-wider shadow-lg animate-pulse"
            >
              CLICK ANYWHERE TO PLAY
            </button>
          </div>
        </div>
      )}

      {/* 3. In-Game HUD (Crosshair, Hearts, Food, Bubbles, Hotbar) */}
      <HUD
        gameState={gameState}
        onSlotSelect={handleSlotSelect}
        onOpenBuildMenu={() => {
          if (gameRef.current) gameRef.current.toggleBuildMenu?.();
        }}
        onOpenWebMCP={() => {
          if (gameRef.current) gameRef.current.toggleWebMCP?.();
        }}
      />

      {/* 4. F3 Debug Screen */}
      <DebugOverlay gameState={gameState} />

      {/* 5. Inventory Modal ('E') */}
      {gameState.isInventoryOpen && gameRef.current && (
        <InventoryUI
          player={gameRef.current.player}
          onClose={() => gameRef.current.closeModals()}
          onUpdate={() => gameRef.current.broadcastUI()}
        />
      )}

      {/* 5b. Quick Build Architect Modal ('B') */}
      {gameState.isBuildMenuOpen && gameRef.current && (
        <BuildMenuUI
          onBuild={(type) => {
            gameRef.current.buildStructure(type);
            gameRef.current.closeModals();
          }}
          onClose={() => gameRef.current.closeModals()}
        />
      )}

      {/* 6. Crafting Table Modal (3x3) */}
      {gameState.isCraftingTableOpen && gameRef.current && (
        <CraftingTableUI
          player={gameRef.current.player}
          onClose={() => gameRef.current.closeModals()}
          onUpdate={() => gameRef.current.broadcastUI()}
        />
      )}

      {/* 6b. Furnace */}
      {gameState.isFurnaceOpen && gameRef.current && gameState.furnacePos && (
        <FurnaceUI
          player={gameRef.current.player}
          furnacePos={gameState.furnacePos}
          onClose={() => gameRef.current.closeModals()}
          onUpdate={() => gameRef.current.broadcastUI()}
        />
      )}

      {/* 6c. Chest */}
      {gameState.isChestOpen && gameRef.current && gameState.chestPos && (
        <ChestUI
          player={gameRef.current.player}
          chestPos={gameState.chestPos}
          onClose={() => gameRef.current.closeModals()}
          onUpdate={() => gameRef.current.broadcastUI()}
        />
      )}

      {/* 7. Pause & Settings Menu ('Esc') */}
      {gameState.isPaused && gameRef.current && (
        <PauseMenu
          game={gameRef.current}
          onResume={() => gameRef.current.closeModals()}
          onUpdate={() => gameRef.current.broadcastUI()}
        />
      )}

      {/* 8. WebMCP AI Agent Bridge Modal ('M') */}
      {gameState.isWebMCPOpen && gameRef.current && (
        <WebMCPOverlay
          isOpen={gameState.isWebMCPOpen}
          game={gameRef.current}
          onClose={() => gameRef.current.closeModals()}
        />
      )}
    </div>
  );
}

export default App;
