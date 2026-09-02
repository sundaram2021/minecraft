import { SMELTING_RECIPES, BLOCKS } from './Blocks.js';

const FUEL_VALUES = {
  'coal': 80,
  'coal_block': 800,
  'stick': 5,
  [BLOCKS.OAK_PLANKS]: 15,
  [BLOCKS.OAK_LOG]: 15,
  [BLOCKS.BIRCH_LOG]: 15,
  [BLOCKS.SPRUCE_LOG]: 15,
  [BLOCKS.JUNGLE_LOG]: 15,
  [BLOCKS.ACACIA_LOG]: 15,
  [BLOCKS.DARK_OAK_LOG]: 15,
  'lava_bucket': 1000,
};

export class FurnaceManager {
  constructor(){
    this.furnaces = new Map(); // key "x,y,z" -> {input, fuel, output, burnTime, burnTotal, cookTime, pos}
    this.smeltTime = 10.0; // seconds per item
  }
  key(x,y,z){ return `${x},${y},${z}`; }
  getOrCreate(x,y,z){
    const k=this.key(x,y,z);
    if(!this.furnaces.has(k)) this.furnaces.set(k,{ pos:{x,y,z}, input:null, fuel:null, output:null, burnTime:0, burnTotal:0, cookTime:0 });
    return this.furnaces.get(k);
  }
  remove(x,y,z){ this.furnaces.delete(this.key(x,y,z)); }
  getFuelValue(id){
    if(FUEL_VALUES[id]!==undefined) return FUEL_VALUES[id];
    if(typeof id==='string' && FUEL_VALUES[id]) return FUEL_VALUES[id];
    return 0;
  }
  getSmeltResult(inputId){
    if(SMELTING_RECIPES[inputId]) return SMELTING_RECIPES[inputId];
    // string keys
    const asStr= String(inputId);
    if(SMELTING_RECIPES[asStr]) return SMELTING_RECIPES[asStr];
    return null;
  }
  canSmelt(f){
    if(!f.input) return false;
    const recipe=this.getSmeltResult(f.input.id);
    if(!recipe) return false;
    if(!f.output) return true;
    if(f.output.id!==recipe.result) return false;
    if((f.output.count||1)>=64) return false;
    return true;
  }
  update(dt){
    for(const f of this.furnaces.values()){
      const hasRecipe=this.canSmelt(f);
      const isBurning=f.burnTime>0;
      if(isBurning) f.burnTime-=dt;
      if(hasRecipe){
        if(!isBurning){
          if(f.fuel && this.getFuelValue(f.fuel.id)>0){
            const fuelVal=this.getFuelValue(f.fuel.id);
            f.burnTotal=fuelVal;
            f.burnTime=fuelVal;
            // consume one fuel
            f.fuel.count-=1;
            if(f.fuel.count<=0) f.fuel=null;
          } else {
            f.cookTime=0;
          }
        }
        if(f.burnTime>0){
          f.cookTime+=dt;
          if(f.cookTime>=this.smeltTime){
            const recipe=this.getSmeltResult(f.input.id);
            // produce output
            if(!f.output) f.output={id:recipe.result, count:recipe.count};
            else f.output.count+=recipe.count;
            f.input.count-=1;
            if(f.input.count<=0) f.input=null;
            f.cookTime=0;
          }
        }
      } else {
        f.cookTime=0;
        if(!isBurning) f.burnTime=0;
      }
    }
  }
}
export const furnaceManager = new FurnaceManager();
