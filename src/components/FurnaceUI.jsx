import React, { useState, useEffect, useRef } from 'react';
import { ItemSlot } from './ItemSlot.jsx';
import { furnaceManager } from '../game/world/FurnaceManager.js';
import { sound } from '../game/audio/SoundSynthesizer.js';

export function FurnaceUI({ player, furnacePos, onClose, onUpdate }){
  const furnace = furnaceManager.getOrCreate(furnacePos.x, furnacePos.y, furnacePos.z);
  const [, force] = useState(0);
  const intervalRef = useRef(null);
  useEffect(()=>{
    intervalRef.current = setInterval(()=> force(v=>v+1), 100);
    return ()=> clearInterval(intervalRef.current);
  },[]);
  const [cursorItem, setCursorItem]=useState(null);

  const pctBurn = furnace.burnTotal>0 ? Math.max(0, furnace.burnTime / furnace.burnTotal) : 0;
  const pctCook = furnace.cookTime / 10.0;

  const handleFurnaceSlotClick = (which, isRight=false)=>{
    let slotVal = furnace[which];
    if(!cursorItem){
      if(!slotVal) return;
      if(isRight && slotVal.count>1){
        const half=Math.ceil(slotVal.count/2);
        setCursorItem({...slotVal, count:half});
        slotVal.count -= half;
        if(slotVal.count<=0) furnace[which]=null;
      } else {
        setCursorItem(slotVal);
        furnace[which]=null;
      }
    } else {
      if(!slotVal){
        if(which==='output' && !cursorItem) return;
        if(isRight){
          furnace[which]={...cursorItem, count:1};
          cursorItem.count-=1;
          if(cursorItem.count<=0) setCursorItem(null); else setCursorItem({...cursorItem});
        } else {
          furnace[which]=cursorItem;
          setCursorItem(null);
        }
      } else {
        if(slotVal.id===cursorItem.id && !slotVal.durability && slotVal.count<64){
          if(isRight){
            slotVal.count+=1;
            cursorItem.count-=1;
            if(cursorItem.count<=0) setCursorItem(null);
          } else {
            const space=64-slotVal.count;
            const take=Math.min(space, cursorItem.count);
            slotVal.count+=take;
            cursorItem.count-=take;
            if(cursorItem.count<=0) setCursorItem(null); else setCursorItem({...cursorItem});
          }
        } else {
          const tmp=slotVal;
          furnace[which]=cursorItem;
          setCursorItem(tmp);
        }
      }
    }
    sound.playItemPickup(); force(v=>v+1); onUpdate();
  };
  const handleInvClick=(idx, isRight=false)=>{
    const cur=player.inventory[idx];
    if(!cursorItem){
      if(!cur) return;
      if(isRight && cur.count>1){
        const half=Math.ceil(cur.count/2);
        setCursorItem({...cur, count:half});
        cur.count-=half;
        if(cur.count<=0) player.inventory[idx]=null;
      } else { setCursorItem(cur); player.inventory[idx]=null; }
    } else {
      if(!cur){
        if(isRight){ player.inventory[idx]={...cursorItem, count:1}; if(cursorItem.count>1) setCursorItem({...cursorItem,count:cursorItem.count-1}); else setCursorItem(null); }
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
          <span className="text-[#3f3f3f] font-bold text-sm">Furnace</span>
          <button onClick={()=>{
            if(cursorItem){ player.addItem(cursorItem.id, cursorItem.count); }
            onClose();
          }} className="text-xs bg-[#b0b0b0] hover:bg-red-500 hover:text-white px-2 py-0.5 border border-black font-bold">✕</button>
        </div>
        <div className="flex items-center gap-4 mb-4 justify-center bg-[#8b8b8b] p-3 border-2 border-[#373737]">
          <div className="flex flex-col gap-4 items-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#3f3f3f] font-bold">Input</span>
              <ItemSlot item={furnace.input} size={42} onClick={()=>handleFurnaceSlotClick('input',false)} onContextMenu={()=>handleFurnaceSlotClick('input',true)} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#3f3f3f] font-bold">Fuel</span>
              <ItemSlot item={furnace.fuel} size={42} onClick={()=>handleFurnaceSlotClick('fuel',false)} onContextMenu={()=>handleFurnaceSlotClick('fuel',true)} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 mx-2">
            <div className="w-6 h-10 bg-[#373737] border border-black relative overflow-hidden">
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-red-700 to-yellow-400" style={{height:`${pctBurn*100}%`}} />
              {furnace.burnTime>0 && <div className="absolute inset-0 flex items-center justify-center text-[10px]">🔥</div>}
            </div>
            <span className="text-[9px] text-[#3f3f3f]">{Math.ceil(furnace.burnTime)}s</span>
            <div className="text-xl">➔</div>
            <div className="w-12 h-2 bg-[#373737] border border-black relative">
              <div className="absolute left-0 top-0 bottom-0 bg-green-500" style={{width:`${Math.min(100,pctCook*100)}%`}} />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#3f3f3f] font-bold">Output</span>
            <ItemSlot item={furnace.output} size={42} onClick={()=>handleFurnaceSlotClick('output',false)} onContextMenu={()=>handleFurnaceSlotClick('output',true)} />
            <span className="text-[9px] text-[#3f3f3f] mt-1">{furnace.cookTime>0? `${Math.floor(pctCook*100)}%` : '--'}</span>
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
