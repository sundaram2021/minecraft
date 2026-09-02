import { RECIPES } from './Recipes.js';

export class CraftingManager {
  // Find recipe match for a grid (2x2 array of 4 items or 3x3 array of 9 items)
  static findRecipe(grid, gridSize = 2) {
    // 1. Check shapeless recipes first
    const nonNullItems = grid.filter((item) => item !== null && item !== undefined);
    if (nonNullItems.length === 0) return null;

    for (const recipe of RECIPES) {
      if (recipe.type === 'shapeless') {
        if (this.matchShapeless(nonNullItems, recipe.ingredients)) {
          return { ...recipe.result };
        }
      }
    }

    // 2. Check shaped recipes
    // Trim bounding box of items in grid
    const { subGrid, w, h } = this.trimGrid(grid, gridSize);

    for (const recipe of RECIPES) {
      if (recipe.type === 'shaped') {
        const patH = recipe.pattern.length;
        const patW = recipe.pattern[0].length;

        if (w === patW && h === patH) {
          if (this.matchPattern(subGrid, recipe.pattern, w, h)) {
            return { ...recipe.result };
          }
        }
      }
    }

    return null;
  }

  // Shapeless matcher
  static matchShapeless(items, ingredients) {
    if (items.length !== ingredients.length) return false;

    const remaining = [...items];
    for (const ing of ingredients) {
      const idx = remaining.findIndex((item) => item.id === ing.id);
      if (idx === -1) return false;
      remaining.splice(idx, 1);
    }
    return remaining.length === 0;
  }

  // Trim empty borders from grid
  static trimGrid(grid, size) {
    let minR = size, maxR = -1;
    let minC = size, maxC = -1;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const item = grid[r * size + c];
        if (item) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }

    if (maxR === -1) {
      return { subGrid: [], w: 0, h: 0 };
    }

    const h = maxR - minR + 1;
    const w = maxC - minC + 1;
    const subGrid = [];

    for (let r = minR; r <= maxR; r++) {
      const row = [];
      for (let c = minC; c <= maxC; c++) {
        const item = grid[r * size + c];
        row.push(item ? item.id : null);
      }
      subGrid.push(row);
    }

    return { subGrid, w, h };
  }

  // Shaped matcher
  static matchPattern(subGrid, pattern, w, h) {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const actual = subGrid[r][c];
        const expected = pattern[r][c];
        if (actual !== expected) {
          return false;
        }
      }
    }
    return true;
  }

  // Consume 1 item per filled slot in crafting grid
  static consumeGrid(grid) {
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        grid[i].count -= 1;
        if (grid[i].count <= 0) {
          grid[i] = null;
        }
      }
    }
  }
}
