/**
 * Lumina 3D - Tech Explainer Modal
 * Clear, structured explanations of real-time 3D rendering concepts.
 */

import React from 'react';
import { X, Sun, Layers, Sparkles, Eye, ShieldCheck, Film } from 'lucide-react';

interface TechExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechExplainerModal: React.FC<TechExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-100">现代实时渲染核心技术全景解析</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              从简单光照到物理真实感 PBR 渲染管线的五大关键基石
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* 1. Direct vs Indirect Light */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <Sun className="w-4 h-4" />
              <span>01. 直接光 (Direct Light)、基础环境光 (Ambient) 与 间接光 (IBL)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>直接光与环境光漫射</strong>：光线从光源（如太阳、聚光灯）直接射入表面。使用 Lambert 余弦定律计算漫反射时，背光面余弦 ≤ 0 恒为死黑。为此图形学引入<strong>基础环境光 (Ambient Light)</strong>，为全场景注入基准漫射底色，照亮暗部形体细节。
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>间接光 / 图像级光照 (Image-Based Lighting, IBL)</strong>：现实中物体处于全方位丰富环境包围中。IBL 将简单均匀的环境光升级为预计算的 32-bit 浮点环境辐射贴图 (PMREM)，将空间每个角度的真实色彩、漫射与镜面高光映射到物体各处，达到摄影棚级的空间真实感。
            </p>
          </div>

          {/* 2. PBR vs Legacy Shading & Multi-Material Assembly */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Layers className="w-4 h-4" />
              <span>02. PBR 基于物理的着色与多部件真实材质装配</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>为什么单一材质不够，必须不同部位合理分工？</strong> 在真实世界中，光线遇到<strong>导体（金属，如黄铜、钢、铬）</strong>与<strong>绝缘电介质（木材、石材、橡胶）</strong>时遵循完全不同的物理规律：
              <br />· <strong>金属部位 (Conductor)</strong>：自由电子阻止光进入内部，几乎没有漫反射（Albedo 为 0），颜色完全来自于被反射的微表面菲涅尔镜面反射。
              <br />· <strong>木材/石材/橡胶部位 (Dielectric)</strong>：光线折射入微多孔内部多次乱反射后射出（漫反射），垂直表面时仅有约 4% 的基础镜面反射，掠射角边缘才有强菲涅尔。
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>传统着色 vs 现代 PBR 的真实对比</strong>：
              传统经验模型（Phong）对木材和金属套用同一个公式，金属失真严重变成“黄色塑料”，木材则带有虚假高光白斑；而在现代 PBR 装配中，同一盏光源照耀下，木头自然漫射、黄铜环境泛光、镜面球倒映棚拍、橡胶吸收暗光，材质各司其职，产生电影级的写实质感！
            </p>
          </div>

          {/* 3. Ambient Occlusion */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Eye className="w-4 h-4" />
              <span>03. 环境光遮蔽 (Ambient Occlusion, AO)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>消除“发飘漂浮感”</strong>：在几何体的深缝、凹槽、转角和接触面处，间接环境光被周围结构阻挡而难以射入。AO 在这些微小缝隙处生成柔和的接触暗部阴影，赋予模型分量感与结构深度。
            </p>
          </div>

          {/* 4. Shadow Softening */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>04. 阴影柔化算法 (PCF Soft Shadows)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>从阶梯锯齿到自然半影</strong>：标准深度阴影图 (Basic Shadow Map) 只采样单一深度值，边缘充满几何像素走样。<strong>PCF (Percentage-Closer Filtering)</strong> 在采样点周围的多邻域内多次滤波，模拟物理世界中面光源产生的“本影 (Umbra)”与“半影 (Penumbra)”的连续柔和过渡。
            </p>
          </div>

          {/* 5. Tone Mapping */}
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <Film className="w-4 h-4" />
              <span>05. 色调映射 (ACES Filmic Tone Mapping)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>胶片级高光压缩</strong>：PBR 计算出的光照值可以远超 1.0（HDR 高动态范围）。如果没有色调映射，高光区域会直接“被截断”，变成难看的惨白死白。<strong>ACES Filmic</strong> 模拟奥斯卡电影学院标准的胶片感光曲线，优雅平滑地把极端强光压缩至显示器的 RGB 范围，保留丰富的高光层次。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            知道了，返回实验
          </button>
        </div>
      </div>
    </div>
  );
};
