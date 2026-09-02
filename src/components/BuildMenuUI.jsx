import React from 'react';
import { sound } from '../game/audio/SoundSynthesizer.js';
import { VoxelAsset } from './VoxelAsset.jsx';

export function BuildMenuUI({ onBuild, onClose }) {
  const structures = [
    {
      id: 'cottage',
      title: 'Cozy Wooden Cottage',
      icon: 'cottage',
      desc: 'Furnished 7x7 home with oak wood, glass windows, brick roof, chimney, bed, crafting table, furnace, chest & flower garden.',
      blocksText: 'Oak Planks, Glass, Bricks, Cobblestone, Bed, Furnace, Chest, Flowers',
      badge: 'POPULAR',
      badgeColor: 'bg-green-600',
    },
    {
      id: 'watchtower',
      title: 'Medieval Watchtower',
      icon: 'watchtower',
      desc: '13-block tall stone fortress tower with overhanging battlements, parapet crenellations, arrow slits, corner torches, and a glowing beacon.',
      blocksText: 'Stone Bricks, Mossy Cobble, Glowstone, Torches, Iron Bars',
      badge: 'FORTRESS',
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'pyramid',
      title: 'Ancient Desert Pyramid',
      icon: 'pyramid',
      desc: 'Stepped sandstone monument with a gleaming Gold block capstone, and a secret interior treasure burial chamber.',
      blocksText: 'Sandstone, Gold Blocks, Lapis Lazuli, Diamond, Treasure Chest',
      badge: 'TREASURE',
      badgeColor: 'bg-amber-600',
    },
  ];

  const handleSelect = (id) => {
    sound.playClick();
    onBuild(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none"
      style={{ fontFamily: "'Minecraft', 'Courier New', monospace" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#282828] border-4 border-[#505050] shadow-2xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: 'inset -2px -2px 0 #181818, inset 2px 2px 0 #6e6e6e, 0 10px 25px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#404040] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <VoxelAsset type="tool" tone="gold" size={28} label="Build architect" />
            <div>
              <h2 className="text-xl font-black text-yellow-400 tracking-wider">
                QUICK BUILD ARCHITECT
              </h2>
              <p className="text-xs text-gray-400">
                Choose a structure to build in front of you
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-2.5 py-1 bg-red-800 hover:bg-red-700 border-2 border-t-red-400 border-l-red-400 border-r-red-950 border-b-red-950 text-xs font-bold active:scale-95"
          >
            ✕ ESC
          </button>
        </div>

        {/* Structure Cards */}
        <div className="space-y-3">
          {structures.map((s) => (
            <div
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className="group relative flex items-start gap-4 p-3.5 bg-[#1b1b1b] hover:bg-[#232323] border-2 border-[#3c3c3c] hover:border-yellow-400 cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="text-3xl p-2 bg-[#2d2d2d] border border-white/10 group-hover:scale-110 transition-transform">
                <VoxelAsset type="block" tone={s.id === 'pyramid' ? 'gold' : s.id === 'cottage' ? 'wood' : 'stone'} size={42} label={`${s.title} structure`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base text-white group-hover:text-yellow-300">
                    {s.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mb-2 leading-relaxed">
                  {s.desc}
                </p>
                <div className="text-[11px] text-gray-400 font-mono">
                  <span className="voxel-mini-glyph" aria-hidden="true">◆</span> <span className="text-gray-400">{s.blocksText}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); handleSelect(s.id); }}
                className="self-center px-4 py-2 bg-green-700 group-hover:bg-green-600 border-2 border-t-green-400 border-l-green-400 border-r-green-950 border-b-green-950 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap shadow"
              >
                BUILD ▶
              </button>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span><span className="voxel-mini-glyph" aria-hidden="true">◆</span> Tip: Press <strong className="text-yellow-400 font-mono">[B]</strong> anytime to open this builder</span>
          <span className="text-green-400 font-bold">Watch it build live in 3D!</span>
        </div>
      </div>
    </div>
  );
}
