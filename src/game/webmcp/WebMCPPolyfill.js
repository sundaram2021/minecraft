/**
 * WebMCPPolyfill.js
 * Implements the W3C WebMCP (Web Model Context Protocol) standard interface:
 * https://webmachinelearning.github.io/webmcp/
 * https://developer.chrome.com/docs/ai/webmcp
 *
 * Provides specification-compliant ModelContext on:
 * - document.modelContext (W3C standard draft)
 * - navigator.modelContext (Chrome early draft / Origin Trial compatibility)
 * - window.modelContext & window.webmcp
 *
 * Supports cross-window / iframe / extension MCP JSON-RPC 2.0 communication over window.postMessage.
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

    const changeEvent = new CustomEvent('toolchange', { detail: { action: 'register', toolName: tool.name, tool } });
    this.dispatchEvent(changeEvent);
    if (typeof document !== 'undefined') document.dispatchEvent(changeEvent);
  }

  /**
   * Unregisters a tool by name.
   */
  unregisterTool(toolName) {
    if (this._tools.delete(toolName)) {
      const changeEvent = new CustomEvent('toolchange', { detail: { action: 'unregister', toolName } });
      this.dispatchEvent(changeEvent);
      if (typeof document !== 'undefined') document.dispatchEvent(changeEvent);
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
   * Returns a specific tool by name.
   */
  getTool(name) {
    return this._tools.get(name) || null;
  }

  /**
   * Executes a tool with input arguments (JSON string or object).
   * Ensures MCP standard response compatibility.
   * @param {Object|string} toolOrName
   * @param {string|Object} [inputArgs]
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
    if (parsedArgs === undefined || parsedArgs === null) {
      parsedArgs = {};
    } else if (typeof parsedArgs === 'string') {
      try {
        parsedArgs = parsedArgs.trim() ? JSON.parse(parsedArgs) : {};
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

      // Standard MCP format enhancement if not already present
      if (result && typeof result === 'object' && !result.content) {
        const textSummary = result.message || (result.success ? `Successfully executed ${toolName}` : `Execution failed for ${toolName}`);
        try {
          result.content = [{ type: 'text', text: typeof result === 'object' ? JSON.stringify(result) : String(textSummary) }];
        } catch {
          result.content = [{ type: 'text', text: String(textSummary) }];
        }
      }

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

  clearExecutionHistory() {
    this._executionHistory = [];
  }
}

/**
 * Augments an existing or native ModelContext with helper utilities (getTools, executeTool, history).
 */
function augmentModelContext(modelContext) {
  if (!modelContext._tools) {
    modelContext._tools = new Map();
  }
  if (!modelContext._executionHistory) {
    modelContext._executionHistory = [];
    modelContext.maxHistory = 100;
  }

  const origRegister = modelContext.registerTool?.bind(modelContext);
  if (origRegister) {
    modelContext.registerTool = async function(toolDef, options = {}) {
      if (toolDef?.name) {
        modelContext._tools.set(toolDef.name, toolDef);
      }
      try {
        return await origRegister(toolDef, options);
      } catch (err) {
        if (
          err.name === 'InvalidStateError' ||
          err.message?.toLowerCase().includes('duplicate') ||
          err.message?.toLowerCase().includes('already registered')
        ) {
          console.warn(`[WebMCP] Tool "${toolDef?.name}" already registered in ModelContext. Updated local mapping.`);
          return;
        }
        throw err;
      }
    };
  }

  if (!modelContext.getTools) {
    modelContext.getTools = async function() {
      return Array.from(modelContext._tools.values()).sort((a, b) => a.name.localeCompare(b.name));
    };
  }

  if (!modelContext.executeTool) {
    modelContext.executeTool = async function(toolOrName, inputArgs = {}, options = {}) {
      const toolName = typeof toolOrName === 'string' ? toolOrName : toolOrName?.name;
      const tool = modelContext._tools.get(toolName);
      if (!tool) throw new Error(`[WebMCP] Tool "${toolName}" is not registered.`);
      let parsed = inputArgs ?? {};
      if (typeof parsed === 'string') parsed = parsed.trim() ? JSON.parse(parsed) : {};
      return tool.execute(parsed, options);
    };
  }

  if (!modelContext.getExecutionHistory) {
    modelContext.getExecutionHistory = function() {
      return [...(modelContext._executionHistory || [])];
    };
  }

  return modelContext;
}

/**
 * Initializes and installs the WebMCP environment.
 * Ensures document.modelContext, navigator.modelContext, and window.modelContext are available and synchronized.
 * Mounts standard MCP JSON-RPC 2.0 & postMessage bridge for extensions and external agents.
 */
export function setupWebMCP() {
  let modelContext = document.modelContext || navigator.modelContext || window.modelContext;

  if (!modelContext) {
    modelContext = new ModelContextPolyfill();
  } else {
    modelContext = augmentModelContext(modelContext);
  }

  // Install on document.modelContext
  try {
    Object.defineProperty(document, 'modelContext', {
      value: modelContext,
      writable: true,
      configurable: true,
    });
  } catch {
    document.modelContext = modelContext;
  }

  // Install on navigator.modelContext (Chrome compatibility)
  try {
    Object.defineProperty(navigator, 'modelContext', {
      value: modelContext,
      writable: true,
      configurable: true,
    });
  } catch {
    try {
      navigator.modelContext = modelContext;
    } catch {
      // Ignored if navigator is read-only in strict environments
    }
  }

  // Install on window.modelContext
  window.modelContext = modelContext;

  // Global bridge for agent extensions, developer console, or iframe postMessage
  const bridge = {
    modelContext,
    isWebMCP: true,
    version: '1.0.0',
    async getTools() {
      return modelContext.getTools();
    },
    async callTool(name, args = {}) {
      return modelContext.executeTool(name, args);
    },
    async executeTool(name, args = {}) {
      return modelContext.executeTool(name, args);
    },
    getExecutionHistory() {
      return modelContext.getExecutionHistory ? modelContext.getExecutionHistory() : [];
    },
  };

  window.minecraftWebMCP = bridge;
  window.webmcp = bridge;

  // Install cross-window / iframe / extension PostMessage Bridge (Standard MCP JSON-RPC 2.0)
  if (!window._webmcpPostMessageInstalled) {
    window._webmcpPostMessageInstalled = true;

    window.addEventListener('message', async (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // 1. JSON-RPC 2.0 MCP Protocol (e.g. tools/list, tools/call)
      if (data.jsonrpc === '2.0' && data.method) {
        const id = data.id;
        try {
          if (data.method === 'tools/list') {
            const tools = await modelContext.getTools();
            event.source?.postMessage(
              {
                jsonrpc: '2.0',
                id,
                result: {
                  tools: tools.map((t) => ({
                    name: t.name,
                    title: t.title,
                    description: t.description,
                    inputSchema: t.inputSchema,
                    annotations: t.annotations,
                  })),
                },
              },
              event.origin || '*'
            );
          } else if (data.method === 'tools/call') {
            const toolName = data.params?.name;
            const args = data.params?.arguments || {};
            const result = await modelContext.executeTool(toolName, args);
            event.source?.postMessage(
              {
                jsonrpc: '2.0',
                id,
                result,
              },
              event.origin || '*'
            );
          }
        } catch (err) {
          event.source?.postMessage(
            {
              jsonrpc: '2.0',
              id,
              error: { code: -32603, message: err.message || String(err) },
            },
            event.origin || '*'
          );
        }
        return;
      }

      // 2. Custom WebMCP events (webmcp:getTools, webmcp:executeTool)
      if (data.type === 'webmcp:getTools') {
        const tools = await modelContext.getTools();
        window.postMessage({ type: 'webmcp:toolsResponse', requestId: data.requestId, tools }, '*');
      } else if (data.type === 'webmcp:executeTool') {
        try {
          const result = await modelContext.executeTool(data.tool, data.args);
          window.postMessage({ type: 'webmcp:executeResult', requestId: data.requestId, success: true, result }, '*');
        } catch (err) {
          window.postMessage({ type: 'webmcp:executeResult', requestId: data.requestId, success: false, error: err.message }, '*');
        }
      }
    });
  }

  // Dispatch global readiness event
  try {
    window.dispatchEvent(new CustomEvent('webmcp:ready', { detail: { bridge, modelContext } }));
  } catch {
    // Ignore in non-DOM contexts
  }

  return modelContext;
}
