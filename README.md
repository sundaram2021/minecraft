# Minecraft 3D — Agentic Voxel World via WebMCP

> **Submission for the [WebMCP Devpost Hackathon](https://webmcp.devpost.com)**  
> *A 3D voxel sandbox built with Three.js & React, powered natively in-browser by the W3C Web Model Context Protocol (WebMCP).*


## Summary

**Minecraft 3D (WebMCP Edition)** is a procedural 3D voxel sandbox running directly in the browser that bridges web-based 3D gaming with autonomous AI agency. Built from scratch with **Three.js** and **React**, it features 14 biomes, dynamic day/night cycles, weather systems (clear, rain, snow), hostile and passive mob AI, procedural audio synthesis, physics, survival/creative modes, and crafting.

By embedding the **Web Model Context Protocol (WebMCP)** directly into the browser client, this project exposes **23 standard-compliant tools** on `document.modelContext` and `navigator.modelContext`, as well as a standard **MCP JSON-RPC 2.0 `postMessage` bridge**. Players no longer play alone or fumble with complex coordinate math: an AI agent co-pilot can inspect voxel terrain, architect complex structures with progressive block-by-block animations, manage player inventories, terraform landscapes, and respond to natural language commands in real time.

## Web MCP Inspector Result and Prompt
```
User prompt: "Check my current location and inventory, set the game mode to creative, set the weather to clear and time to day, clear a space in front of me, and build a castle."
AI calling tool "get_player_state" with {}
Tool "get_player_state" result: {"success":true,"position":{"x":11.47,"y":69,"z":17.9},"facing":"South","yawDegrees":208.4,"pitchDegrees":-21.3,"gameMode":"creative","isFlying":false,"onGround":true,"inWater":false,"health":20,"maxHealth":20,"hunger":20,"biome":"Forest","timeOfDay":0.27644362450005017,"heldItem":{"id":5,"name":"oak_log","count":16}}
AI calling tool "list_inventory" with {}
Tool "list_inventory" result: {"selectedHotbarIndex":0,"totalItems":9,"items":[{"slotIndex":0,"isHotbar":true,"id":5,"name":"oak_log","count":16},{"slotIndex":1,"isHotbar":true,"id":4,"name":"cobblestone","count":32},{"slotIndex":2,"isHotbar":true,"id":22,"name":"torch","count":16},{"slotIndex":3,"isHotbar":true,"id":"wooden_pickaxe","name":"wooden_pickaxe","count":1,"durability":59},{"slotIndex":4,"isHotbar":true,"id":"wooden_sword","name":"wooden_sword","count":1,"durability":59},{"slotIndex":5,"isHotbar":true,"id":"apple","name":"apple","count":8},{"slotIndex":6,"isHotbar":true,"id":"shears","name":"shears","count":1,"durability":238},{"slotIndex":7,"isHotbar":true,"id":"wooden_hoe","name":"wooden_hoe","count":1,"durability":59},{"slotIndex":8,"isHotbar":true,"id":"wheat","name":"wheat","count":5}]}
AI calling tool "set_game_mode" with {"mode":"creative"}
Tool "set_game_mode" result: {"success":true,"mode":"creative","message":"Switched to Creative Mode: Flying and instant block mining unlocked."}
AI calling tool "set_weather" with {"weather":"clear"}
Tool "set_weather" result: {"success":true,"weather":"clear"}
AI calling tool "set_time_of_day" with {"time":"day"}
Tool "set_time_of_day" result: {"success":true,"timeOfDay":0.25}
AI calling tool "clear_area" with {"x2":35,"y2":95,"z2":65,"z1":22,"y1":69,"x1":-10}
Tool "clear_area" result: {"success":true,"clearedCount":1133,"bounds":{"minX":-10,"maxX":35,"minY":69,"maxY":95,"minZ":22,"maxZ":65}}
AI calling tool "build_structure" with {"origin":{"y":69,"z":25,"x":11},"type":"castle","instant":true}
Tool "build_structure" result: {"success":true,"structure":"castle","blocksPlaced":671,"location":{"x":11,"y":69,"z":25}}
AI result: Here are the details and actions taken:

### 📍 Location & Inventory Status
* **Location:** `(11.5, 69.0, 17.9)` in a **Forest** biome facing **South**.
* **Inventory Hotbar:**
1. Oak Logs ×16
2. Cobblestone ×32
3. Torches ×16
4. Wooden Pickaxe
5. Wooden Sword
6. Apples ×8
7. Shears
8. Wooden Hoe
9. Wheat ×5

---

### ⚙️ Environment & Settings Updated
* **Game Mode:** Set to **Creative Mode** (flying & instant mining enabled).
* **Weather:** Changed to **Clear**.
* **Time:** Set to **Day** (sunrise/morning).

---

### 🏰 Space Cleared & Castle Built
* **Cleared Area:** Prepared an open volume directly in front of you `(X: -10 to 35, Y: 69 to 95, Z: 22 to 65)`.
* **Castle Construction:** Constructed a medieval stone fortress with towers at `(11, 69, 25)`.

```

## Demo 
https://www.loom.com/share/ddb2af9b773448e5a8924102c4e1e734

## Why Your Use Case Is a Strong Fit for WebMCP

1. **Rich 3D Spatial Environment with High Dimensionality**  
   Traditional web interfaces consist of flat 2D DOM elements where standard web scraping or accessibility trees suffice. A 3D voxel world, however, contains millions of volumetric coordinates, continuous camera orientations, inventory states, and real-time physics. Standard screen-vision models struggle with depth, occluded blocks, and exact voxel mathematics. WebMCP provides a structured semantic interface where the AI agent receives grounded 3D coordinates, exact block IDs, and spatial bounding boxes without visual guesswork.

2. **Client-Side Browser Execution Without External Mod Friction**  
   Traditional Minecraft agent benchmarks (e.g., Voyager, MineDojo) require native Java installations, complex Python backend daemons, Docker containers, and modding frameworks (Forge/Fabric). This project runs entirely in client-side WebGL/JavaScript. WebMCP allows the web page itself to define and register tools directly inside the browser's execution environment with zero setup overhead for the user.

3. **Grounded, Real-Time Bidirectional Feedback**  
   With WebMCP, agent tool calls execute directly inside the running Three.js engine loop with microsecond latency. The agent can cast rays (`get_target_block`), query nearby geometry (`inspect_blocks`), modify voxel buffers (`set_blocks_batch`), and trigger immediate sound effects and chunk re-meshing without latency-heavy network hops.

4. **Zero-Hallucination Voxel Manipulation**  
   Rather than guessing where blocks are, the agent utilizes structured JSON Schemas with typed inputs and annotations (`readOnlyHint`, coordinate bounds). The game engine validates every action, loads necessary chunks on demand, and returns structured feedback to the model context.


## How It Creates a Better User Experience

- **Natural Language Co-Pilot**: Players don't need to memorize dozens of console commands or spend hours grinding manual block placements. Simply tell the agent: *"Build a stone castle with towers in front of me"*, *"Clear this hill and make it daytime"*, or *"Give me a diamond pickaxe and light up this cave"*.
- **Live Progressive Animated Construction**: Instead of structures popping into existence instantaneously, the agent can stream placements progressively (`animated: true`, configurable `delayMs`). Players can stand next to their AI companion in the 3D world and watch blocks placed one-by-one, accompanied by spatial audio synthesis.
- **Instant Undo & Error Tolerance**: Building accidents or misunderstood prompts are risk-free. A dedicated 20-step undo buffer (`undo_last_build`) allows the player or agent to revert large structural changes with a single instruction.
- **Zero Configuration**: No plugins, command-line flags, or server configurations required. Anyone can open the web link, click start, and immediately interact with an agent-ready 3D sandbox.
- **Shared Context via Crosshairs**: Tools like `get_target_block` allow human players to simply aim their crosshair at a surface and say *"Carve a doorway right here"*, creating intuitive multimodal cooperation.


## What People and Agents Can Do Together That Was Difficult or Impossible Before

| Capability | Traditional Setup / Before WebMCP | With Minecraft 3D + WebMCP |
| :--- | :--- | :--- |
| **Real-time 3D Co-Creation** | Required external Python bot bridges or manual modding; out-of-sync with browser games. | Agent and human share the active browser game session with instant state synchronization. |
| **Complex Procedural Architecture** | Players had to manually calculate spherical equations or place thousands of blocks individually. | Agent generates mathematical 3D geometries (domes, ellipsoids, cylinders, pyramids, castles) in seconds. |
| **Context-Aware Assistance** | Chatbots had no concept of where the player was looking or what blocks surrounded them. | Agent queries `get_target_block` and `inspect_blocks` to understand context and assist immediately. |
| **Dynamic Scenario & Dungeon Mastering** | Difficult to orchestrate live custom events without complex command blocks. | Agents can act as live game masters: spawning mob encounters, setting stormy weather, and provisioning gear dynamically. |
| **Universal Agent Compatibility** | Proprietary APIs or custom websockets per game. | Any standard MCP / WebMCP client, Chrome AI extension, or postMessage agent can connect out-of-the-box. |


## Briefly Explain How You Implemented WebMCP

The WebMCP integration is implemented in [`src/game/webmcp/`](./src/game/webmcp/) across two primary layers:

### 1. Specification-Compliant Polyfill & Bridge (`WebMCPPolyfill.js`)
- Follows the [W3C WebMCP Standard Draft](https://webmachinelearning.github.io/webmcp/) and [Chrome WebMCP Origin Trial Guidelines](https://developer.chrome.com/docs/ai/webmcp).
- Installs the standard `ModelContext` interface on `document.modelContext`, `navigator.modelContext`, and `window.modelContext`.
- Implements `registerTool`, `unregisterTool`, `getTools`, `executeTool`, and fires standard `toolchange` events.
- Exposes a **MCP JSON-RPC 2.0 `postMessage` Bridge** listening for `tools/list` and `tools/call`, enabling external browser extensions, iframe wrappers, and external agent runtimes to interact with the game seamlessly.
- Maintains an in-memory execution history for diagnostics and auditing.

### 2. 23 Core Minecraft WebMCP Tools (`MinecraftWebMCPTools.js`)
Tools are registered into five functional categories:

1. **Navigation & Exploration**:
   - `get_player_state`: Returns coordinates, orientation, health, hunger, active biome, and held item.
   - `move_player`: Moves player forward, backward, left, right, or jump with terrain clamping.
   - `look_at`: Controls camera pitch/yaw, targets world coordinates, or applies presets (`turn_around`, `north`, etc.).
   - `set_flying`: Toggles creative flight mode, ascend, or descend.
   - `teleport`: Instant coordinate teleportation or relative delta shifts.

2. **Environment & World Settings**:
   - `set_game_mode`: Toggles between `creative` and `survival`.
   - `set_time_of_day`: Sets sun/moon cycle (`day`, `noon`, `sunset`, `night`, `midnight`, or float 0.0–1.0).
   - `set_weather`: Toggles dynamic weather (`clear`, `rain`, `snow`).

3. **Inventory & Block Inspection**:
   - `list_available_blocks`: Queries catalog of 120+ blocks with category filtering.
   - `list_inventory`: Returns all 36 player inventory slots and item counts.
   - `select_hotbar_slot`: Activates slot (0–8) by index or item name.
   - `give_item`: Grants items or blocks directly to player.
   - `inspect_blocks`: 3D voxel scanner over a coordinate bounding box.
   - `get_target_block`: Raycasts from player's crosshair to detect targeted block and adjacent placement point.

4. **Mining & Entities**:
   - `mine_block`: Breaks block at target coordinate or in crosshair.
   - `attack_mob`: Targets and damages nearby hostile or passive mobs.
   - `spawn_mob`: Spawns passive (`pig`, `cow`, `sheep`, `chicken`, `wolf`) or hostile (`zombie`, `creeper`, `skeleton`, `spider`, `enderman`) mobs.

5. **Architectural Building & Geometry**:
   - `place_block`: Sets individual blocks with chunk loading and sound synthesis.
   - `set_blocks_batch`: Batch block placement with instant or progressive animation (`delayMs`).
   - `clear_area`: Clears 3D bounding boxes to AIR for building preparation.
   - `build_shape`: Procedural generator for 15 geometric primitives (box, cube, sphere, dome, cylinder, pillar, wall, pyramid, circle, ring, disc, platform, oval, ellipsoid; solid or hollow).
   - `build_structure`: Architectural constructor for complex buildings (`cottage`, `castle`, `watchtower`, `pyramid`, `fountain`, `portal`).
   - `undo_last_build`: 20-step undo stack reverting previous block batches.


## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sundaram2021/minecraft.git
   cd minecraft
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev
   ```

4. **Launch the game:**
   Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   Click anywhere on the splash screen to enter pointer-lock mode and begin playing.


### Testing WebMCP Tools in the Browser

You can test and verify WebMCP directly from the browser's Developer Tools Console (`F12`):

#### Option A: Direct WebMCP Bridge (`window.minecraftWebMCP` or `window.webmcp`)
```javascript
// 1. Inspect all 23 registered WebMCP tools
await window.minecraftWebMCP.getTools();

// 2. Query player position and environment state
await window.minecraftWebMCP.callTool('get_player_state');

// 3. Procedurally generate a stone castle near the player
await window.minecraftWebMCP.callTool('build_structure', {
  type: 'castle',
  instant: false // Progressive animated placement
});

// 4. Build a hollow glass dome
await window.minecraftWebMCP.callTool('build_shape', {
  shape: 'dome',
  block: 'glass',
  radius: 6,
  hollow: true,
  animated: true
});

// 5. Change environment
await window.minecraftWebMCP.callTool('set_time_of_day', { time: 'sunset' });
await window.minecraftWebMCP.callTool('set_weather', { weather: 'snow' });

// 6. Undo last construction
await window.minecraftWebMCP.callTool('undo_last_build');
```

#### Option B: W3C ModelContext Interface (`document.modelContext`)
```javascript
// Standard WebMCP tool execution
await document.modelContext.executeTool('spawn_mob', { type: 'wolf' });
```

#### Option C: Standard MCP JSON-RPC 2.0 PostMessage Bridge
External extensions, iframe parents, or MCP client scripts can post messages:
```javascript
// List tools
window.postMessage({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
}, '*');

// Call tool
window.postMessage({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'give_item',
    arguments: { item: 'diamond_pickaxe', count: 1 }
  }
}, '*');
```

### Production Build

To build the production bundle:
```bash
pnpm run build
pnpm run preview
```

---

## Open Source License

This project is licensed under the [MIT License](./LICENSE). Feel free to use, modify, and distribute it in accordance with the license terms.
