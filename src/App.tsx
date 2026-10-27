/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Viewport3D } from './components/Viewport3D';
import { BottomDock } from './components/BottomDock';
import { TechExplainerModal } from './components/TechExplainerModal';
import { OnlineResourcesModal } from './components/OnlineResourcesModal';
import { RenderState, PedestalStyle, ModelType } from './types/rendering';
import { DEFAULT_RENDER_STATE, RENDER_STAGES } from './utils/constants';

export default function App() {
  const [state, setState] = useState<RenderState>(DEFAULT_RENDER_STATE);
  const [activeTab, setActiveTab] = useState<string>('stages');
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState<boolean>(false);
  const [availableMaps, setAvailableMaps] = useState<Record<string, boolean>>({
    albedoMap: true, normalMap: true, roughnessMap: true,
    metalnessMap: true, aoMap: true, emissiveMap: true,
  });

  // Switch to a preset stage
  const handleSelectStage = useCallback((stageIndex: number) => {
    const stage = RENDER_STAGES[stageIndex];
    if (!stage) return;

    setState((prev) => ({
      ...prev,
      ...stage.stateConfig,
      currentStage: stage.id,
      lighting: {
        ...prev.lighting,
        ...(stage.stateConfig.lighting || {}),
      },
      pbr: {
        ...prev.pbr,
        ...(stage.stateConfig.pbr || {}),
      },
      shadow: {
        ...prev.shadow,
        ...(stage.stateConfig.shadow || {}),
      },
      ao: {
        ...prev.ao,
        ...(stage.stateConfig.ao || {}),
      },
      post: {
        ...prev.post,
        ...(stage.stateConfig.post || {}),
      },
    }));
  }, []);

  // Toggle A/B split-screen compare
  const handleToggleSplit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      splitCompare: {
        ...prev.splitCompare,
        enabled: !prev.splitCompare.enabled,
      },
    }));
  }, []);

  // Reset to default photoreal state
  const handleReset = useCallback(() => {
    setState({ ...DEFAULT_RENDER_STATE });
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or modal
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key) - 1;
        handleSelectStage(idx);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setState((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
      } else if (e.key.toLowerCase() === 'c') {
        handleToggleSplit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectStage, handleToggleSplit]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0d12]">
      {/* 3D Viewport with WebGL Canvas, Models, Camera & A/B Scissor Split */}
      <Viewport3D
        state={state}
        onUpdateState={setState}
        onSelectStage={handleSelectStage}
        onAvailableMapsChange={setAvailableMaps}
      />

      {/* Consolidated Collapsible Bottom Control Dock */}
      <BottomDock
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onUpdateState={setState}
        onSelectStage={handleSelectStage}
        onOpenResources={() => setIsResourcesOpen(true)}
        availableMaps={availableMaps}
      />

      {/* Deep-Dive Tech Explainer Modal */}
      <TechExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      {/* Online 3D Models & Pedestals Guide & Custom Loader Modal */}
      <OnlineResourcesModal
        isOpen={isResourcesOpen}
        onClose={() => setIsResourcesOpen(false)}
        currentPedestalStyle={state.pedestalStyle}
        onSelectPedestalStyle={(pedestalStyle: PedestalStyle) =>
          setState((prev) => ({ ...prev, pedestalStyle }))
        }
        onLoadCustomModelUrl={(url: string) =>
          setState((prev) => ({
            ...prev,
            model: 'custom',
            customModelUrl: url,
          }))
        }
        onSelectModel={(model: ModelType) =>
          setState((prev) => ({ ...prev, model }))
        }
      />
    </div>
  );
}
