/**
 * Lumina 3D - Online Models & Pedestals Guide Modal
 * Comprehensive resource guide for high-fidelity 3D models, pedestals, and PBR assets,
 * plus a custom online GLB/GLTF model loader.
 */

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Box,
  Layers,
  Sparkles,
  Link2,
  Check,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';
import { ONLINE_PBR_RESOURCES, PEDESTAL_PRESETS } from '../utils/constants';
import { PedestalStyle, ModelType } from '../types/rendering';

interface OnlineResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPedestalStyle: PedestalStyle;
  onSelectPedestalStyle: (style: PedestalStyle) => void;
  onLoadCustomModelUrl: (url: string) => void;
  onSelectModel: (model: ModelType) => void;
}

export const OnlineResourcesModal: React.FC<OnlineResourcesModalProps> = ({
  isOpen,
  onClose,
  currentPedestalStyle,
  onSelectPedestalStyle,
  onLoadCustomModelUrl,
  onSelectModel,
}) => {
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickSamples = [
    {
      name: '复古测距相机 (Antique Camera)',
      category: 'Khronos 官方 2K PBR',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
      id: 'camera',
    },
    {
      name: '天鹅绒奢华扶手椅 (Sheen Chair)',
      category: '次表面绒面微光泽 PBR',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
      id: 'chair',
    },
    {
      name: '战损头盔 (Damaged Helmet)',
      category: '行业测试黄金标杆 2K PBR',
      url: '/models/DamagedHelmet.glb',
      id: 'helmet',
    },
    {
      name: '复古收音机 (BoomBox)',
      category: '硬质木材与网格金属 PBR',
      url: '/models/BoomBox.glb',
      id: 'boombox',
    },
  ];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleLoadCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    onLoadCustomModelUrl(customInputUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                网上现成高精模型与底座资源指南 · 自定义 GLB 导入
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                业界权威开源 PBR 资产库推荐 · 5 种高保真微倒角展台预设 · 任意在线模型一键加载
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 custom-scrollbar">
          {/* Section 1: Custom Online Model Loader */}
          <div className="p-4 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/30 border border-blue-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <Link2 className="w-4 h-4" />
                <span>在线自定义 GLB / GLTF 模型链接直接载入</span>
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono">
                自动居中与底座自适应
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              输入任意公开的 <code className="text-blue-300 font-mono text-[11px]">.glb</code> 或{' '}
              <code className="text-blue-300 font-mono text-[11px]">.gltf</code>{' '}
              模型直链（如来自 GitHub Raw、Poly Haven 或个人的静态服务器），引擎将自动加载并放置于当前大师级展台上进行实时 PBR 渲染与 A/B 分屏对比：
            </p>

            <form onSubmit={handleLoadCustom} className="flex gap-2">
              <input
                type="url"
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                placeholder="https://example.com/models/my_pedestal_or_hero.glb"
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors whitespace-nowrap shadow-sm"
              >
                加载到视口
              </button>
            </form>

            {/* Quick Online Presets */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                或一键加载以下开源标杆在线模型：
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickSamples.map((sample) => (
                  <div
                    key={sample.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200">{sample.name}</div>
                      <div className="text-[10px] text-slate-400">{sample.category}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectModel(sample.id as ModelType);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded border border-blue-500/40 transition-colors flex items-center gap-1"
                      >
                        <span>载入视口</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Upgraded Pedestal Styles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <Layers className="w-4 h-4" />
                <span>内置升级版 · 5 种高精度微表面 PBR 展台底座</span>
              </div>
              <span className="text-[10px] text-slate-400">
                当前底座已由简单圆柱升级为 8 层微倒角工业/画廊结构
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PEDESTAL_PRESETS.map((p) => {
                const isActive = currentPedestalStyle === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPedestalStyle(p.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-950/60 border-blue-500/80 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-200">{p.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          isActive
                            ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      {p.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Authoritative Online 3D Model & Pedestal Sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Globe className="w-4 h-4" />
              <span>网上有哪些现成的免费高质量 3D 模型与展台资源？</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              针对您的疑问，以下是全球 3D 渲染与工业图形学界公认最高质量、提供完整 PBR 贴图（Albedo、Normal、Roughness、Metalness、AO）且<strong>可免费商用/开源下载</strong>的 5 大顶级现成资源网站：
            </p>

            <div className="space-y-3">
              {ONLINE_PBR_RESOURCES.map((res) => (
                <div
                  key={res.name}
                  className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{res.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {res.category}
                        </span>
                      </div>
                    </div>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/30 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      <span>访问官方资源库</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {res.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {res.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>提示：下载的 .glb 模型可通过上方链接导入或放于 public/models/ 目录直接调用</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            返回视口体验
          </button>
        </div>
      </div>
    </div>
  );
};
