import React, { useState, useEffect } from 'react';
import { ItemSlot } from './ItemSlot.jsx';
import { VoxelAsset } from './VoxelAsset.jsx';
import { getBlockDef } from '../game/world/Blocks.js';

export function HUD({ gameState, onSlotSelect, onOpenBuildMenu }) {
  const {
    health = 20,
    maxHealth = 20,
    hunger = 20,
    maxHunger = 20,
    oxygen = 20,
    maxOxygen = 20,
    inventory = [],
    selectedSlotIndex = 0,
    gameMode = 'survival',
  } = gameState || {};

  const [heldName, setHeldName] = useState('');
  const [showNameTimer, setShowNameTimer] = useState(null);

  const hotbarItems = inventory.slice(0, 9);
  const selectedItem = hotbarItems[selectedSlotIndex];

  // Update item name popup on slot switch
  useEffect(() => {
    if (selectedItem) {
      let name = '';
      if (typeof selectedItem.id === 'string') {
        name = selectedItem.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      } else if (typeof selectedItem.id === 'number') {
        name = getBlockDef(selectedItem.id).name;
      }
      setHeldName(name);

      if (showNameTimer) clearTimeout(showNameTimer);
      const timer = setTimeout(() => setHeldName(''), 2500);
      setShowNameTimer(timer);
    } else {
      setHeldName('');
    }
  }, [selectedSlotIndex, selectedItem?.id]);

  // AAA Pixel-perfect Hearts: canvas-drawn 9x9 sprite with half-heart support + hurt shake
  const renderHearts = () => {
    const hearts = [];
    const hp = Math.max(0, Math.min(20, health));
    const low = hp <= 6;
    for (let i = 0; i < 10; i++) {
      const need = (i + 1) * 2;
      let state = 'empty';
      if (hp >= need) state = 'full';
      else if (hp === need - 1) state = 'half';
      const shake = low ? (Math.sin(Date.now() * 0.015 + i) * 0.8) : 0;
      hearts.push(
        <div key={i} className="relative inline-block mr-[2px]" style={{ width: 18, height: 18, transform: `translateY(${shake}px)`, imageRendering: 'pixelated' }}>
          <canvas
            ref={(c) => {
              if (!c) return;
              const ctx = c.getContext('2d');
              c.width = 9; c.height = 9; c.style.width = '18px'; c.style.height = '18px';
              ctx.imageSmoothingEnabled = false;
              ctx.clearRect(0, 0, 9, 9);
              // outline
              ctx.fillStyle = state === 'empty' ? '#3a0a0a' : '#5a0000';
              // pixel heart shape
              const filled = state === 'full';
              const half = state === 'half';
              // heart pixels: row wise
              const heart = [
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0],
                [0,0,0,1,0,0,0],
              ];
              for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (heart[y][x]) {
                if (half && x >= 4) ctx.fillStyle = 'rgba(40,10,10,0.9)';
                else ctx.fillStyle = filled || half ? '#e02525' : '#2a0707';
                ctx.fillRect(1 + x, 1 + y, 1, 1);
                // highlight
                if ((filled || half) && y === 1 && x === 2) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.9; ctx.fillRect(1 + x, 1 + y, 1, 1); ctx.globalAlpha = 1; }
              }
              // gloss
              if (filled) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(2, 2, 2, 1); }
            }}
            width={9} height={9} className="block"
          />
        </div>
      );
    }
    return hearts;
  };

  const renderHunger = () => {
    const fd = Math.max(0, Math.min(20, hunger));
    return Array.from({ length: 10 }, (_, i) => {
      const need = (i + 1) * 2;
      let s = 'empty';
      if (fd >= need) s = 'full';
      else if (fd === need - 1) s = 'half';
      const sway = fd <= 6 ? Math.sin(Date.now() * 0.012 + i) * 0.7 : 0;
      return (
        <div key={i} className="relative inline-block ml-[2px]" style={{ width: 18, height: 18, transform: `translateY(${sway}px)` }}>
          <canvas
            ref={(c) => {
              if (!c) return;
              const ctx = c.getContext('2d');
              c.width = 9; c.height = 9; c.style.width = '18px'; c.style.height = '18px';
              ctx.imageSmoothingEnabled = false;
              ctx.clearRect(0, 0, 9, 9);
              const shank = [
                [0,0,1,1,1,0,0],
                [0,1,1,0,1,1,0],
                [1,1,0,0,0,1,1],
                [1,1,0,1,0,1,1],
                [0,1,1,0,1,1,0],
                [0,0,1,1,1,0,0],
                [0,0,0,1,0,0,0],
              ];
              for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (shank[y][x]) {
                const isBone = y >= 4;
                let col = s === 'empty' ? '#4a2a0a' : isBone ? '#f0ede6' : '#8a5a2a';
                if (s === 'half' && x >= 4) col = '#3a1f05';
                if (s === 'full' && y === 2 && x === 2) col = '#ffcf8a';
                ctx.fillStyle = col;
                ctx.fillRect(1 + x, 1 + y, 1, 1);
              }
            }}
            width={9} height={9} className="block"
          />
        </div>
      );
    });
  };

  const renderBubbles = () => {
    if (oxygen >= maxOxygen) return null;
    const cnt = Math.ceil(oxygen / 2);
    return (
      <div className="flex justify-end mb-1 gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => {
          const filled = i < cnt;
          return (
            <div key={i} className="relative" style={{ width: 10, height: 10 }}>
              <canvas
                ref={(c) => {
                  if (!c) return;
                  const ctx = c.getContext('2d');
                  c.width = 10; c.height = 10; c.style.width='10px'; c.style.height='10px';
                  ctx.imageSmoothingEnabled=false;
                  ctx.clearRect(0,0,10,10);
                  ctx.fillStyle = filled? '#3aa0ff' : '#14304a';
                  ctx.beginPath(); ctx.arc(5,5,4,0,Math.PI*2); ctx.fill();
                  if(filled){ ctx.fillStyle='rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(3.5,3.5,1.5,0,Math.PI*2); ctx.fill(); }
                  ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(5,5,4.2,0,Math.PI*2); ctx.stroke();
                }}
                width={10} height={10} className="block"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const lowHealthVignette = health <= 6 ? `inset 0 0 ${120 - health * 12}px rgba(180,0,0,${0.22 + (6 - health) * 0.05})` : 'none';
  const underwaterOverlay = oxygen < 20 ? 'rgba(12,58,115,0.18)' : 'transparent';

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between select-none" style={{ boxShadow: lowHealthVignette }}>
      {/* underwater tint */}
      {oxygen < 20 && <div className="absolute inset-0 pointer-events-none" style={{ background: underwaterOverlay }} />}
      {/* low health tint pulse */}
      {health <= 6 && <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ background: 'radial-gradient(ellipse at center, transparent 62%, rgba(255,0,0,0.16) 100%)' }} />}
      {/* 1. AAA Center Crosshair: gap-center like Java (10px arms, 4px gap) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: 20, height: 20 }}>
          <div className="absolute bg-white" style={{ left: 9, top: 0, width: 2, height: 6, boxShadow: '0 0 0 1px rgba(0,0,0,0.85)' }} />
          <div className="absolute bg-white" style={{ left: 9, top: 14, width: 2, height: 6, boxShadow: '0 0 0 1px rgba(0,0,0,0.85)' }} />
          <div className="absolute bg-white" style={{ left: 0, top: 9, width: 6, height: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.85)' }} />
          <div className="absolute bg-white" style={{ left: 14, top: 9, width: 6, height: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.85)' }} />
        </div>
      </div>

      {/* Top Header / Mode info (Hidden when F3 Debug is open) */}
      {!gameState?.showDebug && (
        <div className="p-4 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-white text-xs font-mono border border-white/10 shadow">
              Mode: <span className="text-yellow-400 uppercase font-bold">{gameMode}</span> (Double Space: Fly)
            </div>
            <button
              onMouseDown={(event) => { event.stopPropagation(); onOpenBuildMenu(); }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              className="relative z-20 pointer-events-auto flex items-center gap-2 border-2 border-[#d7d7d7] border-t-[#ffffff] border-l-[#ffffff] border-r-[#555555] border-b-[#555555] bg-[#c6c6c6] px-3 py-1.5 text-[#202020] text-xs font-mono font-black tracking-wide shadow-[2px_2px_0_#111] cursor-pointer transition-transform hover:bg-[#dedede] focus-visible:outline-2 focus-visible:outline-yellow-300 active:translate-y-px"
              title="Open Quick Build Architect [B]"
              >
              <VoxelAsset type="tool" tone="gold" size={20} label="Quick build" /> <span>[B] QUICK BUILD</span>

            </button>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-white text-xs font-mono border border-white/10 shadow">
            [B] Build • [E] Inventory • [F3] Debug • [Esc] Menu
          </div>
        </div>
      )}
      {gameState?.showDebug && <div className="h-4" />}

      {/* Bottom HUD: Hearts, Food, Bubbles & Hotbar */}
      <div className="pb-6 flex flex-col items-center">
        {/* Held item name popup */}
        {heldName && (
          <div
            className="mb-2 text-white font-bold text-sm bg-black/60 px-3 py-0.5 rounded border border-white/20 transition-opacity duration-300"
            style={{ fontFamily: "'Minecraft', 'Courier New', monospace" }}
          >
            {heldName}
          </div>
        )}

        {/* Survival Status Bars (Health, Food, Bubbles) */}
        {gameMode === 'survival' && (
          <div className="w-[432px] flex flex-col mb-1.5 px-1">
            {renderBubbles()}
            <div className="flex justify-between items-center">
              {/* Hearts on Left */}
              <div className="flex items-center">{renderHearts()}</div>
              {/* Hunger Drumsticks on Right */}
              <div className="flex items-center flex-row-reverse">{renderHunger()}</div>
            </div>
          </div>
        )}

        {/* AAA 9-Slot Hotbar: exact Java 182x22, selector is raised 24x24 with white rim */}
        <div
          className="pointer-events-auto flex p-[2px] gap-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
          style={{
            width: 368,
            height: 44,
            background: '#8b8b8b',
            border: '2px solid #373737',
            borderTopColor: '#373737',
            borderLeftColor: '#373737',
            borderRightColor: '#fff',
            borderBottomColor: '#fff',
            imageRendering: 'pixelated',
          }}
        >
          {hotbarItems.map((item, idx) => {
            const sel = idx === selectedSlotIndex;
            return (
              <div
                key={idx}
                className="relative flex items-center justify-center"
                style={{
                  width: 40, height: 40,
                  background: sel ? '#8b8b8b' : '#8b8b8b',
                  border: sel ? '2px solid #fff' : '2px solid transparent',
                  borderColor: sel ? '#fff #373737 #373737 #fff' : 'transparent',
                  boxShadow: sel ? 'inset 0 0 0 1px #373737, 0 1px 2px rgba(0,0,0,0.45)' : 'none',
                  transform: sel ? 'translateY(-3px) scale(1.04)' : 'none',
                  zIndex: sel ? 2 : 1,
                }}
              >
                <ItemSlot item={item} isSelected={false} onClick={() => onSlotSelect && onSlotSelect(idx)} size={40} />
                {item && item.count > 1 && (
                  <span className="absolute bottom-0 right-0.5 text-[11px] font-bold text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.9)]" style={{ fontFamily: "'Minecraft','Courier New',monospace", textShadow: '1px 1px 0 #000' }}>{item.count > 99 ? '99+' : item.count}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
