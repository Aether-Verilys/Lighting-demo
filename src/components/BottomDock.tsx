/**
 * Lumina 3D - Bottom Dock Control Panel
 * Unified, collapsible bottom dock pinned to bottom-center.
 * Zero side-panel clutter, pure viewport focus, highly ergonomic.
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Sun,
  Palette,
  Sparkles,
  Columns2,
  Check,
} from 'lucide-react';
import {
  RenderState,
  MaterialPresetId,
  ShadowType,
  ToneMappingType,
  EnvPresetId,
  PbrMapsConfig,
} from '../types/rendering';
import { RENDER_STAGES, MATERIAL_PRESETS, DEFAULT_PBR_MAPS, PEDESTAL_PRESETS } from '../utils/constants';

interface BottomDockProps {
  state: RenderState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  onSelectStage: (stageIndex: number) => void;
  onOpenResources?: () => void;
  availableMaps?: Record<string, boolean>;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  state,
  activeTab,
  setActiveTab,
  onUpdateState,
  onSelectStage,
  onOpenResources,
  availableMaps,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unlockedMax, setUnlockedMax] = useState(0); // index of highest unlocked stage

  // Track unlocked stages sequentially
  React.useEffect(() => {
    const idx = RENDER_STAGES.findIndex((s) => s.id === state.currentStage);
    if (idx >= 0) {
      setUnlockedMax((prev) => Math.max(prev, idx));
    }
  }, [state.currentStage]);

  // Tab definitions
  const tabs = [
    { id: 'stages', label: '演进预设', icon: Layers },
    { id: 'lighting', label: '光照与 IBL', icon: Sun },
    { id: 'material', label: 'PBR 物理材质', icon: Palette },
    { id: 'shadows', label: '阴影与 AO', icon: Sparkles },
    { id: 'post', label: '后期与分屏', icon: Columns2 },
  ];

  return (
    <div className="fixed top-4 left-4 bottom-4 z-20 flex items-start transition-all duration-300 ease-out">
      {/* Main Panel + Toggle */}
      {!isCollapsed ? (
        <div className="flex flex-col h-full w-[340px] bg-slate-950/75 backdrop-blur-2xl border border-slate-800/70 rounded-2xl shadow-2xl text-slate-200 overflow-hidden">
          {/* Tab Navigation Strip (Always Visible Top Row) */}
          <div className="flex items-center justify-between gap-2 p-3 pb-2.5 border-b border-slate-800/60">
            <div className="flex items-center gap-1 flex-wrap">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors shrink-0"
              title="收起面板"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 pt-0 custom-scrollbar">

          {/* Tab 1: Render Stages Guided Tour */}
          {activeTab === 'stages' && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span>从左至右点击体验实时渲染光影技术的逐步演进（8个核心阶段）：</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {RENDER_STAGES.map((stage, idx) => {
                  const isCurrent = state.currentStage === stage.id;
                  const isUnlocked = idx <= unlockedMax;
                  const isNext = idx === unlockedMax + 1;
                  const isLocked = !isUnlocked;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => {
                        if (isUnlocked || isNext) onSelectStage(idx);
                      }}
                      className={`relative text-left p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-950/60 border-blue-500/80 shadow-md shadow-blue-500/10'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                          : isNext
                          ? 'bg-slate-950/40 border-slate-800/40 hover:bg-slate-900/40 hover:border-slate-700/60 cursor-pointer'
                          : 'bg-slate-950/30 border-slate-800/30 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          STAGE 0{stage.stepNumber}
                        </span>
                        {isCurrent && (
                          <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
                        )}
                      </div>
                      {isLocked ? (
                        <div className="text-xs font-semibold text-slate-500 mb-0.5">
                          {isNext ? '??? 点击解锁' : '🔒 未解锁'}
                        </div>
                      ) : (
                        <>
                          <div className="text-xs font-semibold text-slate-200 mb-0.5 truncate">
                            {stage.title}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-2">
                            {stage.keyFeature}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stage 2 Interactive Callout: Ambient Light Experiment */}
              {state.currentStage === 'stage2_direct_lambert' && (
                <div className="mt-3 p-3.5 bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-indigo-950/60 rounded-xl border border-blue-500/50 shadow-lg">
                  <div className="flex flex-col sm:flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-200">
                          💡 Stage 2 核心对比实验：环境光 (Ambient Light) 开关
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            state.lighting.ambientEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {state.lighting.ambientEnabled
                            ? '环境光已开启 · 暗部柔和通透'
                            : '环境光已关闭 · 背光面纯黑死黑 (N·L ≤ 0)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {state.lighting.ambientEnabled ? (
                          <>
                            ✨ <strong>暗部通透</strong>：开启环境光后，全局获得均匀漫射补光 (
                            <code className="text-blue-300 font-mono text-[10px]">
                              I = I_ambient + I_direct·max(N·L, 0)
                            </code>
                            )，背光面形体轮廓与暗部细节清晰可见。
                          </>
                        ) : (
                          <>
                            🌑 <strong>纯直射光死黑</strong>：纯 Lambert
                            模型下，当光线与法线夹角大于 90° 时余弦值 ≤ 0，背光面光强恒为
                            0。没有环境光补光，暗部所有细节完全丢失！
                          </>
                        )}
                      </p>
                    </div>

                    {/* Quick Toggle Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          onUpdateState((prev) => ({
                            ...prev,
                            lighting: {
                              ...prev.lighting,
                              ambientEnabled: !prev.lighting.ambientEnabled,
                            },
                          }))
                        }
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
                          state.lighting.ambientEnabled
                            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'
                            : 'bg-slate-800 text-rose-300 border border-rose-500/40 hover:bg-slate-750'
                        }`}
                      >
                        <span>环境光开关:</span>
                        <span className="font-bold underline">
                          {state.lighting.ambientEnabled ? 'ON (开)' : 'OFF (关)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Ambient Light Intensity & Tone Quick Bar when Enabled */}
                  {state.lighting.ambientEnabled && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">环境光强度:</span>
                        <input
                          type="range"
                          min="0.05"
                          max="1.2"
                          step="0.05"
                          value={state.lighting.ambientIntensity}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              lighting: {
                                ...prev.lighting,
                                ambientIntensity: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-36"
                        />
                        <span className="text-[11px] font-mono text-blue-300 w-10">
                          {state.lighting.ambientIntensity.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto text-[10px]">
                        <span className="text-slate-400">预设补光:</span>
                        {[
                          { label: '微弱 (0.15)', val: 0.15 },
                          { label: '标准 (0.35)', val: 0.35 },
                          { label: '明亮 (0.60)', val: 0.60 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() =>
                              onUpdateState((prev) => ({
                                ...prev,
                                lighting: {
                                  ...prev.lighting,
                                  ambientIntensity: preset.val,
                                },
                              }))
                            }
                            className={`px-2 py-0.5 rounded transition-colors ${
                              Math.abs(state.lighting.ambientIntensity - preset.val) < 0.05
                                ? 'bg-blue-600 text-white font-medium'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Lighting & IBL */}
          {activeTab === 'lighting' && (
            <div className="pt-4 grid grid-cols-1 gap-5 text-xs">
              {/* Left Column: Direct Sun Light & Ambient Light */}
              <div className="space-y-4">
                {/* Direct Sun Light */}
                <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">直接方向光 (Directional Sun)</span>
                      <span className="text-[10px] text-slate-400">主光源</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.lighting.directEnabled}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            lighting: { ...prev.lighting, directEnabled: e.target.checked },
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {state.lighting.directEnabled && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>光照强度 (Intensity)</span>
                          <span className="font-mono text-slate-300">
                            {state.lighting.directIntensity.toFixed(1)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.1"
                          value={state.lighting.directIntensity}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              currentStage: 'custom',
                              lighting: {
                                ...prev.lighting,
                                directIntensity: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>方位角 (Azimuth)</span>
                            <span className="font-mono text-slate-300">
                              {state.lighting.directAzimuth}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={state.lighting.directAzimuth}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                lighting: {
                                  ...prev.lighting,
                                  directAzimuth: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>高度角 (Elevation)</span>
                            <span className="font-mono text-slate-300">
                              {state.lighting.directElevation}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="85"
                            step="2"
                            value={state.lighting.directElevation}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                lighting: {
                                  ...prev.lighting,
                                  directElevation: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ambient Light (基础环境漫射光) */}
                <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">基础环境光 (Ambient Light)</span>
                        <span className="text-[10px] text-slate-400">暗部漫射底光</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        防止背光面与缝隙陷入纯黑死黑，为场景注入全向均匀漫射底色
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.lighting.ambientEnabled}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            lighting: { ...prev.lighting, ambientEnabled: e.target.checked },
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {state.lighting.ambientEnabled && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>环境光强度 (Intensity)</span>
                          <span className="font-mono text-slate-300">
                            {state.lighting.ambientIntensity.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1.5"
                          step="0.05"
                          value={state.lighting.ambientIntensity}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              currentStage: 'custom',
                              lighting: {
                                ...prev.lighting,
                                ambientIntensity: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Indirect Light & IBL */}

              {/* Indirect Light & IBL */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">间接环境光照 (IBL / Indirect)</span>
                    <span className="text-[10px] text-slate-400">图像级反射</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.lighting.iblEnabled}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          currentStage: 'custom',
                          lighting: { ...prev.lighting, iblEnabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {state.lighting.iblEnabled && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>IBL 强度 (Env Radiance)</span>
                        <span className="font-mono text-slate-300">
                          {state.lighting.iblIntensity.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.05"
                        value={state.lighting.iblIntensity}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            lighting: {
                              ...prev.lighting,
                              iblIntensity: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>全景环境光预设 (HDR Environment)</span>
                        <span className="text-[10px] text-blue-400 font-mono">真实 32-bit 浮点辐射度</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { id: 'ferndale_studio', label: 'Ferndale 摄影棚', badge: 'HDR' },
                          { id: 'monochrome_studio', label: '黑白极简影棚', badge: 'HDR' },
                          { id: 'sunset', label: '威尼斯日落金辉', badge: 'HDR' },
                          { id: 'night', label: '赛博霓虹夜景', badge: 'Proc' },
                        ].map((env) => (
                          <button
                            key={env.id}
                            onClick={() =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                lighting: {
                                  ...prev.lighting,
                                  iblPreset: env.id as EnvPresetId,
                                },
                              }))
                            }
                            className={`px-2.5 py-1.5 text-[11px] rounded-lg transition-all flex items-center justify-between ${
                              state.lighting.iblPreset === env.id
                                ? 'bg-blue-600 text-white font-medium shadow-sm ring-1 ring-blue-400/40'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                            }`}
                          >
                            <span>{env.label}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                              env.badge === 'HDR' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {env.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Skybox Panorama Backdrop Controls */}
                    <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-slate-200">
                            显示 360° 全景天空盒 (Skybox Background)
                          </div>
                          <div className="text-[10px] text-slate-500">
                            呈现真实摄影棚环形天幕与柔光箱背景，告别纯黑虚空
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.lighting.showSkybox}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                lighting: { ...prev.lighting, showSkybox: e.target.checked },
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>

                      {state.lighting.showSkybox && (
                        <div className="grid grid-cols-1 gap-3 pt-1">
                          <div>
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>背景景深虚化 (Skybox Blur)</span>
                              <span className="font-mono text-slate-300">
                                {Math.round(state.lighting.skyboxBlur * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.02"
                              value={state.lighting.skyboxBlur}
                              onChange={(e) =>
                                onUpdateState((prev) => ({
                                  ...prev,
                                  currentStage: 'custom',
                                  lighting: {
                                    ...prev.lighting,
                                    skyboxBlur: parseFloat(e.target.value),
                                  },
                                }))
                              }
                              className="w-full"
                            />
                            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                              <span>全景清晰</span>
                              <span>影棚景深</span>
                              <span>极度光斑</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                              <span>背景曝光亮度 (Skybox Intensity)</span>
                              <span className="font-mono text-slate-300">
                                {state.lighting.skyboxIntensity.toFixed(2)}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="2.0"
                              step="0.05"
                              value={state.lighting.skyboxIntensity}
                              onChange={(e) =>
                                onUpdateState((prev) => ({
                                  ...prev,
                                  currentStage: 'custom',
                                  lighting: {
                                    ...prev.lighting,
                                    skyboxIntensity: parseFloat(e.target.value),
                                  },
                                }))
                              }
                              className="w-full"
                            />
                            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                              <span>暗调衬托</span>
                              <span>标准匹配</span>
                              <span>高亮白棚</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Material & PBR */}
          {activeTab === 'material' && (
            <div className="pt-4 space-y-4 text-xs">
              {/* PBR vs Legacy Switch */}
              <div className="flex flex-col items-start justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">着色模型架构 (Shading Model)</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${state.pbr.pbrEnabled ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                      {state.pbr.pbrEnabled ? 'PBR 能量守恒' : '非物理塑料感'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {state.pbr.pbrEnabled
                      ? '基于物理的微表面模型 · 金属导体只发生菲涅尔镜面反射，绝缘体发生微漫反射'
                      : '传统非物理着色 (Legacy Blinn-Phong) · 所有材质共用一层塑料白斑高光，金属失真严重'}
                  </p>
                </div>
                <div className="flex items-center p-1 bg-slate-800 rounded-lg shrink-0">
                  <button
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        currentStage: 'custom',
                        pbr: { ...prev.pbr, pbrEnabled: true },
                      }))
                    }
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      state.pbr.pbrEnabled
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    现代 PBR
                  </button>
                  <button
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        currentStage: 'custom',
                        pbr: { ...prev.pbr, pbrEnabled: false, legacyShadingModel: 'phong' },
                      }))
                    }
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      !state.pbr.pbrEnabled
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    传统着色
                  </button>
                </div>
              </div>

              {/* PBR Texture Maps Channel Inspector */}
              <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col items-start justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-slate-200">
                        PBR 物理贴图独立通道开关 (Texture Map Channels)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      独立开关各个物理贴图，实时观察法线凹凸细节、粗糙度磨损、金属遮罩对材质表现的巨大影响
                    </p>
                  </div>
                </div>

                {/* 6 Individual Map Channel Switches */}
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      key: 'albedoMap',
                      title: '基础色彩 (Base Color / Albedo)',
                      tag: '固有色 & 图样',
                      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                      desc: '表面固有色彩与划痕底层色',
                      offState: '关：转为均匀中性底色，排除色彩干扰看光影',
                    },
                    {
                      key: 'normalMap',
                      title: '法线凹凸 (Tangent Normal)',
                      tag: '细节刻线',
                      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                      desc: '切线空间微表面向量扰动',
                      offState: '关：瞬间抹平所有划痕深度、螺丝凹孔与缝隙！',
                    },
                    {
                      key: 'roughnessMap',
                      title: '粗糙度通道 (Roughness Map)',
                      tag: '光泽磨损差异',
                      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                      desc: '微观高光发散与反光模糊度',
                      offState: '关：退化为全表面单一反光，失去磨损斑驳感',
                    },
                    {
                      key: 'metalnessMap',
                      title: '金属度遮罩 (Metalness Map)',
                      tag: '导体 vs 绝缘体',
                      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                      desc: '裸露金属 vs 漆面电介质',
                      offState: '关：失去导体与绝缘体边界判定',
                    },
                    {
                      key: 'aoMap',
                      title: '环境光遮蔽 (AO Map)',
                      tag: '微缝隙自遮蔽',
                      color: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
                      desc: '耳盘、眼窝与缝隙微暗部',
                      offState: '关：深缝由于天光反射发白，物体发飘',
                    },
                    {
                      key: 'emissiveMap',
                      title: '自发光通道 (Emissive Map)',
                      tag: '科技指示灯',
                      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
                      desc: '传感器与战盔电子发光单元',
                      offState: '关：指示灯熄灭，不发射可见光',
                    },
                  ].map((m) => {
                    const isEnabled = state.pbr.maps?.[m.key as keyof PbrMapsConfig] ?? true;
                    const isAvailable = availableMaps?.[m.key] ?? true;
                    return (
                      <div
                        key={m.key}
                        onClick={() => {
                          if (!isAvailable) return;
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            pbr: {
                              ...prev.pbr,
                              maps: {
                                ...(prev.pbr.maps || DEFAULT_PBR_MAPS),
                                [m.key]: !isEnabled,
                              },
                            },
                          }));
                        }}
                        className={`p-2.5 rounded-xl border transition-all ${
                          !isAvailable
                            ? 'bg-slate-950/30 border-slate-800/30 opacity-40 cursor-not-allowed'
                            : isEnabled
                            ? 'bg-slate-900/90 border-slate-700/90 hover:border-blue-500/60 shadow-sm cursor-pointer'
                            : 'bg-slate-950/40 border-slate-800/40 opacity-60 hover:opacity-85 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${m.color}`}>
                            {m.tag}
                          </span>
                          <label
                            className="relative inline-flex items-center cursor-pointer pointer-events-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isAvailable && isEnabled}
                              readOnly
                              disabled={!isAvailable}
                              className="sr-only peer"
                            />
                            <div className="w-7 h-3.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                          </label>
                        </div>
                        <div className="font-semibold text-xs text-slate-200 truncate">{m.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.desc}</div>
                        <div
                          className={`text-[9px] mt-1 line-clamp-1 ${
                            !isAvailable ? 'text-slate-600' : isEnabled ? 'text-slate-500' : 'text-amber-400/90 font-medium'
                          }`}
                        >
                          {!isAvailable ? '⊘ 该模型不含此贴图' : isEnabled ? '● 贴图已加载生效' : m.offState}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Material Assembly Breakdown Cards */}
              <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>当前模型合理部件物理材质一览 (Component Material Blueprint)：</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">

                    {(state.model === 'boombox' || state.model === 'gear') && [
                      { title: '红木贴皮箱体', type: '有机绝缘体 (Wood Veneer)', desc: '经典复古木纹贴面 · 粗糙度 0.65 · 金属度 0.0', color: '#7c2d12', badge: '木质箱体' },
                      { title: '铝合金拉丝旋钮', type: '轻量合金 (Brushed Metal)', desc: '切线微表面反射 · 粗糙度 0.22 · 金属度 0.95', color: '#e2e8f0', badge: '金属旋钮' },
                      { title: '镀铬喇叭冲孔网', type: '镜面金属 (Chrome Grille)', desc: '密集冲孔法线与凹孔 AO 烘焙 · 金属度 1.0', color: '#cbd5e1', badge: '金属部位' },
                      { title: '卡带光学透窗', type: '亚克力电介质 (Acrylic Glass)', desc: '高透光折射 · 粗糙度 0.05 · IOR 1.49', color: '#93c5fd', badge: '透明视窗' },
                      { title: 'VU 表发光指示', type: '科技发光 (Emissive LEDs)', desc: '音频电平与电源自发光绿/红色贴图', color: '#22c55e', badge: '发光部位' },
                      { title: '黑檀木展台底座', type: '实木绝缘体 (Ebony Wood)', desc: '画廊级实木底座 · 粗糙度 0.62 · 金属度 0.0', color: '#3b1807', badge: '木材基座' },
                    ].map((p, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-start gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border border-white/20 shadow-inner" style={{ backgroundColor: p.color }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200 text-xs truncate">{p.title}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-normal shrink-0">{p.badge}</span>
                          </div>
                          <div className="text-[10px] text-indigo-300 font-medium truncate mt-0.5">{p.type}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.desc}</div>
                        </div>
                      </div>
                    ))}

                    {state.model === 'helmet' && [
                      { title: '战损钛合金装甲', type: '工业级 PBR 贴图 (GLB)', desc: '2K 金属度/粗糙度贴图 · 微划痕与剥落漆面', color: '#64748b', badge: '金属/漆面' },
                      { title: '深缝环境光遮蔽', type: '烘焙 2K AO (Occlusion)', desc: '眼窝/耳盘/缝隙原厂高质量微遮蔽贴图', color: '#1e293b', badge: 'AO 贴图' },
                      { title: '微观法线凹坑', type: '切线空间法线 (Normal)', desc: '精细装甲冲压件与边缘螺栓微法线', color: '#818cf8', badge: '法线贴图' },
                      { title: '传感器目镜', type: '高反射菲涅尔 (Visor)', desc: '金色反光目镜 · 强烈掠射角菲涅尔', color: '#eab308', badge: '目镜部位' },
                      { title: '黑檀木展台底座', type: '实木绝缘体 (Ebony Wood)', desc: '画廊级高档实木底座 · 粗糙度 0.62 · 金属度 0.0', color: '#3b1807', badge: '木材部位' },
                      { title: '黄铜加固台环', type: '抛光黄铜 (Brass Collar)', desc: '金属台环 · 粗糙度 0.22 · 金属度 0.95', color: '#d4af37', badge: '金属部位' },
                    ].map((p, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-start gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border border-white/20 shadow-inner" style={{ backgroundColor: p.color }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200 text-xs truncate">{p.title}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-normal shrink-0">{p.badge}</span>
                          </div>
                          <div className="text-[10px] text-indigo-300 font-medium truncate mt-0.5">{p.type}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          )}

          {/* Tab 4: Shadows & AO */}
          {activeTab === 'shadows' && (
            <div className="pt-4 grid grid-cols-1 gap-5 text-xs">
              {/* Shadows & Softness */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <span className="font-semibold text-slate-200">阴影柔化算法 (Shadow Filtering)</span>

                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-800 rounded-lg">
                  {[
                    { id: 'none', label: '关闭' },
                    { id: 'hard', label: '硬阴影' },
                    { id: 'pcf', label: 'PCF' },
                    { id: 'pcfsoft', label: 'PCF 柔化' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          currentStage: 'custom',
                          shadow: { ...prev.shadow, mode: s.id as ShadowType },
                        }))
                      }
                      className={`py-1 text-[11px] font-medium rounded-md transition-all text-center ${
                        state.shadow.mode === s.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {state.shadow.mode !== 'none' && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>半影柔化半径 (Shadow Radius)</span>
                        <span className="font-mono text-slate-300">
                          {state.shadow.radius.toFixed(1)} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="0.5"
                        value={state.shadow.radius}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            shadow: { ...prev.shadow, radius: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-300">地面接触阴影 (Contact Shadow)</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.shadow.contactShadow}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              currentStage: 'custom',
                              shadow: { ...prev.shadow, contactShadow: e.target.checked },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Ambient Occlusion (AO) */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">环境光遮蔽 (Ambient Occlusion)</span>
                    <p className="text-[10px] text-slate-400">微缝隙自遮挡 · 消除悬浮发飘感</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.ao.enabled}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          currentStage: 'custom',
                          ao: { ...prev.ao, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {state.ao.enabled && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>AO 遮蔽强度 (Intensity)</span>
                        <span className="font-mono text-slate-300">
                          {state.ao.intensity.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={state.ao.intensity}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            ao: { ...prev.ao, intensity: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    {/* AO-Only Inspection Debug Mode */}
                    <button
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          ao: { ...prev.ao, aoOnlyMode: !prev.ao.aoOnlyMode },
                        }))
                      }
                      className={`w-full py-2 px-3 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        state.ao.aoOnlyMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {state.ao.aoOnlyMode && <Check className="w-3.5 h-3.5" />}
                      <span>{state.ao.aoOnlyMode ? '退出 AO 调试视图' : '查看纯 AO 遮挡图层 (Debug)'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Post-Processing, Bloom, Fog & Split Compare */}
          {activeTab === 'post' && (
            <div className="pt-4 grid grid-cols-1 gap-4 text-xs">
              {/* 1. Tone Mapping & Exposure */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">色调映射 (Tone Mapping)</span>
                  <span className="text-[10px] text-blue-400 font-mono">HDR → LDR 压缩</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  将 32 位 HDR 超高动态范围光照压缩至普通屏幕显示范围，抑制金属与高光过曝惨白死白。
                </p>

                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'aces', label: 'ACES', desc: '电影级，高光柔和压暗，暗部保留细节，最接近大片质感' },
                    { id: 'reinhard', label: 'Reinhard', desc: '整体偏亮偏柔，高光不会过曝但暗部偏灰' },
                    { id: 'cineon', label: 'Cineon', desc: '模拟胶片冲洗，对比度低，色彩偏淡偏旧' },
                    { id: 'linear', label: 'Linear', desc: '不做任何处理，亮的地方直接过曝变白' },
                    { id: 'none', label: '关闭', desc: '完全原始输出，无色调压缩' },
                  ].map((tm) => (
                    <button
                      key={tm.id}
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          currentStage: 'custom',
                          post: { ...prev.post, toneMapping: tm.id as ToneMappingType },
                        }))
                      }
                      className={`px-2.5 py-1.5 text-left rounded-lg transition-all border ${
                        state.post.toneMapping === tm.id
                          ? 'bg-blue-600/20 border-blue-500/60 text-white'
                          : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-medium">{tm.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tm.desc}</div>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>全局曝光度 (Exposure)</span>
                    <span className="font-mono text-slate-300">
                      {state.post.exposure.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.5"
                    step="0.05"
                    value={state.post.exposure}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        currentStage: 'custom',
                        post: { ...prev.post, exposure: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                    <span>胶片暗调 0.3</span>
                    <span>电影标准 1.15</span>
                    <span>明亮高曝 2.5</span>
                  </div>
                </div>
              </div>

              {/* 2. Bloom Glow Effect */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">Bloom 泛光辉光 (Glow)</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        state.post.bloom
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {state.post.bloom ? 'ACTIVE 泛光已开启' : 'OFF'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.post.bloom}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          currentStage: 'custom',
                          post: { ...prev.post, bloom: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  模拟电影摄影机镜头的物理光晕溢出，使自发光元件（如音响电平灯、风灯火焰）与强反射金属高光呈现梦幻光芒。
                </p>

                {state.post.bloom ? (
                  <div className="space-y-3 pt-1">
                    {/* Bloom Strength Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>泛光强度 (Strength)</span>
                        <span className="font-mono text-amber-300">
                          {(state.post.bloomStrength ?? 0.45).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="2.5"
                        step="0.05"
                        value={state.post.bloomStrength ?? 0.45}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            post: { ...prev.post, bloomStrength: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Bloom Threshold Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>发光亮度阈值 (Threshold)</span>
                        <span className="font-mono text-slate-300">
                          {(state.post.bloomThreshold ?? 0.85).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={state.post.bloomThreshold ?? 0.85}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            post: { ...prev.post, bloomThreshold: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                        <span>全场景发光 (0.0)</span>
                        <span>仅极亮高光与自发光 (0.85)</span>
                      </div>
                    </div>

                    {/* Bloom Radius Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>扩散模糊半径 (Radius)</span>
                        <span className="font-mono text-slate-300">
                          {(state.post.bloomRadius ?? 0.4).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.5"
                        step="0.05"
                        value={state.post.bloomRadius ?? 0.4}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            currentStage: 'custom',
                            post: { ...prev.post, bloomRadius: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-2.5 px-3 bg-slate-800/40 rounded-lg text-[11px] text-slate-400 border border-dashed border-slate-700/60">
                    💡 提示：开启后，音响 LED 指示灯、风灯蜡烛火焰和金属高光棱角将绽放柔和光学光晕。
                  </div>
                )}
              </div>

              {/* 3. Atmospheric Fog & Depth */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">大气雾效 (Atmospheric Fog)</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        state.fog?.enabled
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {state.fog?.enabled ? 'ACTIVE 雾效已开启' : 'OFF'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.fog?.enabled ?? false}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          currentStage: 'custom',
                          fog: { ...prev.fog, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  模拟真实空气介质漫散射与距离景深层次，烘托沉浸式影棚与电影氛围。
                </p>

                {state.fog?.enabled ? (
                  <div className="space-y-3 pt-1">
                    {/* Fog Type Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">雾散布衰减模型:</span>
                      <div className="flex items-center p-0.5 bg-slate-800 rounded-lg">
                        <button
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              currentStage: 'custom',
                              fog: { ...prev.fog, type: 'exp2' },
                            }))
                          }
                          className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                            (state.fog?.type ?? 'exp2') === 'exp2'
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          指数体积雾 (Exp2)
                        </button>
                        <button
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              currentStage: 'custom',
                              fog: { ...prev.fog, type: 'linear' },
                            }))
                          }
                          className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                            state.fog?.type === 'linear'
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          线性距离雾 (Linear)
                        </button>
                      </div>
                    </div>

                    {/* Fog Color Presets */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span>雾气环境色彩 (Atmosphere Tint)</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-300">
                            {state.fog?.color || '#0a0d14'}
                          </span>
                          <input
                            type="color"
                            value={state.fog?.color || '#0a0d14'}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                fog: { ...prev.fog, color: e.target.value },
                              }))
                            }
                            className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent"
                            title="自定义雾气色彩"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { label: '极夜暗调', color: '#0a0d14' },
                          { label: '赛博深蓝', color: '#08172b' },
                          { label: '暮光暖金', color: '#1a130b' },
                          { label: '影棚冷灰', color: '#161a24' },
                          { label: '纯黑黑匣', color: '#000000' },
                        ].map((item) => (
                          <button
                            key={item.color}
                            onClick={() =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                fog: { ...prev.fog, color: item.color },
                              }))
                            }
                            className={`p-1 text-[10px] rounded border flex items-center justify-center gap-1 transition-all ${
                              (state.fog?.color || '#0a0d14').toLowerCase() === item.color.toLowerCase()
                                ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200'
                                : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exp2 Density or Linear Near/Far */}
                    {(state.fog?.type ?? 'exp2') === 'exp2' ? (
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>雾浓度 (Density)</span>
                          <span className="font-mono text-cyan-300">
                            {((state.fog?.density ?? 0.028) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.005"
                          max="0.075"
                          step="0.002"
                          value={state.fog?.density ?? 0.028}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              currentStage: 'custom',
                              fog: { ...prev.fog, density: parseFloat(e.target.value) },
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                          <span>清澈轻烟 0.5%</span>
                          <span>电影影棚 2.8%</span>
                          <span>深邃浓雾 7.5%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>起始距离 (Near)</span>
                            <span className="font-mono text-slate-300">
                              {(state.fog?.near ?? 5).toFixed(0)}m
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="15"
                            step="0.5"
                            value={state.fog?.near ?? 5}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                fog: { ...prev.fog, near: parseFloat(e.target.value) },
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>完全隐没 (Far)</span>
                            <span className="font-mono text-slate-300">
                              {(state.fog?.far ?? 24).toFixed(0)}m
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="45"
                            step="1"
                            value={state.fog?.far ?? 24}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                currentStage: 'custom',
                                fog: { ...prev.fog, far: parseFloat(e.target.value) },
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 bg-slate-800/40 rounded-lg text-[11px] text-slate-400 border border-dashed border-slate-700/60">
                    💡 提示：开启后物体远离镜头时会自然沉浸入大气色调中，地面与背景边界完全柔化融合。
                  </div>
                )}
              </div>

              {/* 4. A/B Split Comparison Mode */}
              <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">A/B 实时分屏对比</span>
                    <p className="text-[10px] text-slate-400">同屏实时拖拽对比前后渲染差异</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.splitCompare.enabled}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          splitCompare: { ...prev.splitCompare, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {state.splitCompare.enabled && (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-[11px] text-slate-400">选择左侧对照组 (Left Comparison Profile):</div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: 'legacy_phong', label: '传统 Blinn-Phong' },
                        { id: 'unlit', label: '无光照 (Flat Unlit)' },
                        { id: 'no_ao', label: '关闭 AO (无环境遮蔽)' },
                        { id: 'no_ibl', label: '关闭 IBL (无环境光照)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              splitCompare: {
                                ...prev.splitCompare,
                                leftMode: item.id as any,
                              },
                            }))
                          }
                          className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg text-left transition-colors truncate ${
                            state.splitCompare.leftMode === item.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-slate-950/75 backdrop-blur-2xl border border-slate-800/70 rounded-xl shadow-2xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          title="展开渲染控制台"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
