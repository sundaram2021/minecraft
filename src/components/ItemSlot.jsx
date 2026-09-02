import React from 'react';
import { itemAtlas } from '../game/crafting/ItemAtlas.js';
import { textureAtlas } from '../game/world/TextureAtlas.js';
import { getBlockDef } from '../game/world/Blocks.js';
import { VoxelAsset } from './VoxelAsset.jsx';

export function ItemSlot({ item, isSelected, onClick, onContextMenu, size = 44 }) {
  let iconSrc = null;
  let itemName = '';
  let assetTone = 'stone';

  if (item) {
    if (typeof item.id === 'string') {
      iconSrc = itemAtlas.getItemIcon(item.id);
      itemName = item.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (typeof item.id === 'number') {
      const def = getBlockDef(item.id);
      itemName = def.name;
      let texKey = 'dirt';
      if (def.textures) {
        texKey = def.textures.top || def.textures.all || def.textures.side || 'dirt';
      }
      const uv = textureAtlas.getUV(texKey);
      assetTone = texKey.includes('wood') ? 'wood' : texKey.includes('gold') ? 'gold' : 'stone';
      if (uv && textureAtlas.canvas) {
        // Extract tile dataUrl for clean UI rendering
        const temp = document.createElement('canvas');
        temp.width = 16;
        temp.height = 16;
        const ctx = temp.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(textureAtlas.canvas, uv.pixelX, uv.pixelY, 16, 16, 0, 0, 16, 16);
        iconSrc = temp.toDataURL();
      }
    }
  }

  // Durability bar percentage
  let durPercent = null;
  if (item && item.durability !== undefined && item.maxDurability) {
    durPercent = (item.durability / item.maxDurability) * 100;
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu();
      }}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-all ${
        isSelected ? 'border-2 border-white scale-105 shadow-lg bg-[#6a6a6a]' : 'border-2 border-[#373737] bg-[#8b8b8b]'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderTopColor: '#373737',
        borderLeftColor: '#373737',
        borderRightColor: '#ffffff',
        borderBottomColor: '#ffffff',
        imageRendering: 'pixelated',
      }}
      title={itemName}
    >
      {iconSrc ? (
        <img src={iconSrc} alt={itemName} className="w-4/5 h-4/5 object-contain pointer-events-none drop-shadow-sm" style={{ imageRendering: 'pixelated' }} />
      ) : (
        <VoxelAsset type={item?.durability ? 'tool' : 'block'} tone={assetTone} size={Math.round(size * 0.68)} label={itemName || 'Empty slot'} />
      )}

      {/* Stack Count */}
      {item && item.count > 1 && (
        <span
          className="absolute bottom-0 right-1 text-white text-xs font-bold pointer-events-none"
          style={{
            fontFamily: "'Minecraft', 'Courier New', monospace",
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
          }}
        >
          {item.count}
        </span>
      )}

      {/* Durability Bar */}
      {durPercent !== null && (
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-black rounded-sm overflow-hidden pointer-events-none">
          <div
            className={`h-full ${
              durPercent > 50 ? 'bg-green-500' : durPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${durPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
