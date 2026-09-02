import React, { useState, useEffect } from 'react';
import { ItemSlot } from './ItemSlot.jsx';
import { CraftingManager } from '../game/crafting/CraftingManager.js';
import { sound } from '../game/audio/SoundSynthesizer.js';

export function CraftingTableUI({ player, onClose, onUpdate }) {
  const [craftGrid, setCraftGrid] = useState(new Array(9).fill(null));
  const [craftOutput, setCraftOutput] = useState(null);
  const [cursorItem, setCursorItem] = useState(null);

  useEffect(() => {
    const result = CraftingManager.findRecipe(craftGrid, 3);
    setCraftOutput(result);
  }, [craftGrid]);

  const handleSlotClick = (slotIndex, isRightClick = false) => {
    const current = player.inventory[slotIndex];

    if (!cursorItem) {
      if (!current) return;
      if (isRightClick && current.count > 1) {
        const half = Math.ceil(current.count / 2);
        const rem = current.count - half;
        setCursorItem({ ...current, count: half });
        player.inventory[slotIndex] = rem > 0 ? { ...current, count: rem } : null;
      } else {
        setCursorItem(current);
        player.inventory[slotIndex] = null;
      }
    } else {
      if (!current) {
        if (isRightClick) {
          player.inventory[slotIndex] = { ...cursorItem, count: 1 };
          if (cursorItem.count > 1) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
          } else {
            setCursorItem(null);
          }
        } else {
          player.inventory[slotIndex] = cursorItem;
          setCursorItem(null);
        }
      } else if (current.id === cursorItem.id && !current.durability && current.count < 64) {
        if (isRightClick) {
          current.count += 1;
          if (cursorItem.count > 1) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
          } else {
            setCursorItem(null);
          }
        } else {
          const space = 64 - current.count;
          const take = Math.min(space, cursorItem.count);
          current.count += take;
          if (cursorItem.count - take > 0) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - take });
          } else {
            setCursorItem(null);
          }
        }
      } else {
        player.inventory[slotIndex] = cursorItem;
        setCursorItem(current);
      }
    }

    sound.playItemPickup();
    onUpdate();
  };

  const handleCraftSlotClick = (index, isRightClick = false) => {
    const current = craftGrid[index];
    const newGrid = [...craftGrid];

    if (!cursorItem) {
      if (!current) return;
      setCursorItem(current);
      newGrid[index] = null;
    } else {
      if (!current) {
        if (isRightClick) {
          newGrid[index] = { ...cursorItem, count: 1 };
          if (cursorItem.count > 1) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
          } else {
            setCursorItem(null);
          }
        } else {
          newGrid[index] = cursorItem;
          setCursorItem(null);
        }
      } else if (current.id === cursorItem.id && !current.durability && current.count < 64) {
        if (isRightClick) {
          current.count += 1;
          if (cursorItem.count > 1) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
          } else {
            setCursorItem(null);
          }
        } else {
          const space = 64 - current.count;
          const take = Math.min(space, cursorItem.count);
          current.count += take;
          if (cursorItem.count - take > 0) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - take });
          } else {
            setCursorItem(null);
          }
        }
      } else {
        newGrid[index] = cursorItem;
        setCursorItem(current);
      }
    }

    setCraftGrid(newGrid);
    sound.playItemPickup();
  };

  const handleOutputClick = () => {
    if (!craftOutput) return;

    if (!cursorItem) {
      setCursorItem({ ...craftOutput });
      CraftingManager.consumeGrid(craftGrid);
      setCraftGrid([...craftGrid]);
      sound.playItemPickup();
      onUpdate();
    } else if (cursorItem.id === craftOutput.id && !cursorItem.durability && cursorItem.count + craftOutput.count <= 64) {
      cursorItem.count += craftOutput.count;
      CraftingManager.consumeGrid(craftGrid);
      setCraftGrid([...craftGrid]);
      sound.playItemPickup();
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div
        className="relative bg-[#c6c6c6] p-4 rounded-sm border-4 border-[#373737] shadow-2xl"
        style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#373737',
          borderBottomColor: '#373737',
          fontFamily: "'Minecraft', 'Courier New', monospace",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#3f3f3f] font-bold text-sm tracking-wider">Crafting Table</span>
          <button
            onClick={onClose}
            className="text-xs bg-[#b0b0b0] hover:bg-red-500 hover:text-white px-2 py-0.5 border border-black font-bold"
          >
            ✕
          </button>
        </div>

        {/* 3x3 Crafting Section */}
        <div className="flex items-center justify-center gap-6 mb-4 px-4">
          <div className="flex flex-col">
            <span className="text-[#3f3f3f] text-xs font-bold mb-1">Crafting (3x3)</span>
            <div className="grid grid-cols-3 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
              {craftGrid.map((item, idx) => (
                <ItemSlot
                  key={idx}
                  item={item}
                  size={38}
                  onClick={() => handleCraftSlotClick(idx, false)}
                  onContextMenu={() => handleCraftSlotClick(idx, true)}
                />
              ))}
            </div>
          </div>

          <span className="text-3xl text-gray-700 font-bold">➔</span>

          <div className="flex flex-col items-center">
            <span className="text-[#3f3f3f] text-xs font-bold mb-1">Result</span>
            <div className="bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
              <ItemSlot item={craftOutput} size={48} onClick={handleOutputClick} />
            </div>
          </div>
        </div>

        {/* Main Inventory 3x9 */}
        <div className="mb-3">
          <span className="text-[#3f3f3f] text-xs font-bold mb-1 block">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
            {player.inventory.slice(9, 36).map((item, idx) => (
              <ItemSlot
                key={idx + 9}
                item={item}
                size={38}
                onClick={() => handleSlotClick(idx + 9, false)}
                onContextMenu={() => handleSlotClick(idx + 9, true)}
              />
            ))}
          </div>
        </div>

        {/* Hotbar 1x9 */}
        <div>
          <span className="text-[#3f3f3f] text-xs font-bold mb-1 block">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
            {player.inventory.slice(0, 9).map((item, idx) => (
              <ItemSlot
                key={idx}
                item={item}
                size={38}
                onClick={() => handleSlotClick(idx, false)}
                onContextMenu={() => handleSlotClick(idx, true)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
