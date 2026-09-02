// Input Manager: Handles Keyboard, Mouse, Pointer Lock, Hotbar selection, and UI keys

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;

    // Movement state
    this.keys = {
      forward: false,  // W / ArrowUp
      backward: false, // S / ArrowDown
      left: false,     // A / ArrowLeft
      right: false,    // D / ArrowRight
      jump: false,     // Space
      sneak: false,    // Shift
      sprint: false,   // Ctrl or double tap W
    };

    // Mouse state
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.mouseButtons = {
      left: false,
      right: false,
      middle: false,
    };

    // Action Triggers / Callbacks
    this.onInventoryToggle = null; // 'E' key
    this.onDebugToggle = null;     // 'F3' key
    this.onPauseToggle = null;     // 'Esc' key
    this.onHotbarSelect = null;    // Numbers 1-9 & Mouse wheel
    this.onToolCycle = null;       // Shift + left/right arrows
    this.onFlyToggle = null;       // Double space or F in creative
    this.onBuildMenuToggle = null;  // B key
    this.onLeftClick = null;
    this.onRightClick = null;
    this.onMiddleClick = null;

    this.isPointerLocked = false;
    this.lastSpaceTime = 0;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
      if (!this.isPointerLocked) this.resetTransientState();
    });
    window.addEventListener('blur', () => this.resetTransientState());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetTransientState();
    });
  }

  requestPointerLock() {
    if (this.domElement && !this.isPointerLocked && document.body.contains(this.domElement)) {
      try {
        const p = this.domElement.requestPointerLock();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (e) {
        // Silently handle browser pointer lock restrictions
      }
    }
  }

  exitPointerLock() {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (e) {}
  }

  resetTransientState() {
    Object.keys(this.keys).forEach((key) => { this.keys[key] = false; });
    Object.keys(this.mouseButtons).forEach((button) => { this.mouseButtons[button] = false; });
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  handleKeyDown(e) {
    const code = e.code;

    // F3 toggle debug
    if (code === 'F3') {
      e.preventDefault();
      if (this.onDebugToggle) this.onDebugToggle();
      return;
    }

    // Inventory 'E'
    if (code === 'KeyE') {
      if (this.onInventoryToggle) this.onInventoryToggle();
      return;
    }

    // Build Menu 'B'
    if (code === 'KeyB') {
      if (this.onBuildMenuToggle) this.onBuildMenuToggle();
      return;
    }

    // Pause / Escape
    if (code === 'Escape') {
      if (this.onPauseToggle) this.onPauseToggle();
      return;
    }

    // Tool cycle: Shift + left/right arrow changes the selected tool.
    if (e.shiftKey && (code === 'ArrowLeft' || code === 'ArrowRight')) {
      e.preventDefault();
      if (this.onToolCycle) this.onToolCycle(code === 'ArrowRight' ? 1 : -1);
      return;
    }

    // Hotbar keys 1-9
    if (e.key >= '1' && e.key <= '9') {
      const slotIndex = parseInt(e.key, 10) - 1;
      if (this.onHotbarSelect) this.onHotbarSelect(slotIndex);
      return;
    }

    // Explicit flight toggle for keyboard layouts where double-space is unreliable.
    if (code === 'KeyF') {
      e.preventDefault();
      if (this.onFlyToggle) this.onFlyToggle();
      return;
    }

    // Double tap space for flight toggle
    if (code === 'Space') {
      const now = performance.now();
      if (now - this.lastSpaceTime < 300) {
        if (this.onFlyToggle) this.onFlyToggle();
      }
      this.lastSpaceTime = now;
    }

    // Movement keys
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
    if (code === 'Space') this.keys.jump = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sneak = true;
    if (code === 'ControlLeft' || code === 'ControlRight') this.keys.sprint = true;
  }

  handleKeyUp(e) {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    if (code === 'Space') this.keys.jump = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sneak = false;
    if (code === 'ControlLeft' || code === 'ControlRight') this.keys.sprint = false;
  }

  handleMouseMove(e) {
    if (!this.isPointerLocked) return;
    this.mouseDeltaX += e.movementX || 0;
    this.mouseDeltaY += e.movementY || 0;
  }

  handleMouseDown(e) {
    // UI owns clicks while the canvas is not locked. Never steal a modal click
    // by requesting pointer lock from a document-level mouse listener.
    if (!this.isPointerLocked) {
      if (e.target === this.domElement) {
        this.requestPointerLock();
        // Preserve the first gameplay click so right-click building works immediately.
        if (e.button === 2 && this.onRightClick) this.onRightClick();
      }
      return;
    }

    if (e.button === 0) {
      this.mouseButtons.left = true;
      if (this.onLeftClick) this.onLeftClick();
    } else if (e.button === 2) {
      this.mouseButtons.right = true;
      if (this.onRightClick) this.onRightClick();
    } else if (e.button === 1) {
      this.mouseButtons.middle = true;
      if (this.onMiddleClick) this.onMiddleClick();
    }
  }

  handleMouseUp(e) {
    if (e.button === 0) this.mouseButtons.left = false;
    if (e.button === 2) this.mouseButtons.right = false;
    if (e.button === 1) this.mouseButtons.middle = false;
  }

  handleWheel(e) {
    if (!this.isPointerLocked) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    if (this.onHotbarSelect) {
      this.onHotbarSelect(delta, true); // relative delta
    }
  }

  consumeMouseDelta() {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }
}
