export class ChestManager {
  constructor(){
    this.chests = new Map(); // key "x,y,z" -> Array(27) slots
  }
  key(x,y,z){ return `${x},${y},${z}`; }
  getOrCreate(x,y,z){
    const k=this.key(x,y,z);
    if(!this.chests.has(k)) this.chests.set(k, new Array(27).fill(null));
    return this.chests.get(k);
  }
  remove(x,y,z){ this.chests.delete(this.key(x,y,z)); }
  exists(x,y,z){ return this.chests.has(this.key(x,y,z)); }
}
export const chestManager = new ChestManager();
