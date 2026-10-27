/**
 * Lumina 3D - Top Bar Component
 * Strict 3-Zone Contract:
 * [Zone 1: Brand Wordmark] - [Zone 2: Navigation Links] - [Zone 3: Primary Action]
 */

import React from 'react';
import { SlidersHorizontal, BookOpen, RotateCcw, Columns2, Box } from 'lucide-react';
import { RenderState } from '../types/rendering';

interface TopBarProps {
  state: RenderState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleSplit: () => void;
  onReset: () => void;
  onOpenExplainer: () => void;
  onOpenResources?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  activeTab,
  setActiveTab,
  onToggleSplit,
  onReset,
  onOpenExplainer,
  onOpenResources,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <SlidersHorizontal className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
            LUMINA 3D
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-normal">
            实时光影与材质渲染实验室
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation / Parameter Category Links */}
      <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800/90">
        {[
          { id: 'stages', label: '渲染演进' },
          { id: 'lighting', label: '光照与IBL' },
          { id: 'material', label: 'PBR 物理材质' },
          { id: 'shadows', label: '阴影与 AO' },
          { id: 'post', label: '色调与分屏' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Online Resources & Models Guide */}
        {onOpenResources && (
          <button
            onClick={onOpenResources}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 rounded-lg border border-emerald-500/30 hover:bg-emerald-900/40 hover:text-white transition-colors whitespace-nowrap shrink-0 shadow-sm"
            title="查看现成开源模型与展台 PBR 资源库，或输入在线 GLB 链接"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">现成模型/底座库</span>
          </button>
        )}

        {/* A/B Split Compare Button */}
        <button
          onClick={onToggleSplit}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shrink-0 ${
            state.splitCompare.enabled
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-sm shadow-blue-500/20'
              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
          title="开启/关闭 A/B 分屏对比模式"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>A/B 对比</span>
        </button>

        {/* Technical Explainer */}
        <button
          onClick={onOpenExplainer}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/90 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
          title="查看渲染技术原理详解"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">技术原理解析</span>
        </button>

        {/* Reset Defaults */}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900/90 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors shrink-0"
          title="重置为默认高画质参数"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
