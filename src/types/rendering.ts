/**
 * Lumina 3D - Types & Interfaces for Realtime Rendering Pipeline
 */

export type ModelType =
  | 'helmet'
  | 'boombox'
  | 'camera'
  | 'chair'
  | 'gear'
  | 'shaderball'
  | 'column'
  | 'custom';

export type PedestalStyle = 'obsidianGold';

export type MaterialPresetId =
  | 'carPaint'
  | 'brushedGold'
  | 'chrome'
  | 'granite'
  | 'ceramic'
  | 'frostedGlass'
  | 'carbonFiber';

export type ShadowType = 'none' | 'hard' | 'pcf' | 'pcfsoft';

export type ToneMappingType = 'aces' | 'reinhard' | 'cineon' | 'linear' | 'none';

export type EnvPresetId = 'ferndale_studio' | 'monochrome_studio' | 'sunset' | 'industrial' | 'night';

export type MaterialRole =
  | 'wood'
  | 'brass'
  | 'chrome'
  | 'dark_steel'
  | 'marble'
  | 'rubber'
  | 'glass'
  | 'car_paint'
  | 'gold_trim';

export interface PartMaterialInfo {
  id: string;
  name: string;
  nameEn: string;
  role: MaterialRole;
  description: string;
  metalness: number;
  roughness: number;
  color: string;
}

export type RenderStageId =
  | 'stage1_unlit'
  | 'stage2_direct_lambert'
  | 'stage3_phong_hardshadow'
  | 'stage4_pbr_direct'
  | 'stage5_pbr_ibl'
  | 'stage6_ao_added'
  | 'stage7_soft_shadows'
  | 'stage8_cinematic_full';

export interface LightingConfig {
  directEnabled: boolean;
  directIntensity: number;
  directColor: string;
  directElevation: number; // 10 - 85 degrees
  directAzimuth: number; // 0 - 360 degrees
  ambientEnabled: boolean; // 基础环境光 (Ambient Light)
  ambientIntensity: number; // 0.0 - 1.5
  ambientColor?: string; // 环境光颜色
  fillEnabled: boolean;
  fillIntensity: number;
  rimEnabled: boolean;
  rimIntensity: number;
  iblEnabled: boolean;
  iblIntensity: number;
  iblPreset: EnvPresetId;
  showSkybox: boolean; // Show 360 HDR panorama skybox
  skyboxBlur: number; // Background blurriness 0.0 to 1.0
  skyboxIntensity: number; // Background brightness 0.1 to 2.0
}

export interface PbrMapsConfig {
  albedoMap: boolean; // 基础色彩/固有色贴图 (Base Color / Albedo)
  normalMap: boolean; // 法线微凹凸细节贴图 (Tangent Space Normal)
  roughnessMap: boolean; // 粗糙度光泽差异贴图 (Roughness Map)
  metalnessMap: boolean; // 金属度导体遮罩贴图 (Metalness Map)
  aoMap: boolean; // 环境光遮蔽暗部微阴影贴图 (Ambient Occlusion Map)
  emissiveMap: boolean; // 自发光指示灯发光贴图 (Emissive Glow Map)
}

export interface PbrConfig {
  pbrEnabled: boolean; // true = MeshPhysicalMaterial, false = MeshPhongMaterial / MeshLambertMaterial
  legacyShadingModel: 'phong' | 'lambert' | 'basic';
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  color: string;
  wireframe: boolean;
  maps?: PbrMapsConfig;
}

export interface ShadowConfig {
  mode: ShadowType;
  resolution: number; // 512, 1024, 2048
  bias: number;
  radius: number; // shadow penumbra softness
  contactShadow: boolean;
  contactOpacity: number;
}

export interface AoConfig {
  enabled: boolean;
  intensity: number;
  aoOnlyMode: boolean; // Visual debug: inspect pure AO occlusion in crevices
}

export interface PostConfig {
  toneMapping: ToneMappingType;
  exposure: number;
  bloom: boolean;
  bloomStrength: number;
  bloomRadius?: number;
  bloomThreshold?: number;
}

export type FogType = 'exp2' | 'linear';

export interface FogConfig {
  enabled: boolean;
  type: FogType;
  color: string;
  density: number; // For FogExp2: 0.005 - 0.08
  near: number; // For Linear Fog: 1 - 20
  far: number; // For Linear Fog: 15 - 50
}

export interface SplitCompareConfig {
  enabled: boolean;
  splitPosition: number; // 0.0 to 1.0 (50% default)
  leftMode: 'unlit' | 'legacy_phong' | 'no_ao' | 'hard_shadow' | 'no_ibl';
}

export interface RenderState {
  currentStage: RenderStageId | 'custom';
  model: ModelType;
  customModelUrl?: string;
  pedestalStyle: PedestalStyle;
  materialMode: 'assembly' | 'single'; // Assembly = multi-material physical assignment; single = uniform calibration
  materialPreset: MaterialPresetId | 'custom';
  lighting: LightingConfig;
  pbr: PbrConfig;
  shadow: ShadowConfig;
  ao: AoConfig;
  post: PostConfig;
  fog: FogConfig;
  splitCompare: SplitCompareConfig;
  showPedestal: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
}

export interface StageDefinition {
  id: RenderStageId;
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  keyFeature: string;
  stateConfig: Partial<RenderState>;
}
