import React, { useState, useEffect } from 'react';
import { ItemSlot } from './ItemSlot.jsx';
import { chestManager } from '../game/world/ChestManager.js';
import { sound } from '../game/audio/SoundSynthesizer.js';

export function ChestUI({ player, chestPos, onClose, onUpdate }){
  const chestInv = chestManager.getOrCreate(chestPos.x, chestPos.y, chestPos.z);
  const [, force]=useState(0);
  const [cursorItem,setCursorItem]=useState(null);
  const handleChestClick=(idx,isRight=false)=>{
    const cur=chestInv[idx];
    if(!cursorItem){
      if(!cur) return;
      if(isRight && cur.count>1){
        const half=Math.ceil(cur.count/2);
        setCursorItem({...cur,count:half});
        cur.count-=half;
        if(cur.count<=0) chestInv[idx]=null;
      } else { setCursorItem(cur); chestInv[idx]=null; }
    } else {
      if(!cur){
        if(isRight){ chestInv[idx]={...cursorItem,count:1}; if(cursorItem.count>1) setCursorItem({...cursorItem,count:cursorItem.count-1}); else setCursorItem(null); }
        else { chestInv[idx]=cursorItem; setCursorItem(null); }
      } else if(cur.id===cursorItem.id && !cur.durability && cur.count<64){
        if(isRight){ cur.count+=1; cursorItem.count-=1; if(cursorItem.count<=0) setCursorItem(null); }
        else { const space=64-cur.count; const take=Math.min(space,cursorItem.count); cur.count+=take; cursorItem.count-=take; if(cursorItem.count<=0) setCursorItem(null); }
      } else { chestInv[idx]=cursorItem; setCursorItem(cur); }
    }
    sound.playItemPickup(); force(v=>v+1); onUpdate();
  };
  const handleInvClick=(idx,isRight=false)=>{
    const cur=player.inventory[idx];
    if(!cursorItem){
      if(!cur) return;
      if(isRight && cur.count>1){ const half=Math.ceil(cur.count/2); setCursorItem({...cur,count:half}); cur.count-=half; if(cur.count<=0) player.inventory[idx]=null; }
      else { setCursorItem(cur); player.inventory[idx]=null; }
    } else {
      if(!cur){
        if(isRight){ player.inventory[idx]={...cursorItem,count:1}; if(cursorItem.count>1) setCursorItem({...cursorItem,count:cursorItem.count-1}); else setCursorItem(null); }
        else { player.inventory[idx]=cursorItem; setCursorItem(null); }
      } else if(cur.id===cursorItem.id && !cur.durability && cur.count<64){
        if(isRight){ cur.count+=1; cursorItem.count-=1; if(cursorItem.count<=0) setCursorItem(null); }
        else { const space=64-cur.count; const take=Math.min(space,cursorItem.count); cur.count+=take; cursorItem.count-=take; if(cursorItem.count<=0) setCursorItem(null); }
      } else { player.inventory[idx]=cursorItem; setCursorItem(cur); }
    }
    sound.playItemPickup(); force(v=>v+1); onUpdate();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="relative bg-[#c6c6c6] p-4 rounded-sm border-4 shadow-2xl" style={{borderTopColor:'#fff',borderLeftColor:'#fff',borderRightColor:'#373737',borderBottomColor:'#373737', fontFamily:"'Minecraft','Courier New',monospace"}}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#3f3f3f] font-bold text-sm">Chest</span>
          <button onClick={()=>{
            if(cursorItem) player.addItem(cursorItem.id, cursorItem.count);
            onClose();
          }} className="text-xs bg-[#b0b0b0] hover:bg-red-500 hover:text-white px-2 py-0.5 border border-black font-bold">✕</button>
        </div>
        <div className="mb-3">
          <span className="text-[#3f3f3f] text-xs font-bold block">Chest (27 slots)</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
            {chestInv.map((item,idx)=>(
              <ItemSlot key={idx} item={item} size={36} onClick={()=>handleChestClick(idx,false)} onContextMenu={()=>handleChestClick(idx,true)} />
            ))}
          </div>
        </div>
        <div className="mb-2">
          <span className="text-[#3f3f3f] text-xs font-bold block">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
            {player.inventory.slice(9,36).map((item,idx)=>(
              <ItemSlot key={idx+9} item={item} size={36} onClick={()=>handleInvClick(idx+9,false)} onContextMenu={()=>handleInvClick(idx+9,true)} />
            ))}
          </div>
        </div>
        <div>
          <span className="text-[#3f3f3f] text-xs font-bold block">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-[#373737]">
            {player.inventory.slice(0,9).map((item,idx)=>(
              <ItemSlot key={idx} item={item} size={36} onClick={()=>handleInvClick(idx,false)} onContextMenu={()=>handleInvClick(idx,true)} />
            ))}
          </div>
        </div>
        {cursorItem && (
          <div className="fixed pointer-events-none z-50 bg-black/70 px-2 py-1 text-xs text-white border border-white" style={{left:'50%', top:'42%', transform:'translate(-50%,-50%)'}}>
            {String(cursorItem.id)} x{cursorItem.count}
          </div>
        )}
      </div>
    </div>
  );
}
