import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, Play, Wrench, RotateCcw, X, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export function WebMCPOverlay({ isOpen, onClose, game }) {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'tools' | 'logs'
  const [tools, setTools] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const [testArgs, setTestArgs] = useState('{}');
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Sync tools and listen for toolchange events
  useEffect(() => {
    const refreshTools = async () => {
      if (document.modelContext?.getTools) {
        try {
          const list = await document.modelContext.getTools();
          setTools(list || []);
        } catch (err) {
          console.error('[WebMCPOverlay] Failed to fetch tools:', err);
        }
      }
    };

    refreshTools();

    if (document.modelContext?.addEventListener) {
      const handler = () => refreshTools();
      document.modelContext.addEventListener('toolchange', handler);
      return () => document.modelContext.removeEventListener('toolchange', handler);
    }
  }, []);

  // Update logs periodically or on events
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (window.minecraftWebMCP?.getExecutionHistory) {
        setLogs(window.minecraftWebMCP.getExecutionHistory());
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const executeToolCall = async (toolName, argsObj) => {
    setExecuting(true);
    setLastResult(null);
    try {
      let result;
      if (document.modelContext?.executeTool) {
        result = await document.modelContext.executeTool(toolName, argsObj);
      } else if (window.minecraftWebMCP?.callTool) {
        result = await window.minecraftWebMCP.callTool(toolName, argsObj);
      }
      setLastResult({ success: true, toolName, result });
      if (window.minecraftWebMCP?.getExecutionHistory) {
        setLogs(window.minecraftWebMCP.getExecutionHistory());
      }
    } catch (err) {
      setLastResult({ success: false, toolName, error: err.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  const filteredTools = tools.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      style={{ fontFamily: "'Minecraft', 'Courier New', monospace" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#1c1c1e]/95 border-4 border-[#3a3a3c] rounded-md shadow-2xl flex flex-col text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#2c2c2e] border-b-2 border-[#3a3a3c]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black font-black shadow">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-yellow-300">WebMCP Agent Bridge</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                  ● {tools.length} Tools Active
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Chrome AI / W3C WebMCP Standard Interface</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm bg-[#3a3a3c] hover:bg-[#48484a] text-gray-300 hover:text-white transition"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#18181b] border-b border-[#2e2e32] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-sm border-t-2 transition ${
              activeTab === 'quick'
                ? 'bg-[#27272a] text-yellow-300 border-yellow-400'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Quick AI Actions
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-sm border-t-2 transition ${
              activeTab === 'tools'
                ? 'bg-[#27272a] text-yellow-300 border-yellow-400'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Tool Catalog ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-sm border-t-2 transition ${
              activeTab === 'logs'
                ? 'bg-[#27272a] text-yellow-300 border-yellow-400'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Agent Execution Log ({logs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#121214] text-xs">
          {/* TAB 1: QUICK ACTIONS */}
          {activeTab === 'quick' && (
            <div className="space-y-5">
              <div className="p-4 rounded-sm bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-transparent border border-emerald-800/40">
                <h3 className="text-sm font-bold text-emerald-300 mb-1">🤖 AI Agent Showcase Tools</h3>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  These are real WebMCP tools registered directly on <code className="text-white bg-black/40 px-1 py-0.5 rounded">document.modelContext</code>.
                  AI Agents connect via WebMCP or Chrome Model Context Extension to invoke them autonomously.
                </p>
              </div>

              {/* Showcase Grid */}
              <div>
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Featured WebMCP Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Action 1: OpenAI Logo */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('build_voxel_art', { preset: 'openai_logo', plane: 'vertical_xy' })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-cyan-500/40 hover:border-cyan-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-cyan-300 group-hover:text-cyan-200">Build OpenAI Logo</span>
                        <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded">Voxel Art</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Procedurally construct the iconic OpenAI spiral knot in high-definition wool voxels.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 2: Creative Mode */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('set_game_mode', { mode: 'creative' })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-amber-500/40 hover:border-amber-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-amber-300 group-hover:text-amber-200">Creative Mode</span>
                        <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded">Mode</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Unlock creative flight, unlimited block placing, and instant mining.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 3: Survival Mode */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('set_game_mode', { mode: 'survival' })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-red-500/40 hover:border-red-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-red-300 group-hover:text-red-200">Survival Mode</span>
                        <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded">Mode</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Enable health/hunger physics, fall damage, and standard survival mining.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-red-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 4: Fly & Ascend */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('set_flying', { flying: true, direction: 'up', blocks: 6 })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-blue-500/40 hover:border-blue-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-blue-300 group-hover:text-blue-200">Fly & Ascend +6</span>
                        <span className="text-[10px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded">Flight</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Toggle flying on and ascend 6 blocks up for aerial perspective.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-blue-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 5: Build Medieval Watchtower */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('build_structure', { type: 'watchtower', instant: false })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-emerald-500/40 hover:border-emerald-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-emerald-300 group-hover:text-emerald-200">Build Watchtower</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">Structure</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Construct a medieval stone battlements tower with beacon and arrow slits.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 6: Build Glowstone Sphere */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('build_shape', { shape: 'sphere', block: 'glowstone', radius: 4, hollow: true })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-yellow-500/40 hover:border-yellow-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-yellow-300 group-hover:text-yellow-200">Glowstone Sphere</span>
                        <span className="text-[10px] bg-yellow-950 text-yellow-400 px-1.5 py-0.5 rounded">3D Shape</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Procedurally generate a hollow radiant glowing sphere.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-yellow-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 7: Spawn Friendly Sheep */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('spawn_mob', { type: 'sheep' })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-purple-500/40 hover:border-purple-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-purple-300 group-hover:text-purple-200">Spawn Sheep</span>
                        <span className="text-[10px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded">Mob</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Spawn an animated sheep mob near the player.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-purple-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 8: Turn Around 180° */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('look_at', { preset: 'turn_around' })}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-indigo-500/40 hover:border-indigo-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-indigo-300 group-hover:text-indigo-200">Turn Around 180°</span>
                        <span className="text-[10px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded">Navigation</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Rotate camera orientation completely around to face backward.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                      Run Tool →
                    </span>
                  </button>

                  {/* Action 9: Undo Last Build */}
                  <button
                    disabled={executing}
                    onClick={() => executeToolCall('undo_last_build', {})}
                    className="p-3.5 rounded-sm bg-[#1e293b] hover:bg-[#334155] border border-pink-500/40 hover:border-pink-400 text-left transition flex flex-col justify-between group shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-pink-300 group-hover:text-pink-200">Undo Last Build</span>
                        <span className="text-[10px] bg-pink-950 text-pink-400 px-1.5 py-0.5 rounded">Safety</span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Revert the previous building batch and restore original blocks.
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] text-pink-400 font-bold flex items-center gap-1">
                      Undo →
                    </span>
                  </button>
                </div>
              </div>

              {/* Execution Result Banner */}
              {lastResult && (
                <div
                  className={`p-3.5 rounded-sm border ${
                    lastResult.success
                      ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
                      : 'bg-red-950/60 border-red-600/50 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {lastResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span>Tool: {lastResult.toolName} ({lastResult.success ? 'Success' : 'Failed'})</span>
                  </div>
                  <pre className="text-[10px] bg-black/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(lastResult.result || lastResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOOL CATALOG */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-[#1c1c1f] p-2 rounded-sm border border-[#2e2e32]">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search registered tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white placeholder-gray-500 text-xs w-full focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3 rounded-sm bg-[#1a1a1d] border border-[#2e2e32] hover:border-yellow-400/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-yellow-300">{tool.title || tool.name}</span>
                        <code className="text-[10px] text-gray-400 bg-black/40 px-1 py-0.5 rounded">{tool.name}</code>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-normal mb-2">{tool.description}</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        {tool.inputSchema?.required?.length ? `Requires: ${tool.inputSchema.required.join(', ')}` : 'No required params'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTool(tool);
                          setTestArgs('{}');
                        }}
                        className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-[10px] rounded-xs transition"
                      >
                        Inspect / Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Tool Modal / Runner */}
              {selectedTool && (
                <div className="p-4 bg-[#1f1f23] border border-yellow-400/50 rounded-sm space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-yellow-300 text-sm">Testing: {selectedTool.name}</h4>
                    <button onClick={() => setSelectedTool(null)} className="text-gray-400 hover:text-white text-xs">Close</button>
                  </div>
                  <p className="text-gray-300 text-[11px]">{selectedTool.description}</p>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Arguments (JSON string):</label>
                    <textarea
                      rows={3}
                      value={testArgs}
                      onChange={(e) => setTestArgs(e.target.value)}
                      className="w-full bg-black/60 border border-gray-700 rounded p-2 text-xs font-mono text-green-300 focus:outline-hidden"
                    />
                  </div>

                  <button
                    disabled={executing}
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(testArgs || '{}');
                        executeToolCall(selectedTool.name, parsed);
                      } catch (err) {
                        alert('Invalid JSON: ' + err.message);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xs text-xs"
                  >
                    Execute {selectedTool.name}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENT EXECUTION LOG */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">Real-time trace of AI Agent WebMCP calls</span>
                <button
                  onClick={() => setLogs(window.minecraftWebMCP?.getExecutionHistory?.() || [])}
                  className="flex items-center gap-1 text-xs text-yellow-300 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded">
                  No AI agent executions recorded yet. Call an action from the "Quick AI Actions" tab or connect an agent!
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-[#18181b] border border-[#27272a] rounded-sm text-[11px] font-mono"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              entry.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          <strong className="text-yellow-300">{entry.toolName}</strong>
                        </div>
                        <span className="text-gray-500 text-[10px]">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="bg-black/40 p-2 rounded text-gray-300 mb-1 overflow-x-auto">
                        <div className="text-[10px] text-gray-500 mb-0.5">Arguments:</div>
                        {JSON.stringify(entry.args)}
                      </div>

                      {entry.result && (
                        <div className="bg-emerald-950/30 border border-emerald-800/30 p-2 rounded text-emerald-300 overflow-x-auto">
                          <div className="text-[10px] text-emerald-500 mb-0.5">Result:</div>
                          {JSON.stringify(entry.result)}
                        </div>
                      )}
                      {entry.error && (
                        <div className="bg-red-950/30 border border-red-800/30 p-2 rounded text-red-300">
                          {entry.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between text-[10px] text-gray-400">
          <span>WebMCP community draft • Chrome Origin Trial & Extension compatible</span>
          <span>Press <strong className="text-white">Esc</strong> or click outside to resume game</span>
        </div>
      </div>
    </div>
  );
}
