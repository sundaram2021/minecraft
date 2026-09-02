/**
 * WebMCPPolyfill.js
 * Implements the W3C WebMCP (Web Model Context Protocol) standard interface:
 * https://webmachinelearning.github.io/webmcp/
 * https://developer.chrome.com/docs/ai/webmcp
 *
 * If the browser natively provides `document.modelContext` (e.g. Chrome 149+ with
 * WebMCP origin trial or --enable-webmcp-testing), it augments and works alongside it.
 * Otherwise, it creates a fully specification-compliant polyfill on document.modelContext
 * and window.modelContext, and fires 'toolchange' events as tools are registered.
 */

class WebMCPEventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, callback) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(callback);
  }

  removeEventListener(type, callback) {
    if (this._listeners.has(type)) {
      this._listeners.get(type).delete(callback);
    }
  }

  dispatchEvent(event) {
    const listeners = this._listeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(event);
        } catch (err) {
          console.error(`[WebMCP] Error in ${event.type} event listener:`, err);
        }
      }
    }
    return true;
  }
}

export class ModelContextPolyfill extends WebMCPEventTarget {
  constructor() {
    super();
    this._tools = new Map();
    this._executionHistory = [];
    this.maxHistory = 100;
  }

  /**
   * Registers a tool according to WebMCP standard.
   * @param {Object} toolDef - { name, title, description, inputSchema, execute, annotations }
   * @param {Object} [options] - { signal }
   * @returns {Promise<void>}
   */
  async registerTool(toolDef, options = {}) {
    if (!toolDef || typeof toolDef.name !== 'string') {
      throw new Error('[WebMCP] registerTool requires a tool definition with a valid name string.');
    }

    if (typeof toolDef.execute !== 'function') {
      throw new Error(`[WebMCP] registerTool requires an execute function for tool "${toolDef.name}".`);
    }

    const tool = {
      name: toolDef.name,
      title: toolDef.title || toolDef.name,
      description: toolDef.description || '',
      inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
      execute: toolDef.execute,
      annotations: toolDef.annotations || { readOnlyHint: false, untrustedContentHint: false },
      origin: window.location.origin || 'http://localhost',
    };

    this._tools.set(tool.name, tool);

    if (options.signal) {
      if (options.signal.aborted) {
        this.unregisterTool(tool.name);
        return;
      }
      options.signal.addEventListener(
        'abort',
        () => {
          this.unregisterTool(tool.name);
        },
        { once: true }
      );
    }

    this.dispatchEvent(new CustomEvent('toolchange', { detail: { action: 'register', toolName: tool.name } }));
  }

  /**
   * Unregisters a tool by name.
   */
  unregisterTool(toolName) {
    if (this._tools.delete(toolName)) {
      this.dispatchEvent(new CustomEvent('toolchange', { detail: { action: 'unregister', toolName } }));
    }
  }

  /**
   * Returns list of registered tools.
   * @returns {Promise<Array>}
   */
  async getTools() {
    return Array.from(this._tools.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Executes a tool with input arguments (JSON string or object).
   * @param {Object|string} toolOrName
   * @param {string|Object} inputArgs
   * @param {Object} [options] - { signal }
   * @returns {Promise<any>}
   */
  async executeTool(toolOrName, inputArgs = {}, options = {}) {
    const toolName = typeof toolOrName === 'string' ? toolOrName : toolOrName?.name;
    const tool = this._tools.get(toolName);

    if (!tool) {
      throw new Error(`[WebMCP] Tool "${toolName}" is not registered.`);
    }

    let parsedArgs = inputArgs;
    if (typeof inputArgs === 'string') {
      try {
        parsedArgs = inputArgs.trim() ? JSON.parse(inputArgs) : {};
      } catch (err) {
        throw new Error(`[WebMCP] Failed to parse JSON arguments for tool "${toolName}": ${err.message}`);
      }
    }

    const executionEntry = {
      id: 'exec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      toolName,
      args: parsedArgs,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this._executionHistory.unshift(executionEntry);
    if (this._executionHistory.length > this.maxHistory) {
      this._executionHistory.pop();
    }

    try {
      const result = await tool.execute(parsedArgs, { signal: options.signal });
      executionEntry.status = 'success';
      executionEntry.result = result;
      return result;
    } catch (err) {
      executionEntry.status = 'error';
      executionEntry.error = err.message || String(err);
      throw err;
    }
  }

  getExecutionHistory() {
    return [...this._executionHistory];
  }
}

/**
 * Initializes and installs the WebMCP environment.
 * Ensures `document.modelContext` and `window.minecraftWebMCP` are available.
 */
export function setupWebMCP() {
  let modelContext = document.modelContext;

  if (!modelContext) {
    modelContext = new ModelContextPolyfill();
    try {
      Object.defineProperty(document, 'modelContext', {
        value: modelContext,
        writable: true,
        configurable: true,
      });
      window.modelContext = modelContext;
    } catch {
      document.modelContext = modelContext;
      window.modelContext = modelContext;
    }
  }

  // Preserve existing global bridge if already defined (e.g. HMR or multiple Game instances)
  if (window.minecraftWebMCP) {
    window.minecraftWebMCP.modelContext = modelContext;
    window.webmcp = window.minecraftWebMCP;
    return modelContext;
  }

  // Global bridge for agent extensions, developer console, or iframe postMessage
  const bridge = {
    modelContext,
    async getTools() {
      return modelContext.getTools();
    },
    async callTool(name, args = {}) {
      return modelContext.executeTool(name, args);
    },
    getExecutionHistory() {
      return modelContext.getExecutionHistory?.() || [];
    },
  };

  window.minecraftWebMCP = bridge;
  window.webmcp = bridge;

  return modelContext;
}
