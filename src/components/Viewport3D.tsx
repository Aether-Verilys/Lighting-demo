/**
 * Lumina 3D - Viewport3D Component
 * Encapsulates the WebGL Canvas, Camera View Angles, Model Switcher,
 * and Draggable A/B Split-Screen Comparison Divider.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Rotate3d,
  ChevronLeft,
  ChevronRight,
  Split,
  Eye,
  Box,
  Upload,
} from 'lucide-react';
import { LuminaRenderingEngine } from '../utils/renderingEngine';
import { RenderState, ModelType } from '../types/rendering';
import { RENDER_STAGES } from '../utils/constants';

interface Viewport3DProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  onSelectStage: (stageIndex: number) => void;
  onAvailableMapsChange?: (maps: Record<string, boolean>) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  state,
  onUpdateState,
  onSelectStage,
  onAvailableMapsChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<LuminaRenderingEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Initialize Rendering Engine once
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new LuminaRenderingEngine(mountRef.current, state);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine when state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.applyState(state);
      // Query available maps after a short delay to allow GLB loading
      const timer = setTimeout(() => {
        if (engineRef.current && onAvailableMapsChange) {
          onAvailableMapsChange(engineRef.current.getAvailableMaps());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, onAvailableMapsChange]);

  // Camera preset handler
  const handleCameraView = (view: 'iso' | 'front' | 'top' | 'rim') => {
    if (engineRef.current) {
      engineRef.current.setCameraView(view);
    }
  };

  // Draggable Split Divider Handlers
  const handleSplitDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  const handleSplitDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDraggingSplit || !mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));

      onUpdateState((prev) => ({
        ...prev,
        splitCompare: {
          ...prev.splitCompare,
          splitPosition: ratio,
        },
      }));
    },
    [isDraggingSplit, onUpdateState]
  );

  const handleSplitDragEnd = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleSplitDrag);
      window.addEventListener('mouseup', handleSplitDragEnd);
      window.addEventListener('touchmove', handleSplitDrag);
      window.addEventListener('touchend', handleSplitDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleSplitDrag);
      window.removeEventListener('mouseup', handleSplitDragEnd);
      window.removeEventListener('touchmove', handleSplitDrag);
      window.removeEventListener('touchend', handleSplitDragEnd);
    };
  }, [isDraggingSplit, handleSplitDrag, handleSplitDragEnd]);

  // Current stage index info
  const currentStageIndex = RENDER_STAGES.findIndex((s) => s.id === state.currentStage);
  const currentStageDef = currentStageIndex >= 0 ? RENDER_STAGES[currentStageIndex] : null;

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Right Floating Controls */}
      <div className="absolute top-4 right-6 z-10 flex flex-col gap-2 items-end">
        {/* Pedestal Toggle */}
        <div className="flex items-center gap-2">
        <button
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              showPedestal: !prev.showPedestal,
            }))
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border backdrop-blur-md transition-colors shadow-xl ${
            state.showPedestal
              ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
              : 'bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-slate-200'
          }`}
          title="显示/隐藏展台底座"
        >
          <Box className="w-3.5 h-3.5" />
          <span>底座</span>
        </button>
        </div>

        {/* Model Selection (vertical list) */}
        <div className="flex flex-col gap-1 p-1.5 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-xl">
          {[
            { id: 'helmet', label: '战损战盔' },
            { id: 'boombox', label: '复古音响' },
            { id: 'camera', label: '复古相机' },
            { id: 'chair', label: '天鹅绒椅' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  model: item.id as ModelType,
                }))
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                state.model === item.id
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Upload GLB */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              setUploadedFileName(file.name);
              onUpdateState((prev) => ({
                ...prev,
                model: 'custom' as ModelType,
                customModelUrl: url,
              }));
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              state.model === 'custom'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="上传本地 GLB 模型（支持 PBR 贴图）"
          >
            <Upload className="w-3 h-3" />
            <span>{state.model === 'custom' && uploadedFileName ? uploadedFileName.replace('.glb', '') : '上传 GLB'}</span>
          </button>
        </div>
      </div>

      {/* Center Top Tour Stage Banner (if a stage is active) */}
      {currentStageDef && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl">
          <button
            onClick={() => {
              const prevIdx = (currentStageIndex - 1 + RENDER_STAGES.length) % RENDER_STAGES.length;
              onSelectStage(prevIdx);
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title="上一个阶段"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-xs font-semibold text-slate-200">{currentStageDef.title}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">{currentStageDef.subtitle}</p>
          </div>

          {currentStageDef.id === 'stage2_direct_lambert' && (
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
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all shrink-0 flex items-center gap-1.5 shadow-md ${
                state.lighting.ambientEnabled
                  ? 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500'
                  : 'bg-rose-950/70 text-rose-300 border-rose-500/60 hover:bg-rose-900/60'
              }`}
              title="一键切换环境光，实时查看背光面是否死黑"
            >
              <span>{state.lighting.ambientEnabled ? '💡 环境光: 开' : '🌑 环境光: 关 (死黑)'}</span>
            </button>
          )}

          <button
            onClick={() => {
              const nextIdx = (currentStageIndex + 1) % RENDER_STAGES.length;
              onSelectStage(nextIdx);
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title="下一个阶段"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AO Debug Active Watermark Indicator */}
      {state.ao.aoOnlyMode && (
        <div className="absolute top-32 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-300 text-xs font-medium backdrop-blur-md">
          <Eye className="w-3.5 h-3.5" />
          <span>正在查看纯环境光遮蔽 (AO) 调试图层</span>
        </div>
      )}

      {/* Interactive A/B Split-Screen Divider */}
      {state.splitCompare.enabled && (
        <div
          className="absolute top-0 bottom-0 z-10 pointer-events-none"
          style={{ left: `${state.splitCompare.splitPosition * 100}%` }}
        >
          {/* Vertical Split Line */}
          <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-gradient-to-b from-blue-500/20 via-blue-400 to-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />

          {/* Draggable Center Button Handle */}
          <div
            onMouseDown={handleSplitDragStart}
            onTouchStart={handleSplitDragStart}
            className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform border-2 border-white/80"
            title="左右拖拽对比渲染效果"
          >
            <Split className="w-4 h-4" />
          </div>

          {/* Floating Left/Right Labels */}
          <div className="absolute top-28 -left-28 -translate-x-full px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300 whitespace-nowrap shadow-lg">
            {state.splitCompare.leftMode === 'unlit' && '对照: 无光照 (Flat)'}
            {state.splitCompare.leftMode === 'legacy_phong' && '对照: 传统 Blinn-Phong'}
            {state.splitCompare.leftMode === 'no_ao' && '对照: 关闭 AO (悬浮发飘)'}
            {state.splitCompare.leftMode === 'hard_shadow' && '对照: 硬边缘锯齿阴影'}
            {state.splitCompare.leftMode === 'no_ibl' && '对照: 关闭 IBL 间接光'}
          </div>

          <div className="absolute top-28 left-6 px-2.5 py-1 rounded-lg bg-blue-950/80 backdrop-blur-md border border-blue-500/30 text-[11px] font-medium text-blue-200 whitespace-nowrap shadow-lg">
            现代物理渲染 (PBR 管线)
          </div>
        </div>
      )}

      {/* Viewport Orbit Helper Text at Bottom-Left */}
      <div className="absolute bottom-6 left-6 z-10 text-[11px] text-slate-500 hidden sm:block pointer-events-none">
        <span>左键拖拽旋转 · 右键平移 · 滚轮缩放</span>
      </div>
    </div>
  );
};
