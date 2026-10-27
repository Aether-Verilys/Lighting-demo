/**
 * Lumina 3D - High Performance Realtime Rendering Engine
 * Implements full WebGL pipeline: Multi-Material Physical Assembly, Direct Light,
 * IBL, PBR Physical Shading, Ambient Occlusion, PCF Soft Shadows, Tone Mapping,
 * and GPU Scissor Split-Screen
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  RenderState,
  ModelType,
  MaterialRole,
  PedestalStyle,
} from '../types/rendering';
import {
  generateProceduralAoTexture,
  generateProceduralNormalTexture,
  generateProceduralEnvironmentTexture,
  generateContactShadowTexture,
  generateProceduralWoodTexture,
  generateProceduralMarbleTexture,
  generatePedestalAlbedoTexture,
  generatePedestalNormalTexture,
  generatePedestalRoughnessTexture,
  generatePedestalMetallicTexture,
  generatePedestalAoTexture,
} from './proceduralTextures';
import {
  createShaderBall,
  createClassicalColumn,
  createMechanicalTurbine,
  createCyberneticDrone,
  createHelmetMuseumStand,
  ProceduralModelBundle,
  MaterialsPalette,
  ModelPartRecord,
  PedestalTextures,
} from './proceduralModels';

export class LuminaRenderingEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  // Lights
  private keyDirectionalLight: THREE.DirectionalLight;
  private fillHemiLight: THREE.HemisphereLight;
  private rimSpotLight: THREE.SpotLight;
  private ambientLight: THREE.AmbientLight;

  // Ground and Contact Shadows
  private groundPlane: THREE.Mesh;
  private contactShadowMesh: THREE.Mesh;
  private contactShadowMat: THREE.MeshBasicMaterial;

  // Environment and IBL
  private pmremGenerator: THREE.PMREMGenerator;
  private currentEnvTexture: THREE.Texture | null = null;
  private roomEnvTexture: THREE.Texture | null = null;
  private rgbeLoader = new RGBELoader();
  private hdrTextureCache = new Map<string, THREE.Texture>();

  // Procedural Textures Cache
  private aoTexture: THREE.CanvasTexture;
  private normalTexture: THREE.CanvasTexture;
  private contactTexture: THREE.CanvasTexture;
  private woodTexture: THREE.CanvasTexture;
  private marbleTexture: THREE.CanvasTexture;

  // Active Model and Materials Palette
  private currentModelBundle: ProceduralModelBundle | null = null;
  private currentPalette!: MaterialsPalette;
  private leftPalette: MaterialsPalette | null = null; // For A/B Scissor Split

  // Open-Source GLB PBR Model Cache (DamagedHelmet, BoomBox, Lantern)
  private gltfLoader = new GLTFLoader();
  private glbModelGroups: Map<string, THREE.Group> = new Map();
  private glbMeshLists: Map<string, THREE.Mesh[]> = new Map();
  private glbMaterialsMaps: Map<string, Map<THREE.Mesh, THREE.MeshStandardMaterial>> = new Map();
  private activeGlbMeshes: THREE.Mesh[] = [];
  private activeGlbMaterials: Map<THREE.Mesh, THREE.MeshStandardMaterial> = new Map();
  private loadingGlbSet = new Set<string>();
  private pedestalTexturesCache = new Map<PedestalStyle, PedestalTextures>();

  // Post-Processing Pipeline
  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private outputPass: OutputPass | null = null;

  // State
  private state: RenderState;
  private isSoftwareGl: boolean;
  private isDisposed = false;
  private animationFrameId = 0;
  private clock = new THREE.Clock();

  constructor(container: HTMLElement, initialState: RenderState) {
    this.container = container;
    this.state = initialState;

    // 1. Detect software WebGL guard
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    // In modern Three.js, PCFShadowMap with light.shadow.radius is the official soft shadow implementation
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0d12);
    this.scene.fog = new THREE.Fog(0x0c0d12, 12, 35);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(4.2, 3.2, 5.2);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 14.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
    this.controls.target.set(0, 1.4, 0);
    this.controls.update();

    // 5. Pre-generate procedural textures
    this.aoTexture = generateProceduralAoTexture(512, 512);
    this.normalTexture = generateProceduralNormalTexture('brushed', 512, 512);
    this.contactTexture = generateContactShadowTexture(512);
    this.woodTexture = generateProceduralWoodTexture(512, 512);
    this.marbleTexture = generateProceduralMarbleTexture(512, 512);

    // 6. PMREM Generator for HDR Environment Maps
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.roomEnvTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 7. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.0);
    this.scene.add(this.ambientLight);

    this.fillHemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.4);
    this.fillHemiLight.position.set(0, 10, 0);
    this.scene.add(this.fillHemiLight);

    this.keyDirectionalLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    this.keyDirectionalLight.castShadow = true;
    this.keyDirectionalLight.shadow.mapSize.width = 2048;
    this.keyDirectionalLight.shadow.mapSize.height = 2048;
    this.keyDirectionalLight.shadow.camera.near = 0.5;
    this.keyDirectionalLight.shadow.camera.far = 25;
    this.keyDirectionalLight.shadow.camera.left = -3.2;
    this.keyDirectionalLight.shadow.camera.right = 3.2;
    this.keyDirectionalLight.shadow.camera.top = 3.2;
    this.keyDirectionalLight.shadow.camera.bottom = -3.2;
    this.keyDirectionalLight.shadow.bias = -0.0005;
    this.keyDirectionalLight.shadow.normalBias = 0.02;
    this.keyDirectionalLight.shadow.radius = 4.0;
    this.scene.add(this.keyDirectionalLight);

    this.rimSpotLight = new THREE.SpotLight(0xa5f3fc, 1.0, 18, Math.PI / 4, 0.5, 1);
    this.rimSpotLight.position.set(-4.5, 4.0, -4.0);
    this.rimSpotLight.target.position.set(0, 1.4, 0);
    this.scene.add(this.rimSpotLight);
    this.scene.add(this.rimSpotLight.target);

    // 8. Ground Studio Platform & Floor Grid
    const groundGeom = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x12141c,
      roughness: 0.85,
      metalness: 0.1,
    });
    this.groundPlane = new THREE.Mesh(groundGeom, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.005;
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // Soft Contact Shadow Plane directly grounded under the object
    const contactGeom = new THREE.PlaneGeometry(4.8, 4.8);
    this.contactShadowMat = new THREE.MeshBasicMaterial({
      map: this.contactTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    this.contactShadowMesh = new THREE.Mesh(contactGeom, this.contactShadowMat);
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.y = 0.008;
    this.scene.add(this.contactShadowMesh);

    // 8.5 Post-Processing Pipeline (Bloom & Cinematic Output Tone Mapping)
    try {
      this.composer = new EffectComposer(this.renderer);
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      const bloomRes = new THREE.Vector2(container.clientWidth, container.clientHeight);
      this.bloomPass = new UnrealBloomPass(
        bloomRes,
        this.state.post.bloomStrength ?? 0.45,
        this.state.post.bloomRadius ?? 0.4,
        this.state.post.bloomThreshold ?? 0.85
      );
      this.bloomPass.enabled = this.state.post.bloom;
      this.composer.addPass(this.bloomPass);

      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);
    } catch (err) {
      console.warn('[PostProcessing] Failed to initialize EffectComposer:', err);
    }

    // 9. Initial Material Palette & Model
    this.currentPalette = this.buildMaterialsPalette(this.state, !this.state.pbr.pbrEnabled);
    this.loadModel(this.state.model);

    // 10. Apply all initial configurations
    this.applyState(this.state);

    // 11. Handle window resize
    window.addEventListener('resize', this.onResize);

    // 12. Start animation loop
    this.startLoop();
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  };

  /**
   * Builds the MaterialsPalette for each role
   * When PBR is ON: High-fidelity physical materials (wood, brass, chrome, marble, rubber, glass, etc.)
   * When PBR is OFF: Traditional Blinn-Phong / Lambert materials (showing how metals turn into yellow plastic and wood looks shiny)
   */
  private buildMaterialsPalette(
    state: RenderState,
    isLegacy: boolean,
    forceLegacyMode?: 'unlit' | 'phong' | 'no_ao' | 'hard_shadow' | 'no_ibl'
  ): MaterialsPalette {
    const { pbr, lighting, ao } = state;
    const maps = pbr.maps || {
      albedoMap: true,
      normalMap: true,
      roughnessMap: true,
      metalnessMap: true,
      aoMap: true,
      emissiveMap: true,
    };
    const isNoAo = forceLegacyMode === 'no_ao' || !ao.enabled || !maps.aoMap;
    const isNoIbl = forceLegacyMode === 'no_ibl' || !lighting.iblEnabled;
    const envIntensity = isNoIbl ? 0 : lighting.iblIntensity;
    const aoMap = isNoAo ? null : this.aoTexture;
    const aoIntensity = isNoAo ? 0 : ao.intensity;
    const woodTex = maps.albedoMap ? this.woodTexture : null;
    const marbleTex = maps.albedoMap ? this.marbleTexture : null;
    const normTex = maps.normalMap ? this.normalTexture : null;

    // AO debug mode: pure white diffuse highlighting purely the crevice ambient occlusion
    if (ao.aoOnlyMode && !forceLegacyMode) {
      const debugMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        aoMap: this.aoTexture,
        aoMapIntensity: ao.intensity * 2.5,
        wireframe: pbr.wireframe,
      });
      return {
        wood: debugMat,
        brass: debugMat,
        chrome: debugMat,
        dark_steel: debugMat,
        marble: debugMat,
        rubber: debugMat,
        glass: debugMat,
        car_paint: debugMat,
        gold_trim: debugMat,
      };
    }

    if (forceLegacyMode === 'unlit') {
      const makeUnlit = (col: number | string) =>
        new THREE.MeshBasicMaterial({ color: new THREE.Color(col), wireframe: pbr.wireframe });
      return {
        wood: makeUnlit('#542308'),
        brass: makeUnlit('#d4af37'),
        chrome: makeUnlit('#e2e8f0'),
        dark_steel: makeUnlit('#334155'),
        marble: makeUnlit('#f8fafc'),
        rubber: makeUnlit('#18181b'),
        glass: makeUnlit('#e0f2fe'),
        car_paint: makeUnlit(pbr.color),
        gold_trim: makeUnlit('#eab308'),
      };
    }

    if (isLegacy || forceLegacyMode === 'phong') {
      // Legacy Non-PBR Blinn-Phong
      // Notice: In legacy shading, metals have no environment reflection and look like yellow plastic!
      const makePhong = (color: string | number, shininess: number, spec = 0x555555) =>
        new THREE.MeshPhongMaterial({
          color: new THREE.Color(color),
          specular: new THREE.Color(spec),
          shininess,
          wireframe: pbr.wireframe,
        });

      return {
        wood: makePhong('#542308', 25, 0x444444),
        brass: makePhong('#d4af37', 50, 0x888888), // Plastic-looking yellow highlight
        chrome: makePhong('#ffffff', 90, 0xffffff),
        dark_steel: makePhong('#334155', 40, 0x666666),
        marble: makePhong('#f8fafc', 35, 0x555555),
        rubber: makePhong('#18181b', 10, 0x333333),
        glass: makePhong('#e0f2fe', 80, 0xffffff),
        car_paint: makePhong(pbr.color, 60, 0x777777),
        gold_trim: makePhong('#eab308', 70, 0x999999),
      };
    }

    // Modern PBR MeshPhysicalMaterial with designated physical parameters
    return {
      // 1. Wood (Walnut / Mahogany): Organic dielectric, wood grain map, high roughness, 0% metalness
      wood: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(woodTex ? '#6b300f' : '#cccccc'),
        map: woodTex,
        roughness: 0.62,
        metalness: 0.0,
        aoMap,
        aoMapIntensity: aoIntensity * 1.1,
        envMapIntensity: envIntensity * 0.4,
        wireframe: pbr.wireframe,
      }),

      // 2. Brass: Conductor metal, warm golden Fresnel, high metalness
      brass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#d4af37'),
        roughness: 0.20,
        metalness: 0.95,
        clearcoat: 0.1,
        clearcoatRoughness: 0.1,
        normalMap: normTex,
        normalScale: new THREE.Vector2(0.25, 0.25),
        aoMap,
        aoMapIntensity: aoIntensity,
        envMapIntensity: envIntensity * 1.1,
        wireframe: pbr.wireframe,
      }),

      // 3. Mirror Chrome: Pure specular conductor, 100% metalness, zero diffuse
      chrome: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.04,
        metalness: 1.0,
        envMapIntensity: envIntensity * 1.35,
        aoMap,
        aoMapIntensity: aoIntensity,
        wireframe: pbr.wireframe,
      }),

      // 4. Dark Steel: Heavy machine steel
      dark_steel: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#334155'),
        roughness: 0.35,
        metalness: 0.88,
        normalMap: normTex,
        normalScale: new THREE.Vector2(0.3, 0.3),
        aoMap,
        aoMapIntensity: aoIntensity,
        envMapIntensity: envIntensity,
        wireframe: pbr.wireframe,
      }),

      // 5. Marble: Carrara White Marble with delicate veins
      marble: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(marbleTex ? '#f8fafc' : '#cccccc'),
        map: marbleTex,
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        aoMap,
        aoMapIntensity: aoIntensity * 1.25,
        envMapIntensity: envIntensity * 0.7,
        wireframe: pbr.wireframe,
      }),

      // 6. Rubber: Matte vulcanized porous rubber
      rubber: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#18181b'),
        roughness: 0.88,
        metalness: 0.0,
        aoMap,
        aoMapIntensity: aoIntensity,
        envMapIntensity: envIntensity * 0.2,
        wireframe: pbr.wireframe,
      }),

      // 7. Optical Glass: Dielectric transmission & clearcoat
      glass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#e0f2fe'),
        roughness: 0.05,
        metalness: 0.05,
        transmission: 0.85,
        ior: 1.5,
        thickness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: envIntensity * 1.2,
        wireframe: pbr.wireframe,
      }),

      // 8. Car Paint (Hero Part): Configurable by user sliders!
      car_paint: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(pbr.color),
        roughness: pbr.roughness,
        metalness: pbr.metalness,
        clearcoat: pbr.clearcoat,
        clearcoatRoughness: pbr.clearcoatRoughness,
        normalMap: normTex,
        normalScale: new THREE.Vector2(0.2, 0.2),
        aoMap,
        aoMapIntensity: aoIntensity,
        envMapIntensity: envIntensity,
        wireframe: pbr.wireframe,
      }),

      // 9. 24K Gold Trim: Luxury accent
      gold_trim: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#eab308'),
        roughness: 0.14,
        metalness: 0.98,
        envMapIntensity: envIntensity * 1.25,
        aoMap,
        aoMapIntensity: aoIntensity,
        wireframe: pbr.wireframe,
      }),
    };
  }

  /**
   * Lazily generates and caches high-resolution 1024x1024 PBR textures for the selected pedestal style
   */
  public getPedestalTextures(style: PedestalStyle): PedestalTextures {
    if (!this.pedestalTexturesCache.has(style)) {
      const albedo = generatePedestalAlbedoTexture(style, 1024, 1024);
      const normal = generatePedestalNormalTexture(style, 1024, 1024);
      const roughness = generatePedestalRoughnessTexture(style, 1024, 1024);
      const metallic = generatePedestalMetallicTexture(style, 1024, 1024);
      const ao = generatePedestalAoTexture(1024, 1024);

      const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
      albedo.anisotropy = maxAniso;
      normal.anisotropy = maxAniso;
      roughness.anisotropy = maxAniso;
      metallic.anisotropy = maxAniso;
      ao.anisotropy = maxAniso;

      this.pedestalTexturesCache.set(style, { albedo, normal, roughness, metallic, ao });
    }
    return this.pedestalTexturesCache.get(style)!;
  }

  /**
   * Loads the selected procedural 3D model with realistic pedestal and optional online GLTF assets
   */
  public loadModel(
    modelType: ModelType,
    pedestalStyle: PedestalStyle = this.state.pedestalStyle || 'obsidianGold',
    customUrl?: string
  ) {
    if (this.currentModelBundle) {
      this.scene.remove(this.currentModelBundle.group);
      this.disposeObject(this.currentModelBundle.group);
      this.currentModelBundle = null;
    }

    const pTextures = this.getPedestalTextures(pedestalStyle);

    let bundle: ProceduralModelBundle;
    switch (modelType) {
      case 'boombox':
      case 'gear':
        bundle = createHelmetMuseumStand(this.currentPalette, pedestalStyle, pTextures);
        this.attachGlbToBundle('boombox', '/models/BoomBox.glb', bundle, {
          scale: 75,
          y: 0.72,
          rotY: 0,
        });
        break;
      case 'camera':
        bundle = createHelmetMuseumStand(this.currentPalette, pedestalStyle, pTextures);
        this.attachGlbToBundle(
          'camera',
          'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
          bundle,
          { scale: 0.35, y: 1.35, rotY: 0 }
        );
        break;
      case 'chair':
        bundle = createHelmetMuseumStand(this.currentPalette, pedestalStyle, pTextures);
        this.attachGlbToBundle(
          'chair',
          'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
          bundle,
          { scale: 3.5, y: 0.72, rotY: 0 }
        );
        break;
      case 'custom':
        bundle = createHelmetMuseumStand(this.currentPalette, pedestalStyle, pTextures);
        if (customUrl) {
          this.attachGlbToBundle('custom_' + customUrl, customUrl, bundle, {
            scale: 1.0,
            y: 1.35,
            rotY: 0,
          });
        }
        break;
      case 'shaderball':
        this.activeGlbMeshes = [];
        this.activeGlbMaterials.clear();
        bundle = createShaderBall(this.currentPalette);
        break;
      case 'column':
        this.activeGlbMeshes = [];
        this.activeGlbMaterials.clear();
        bundle = createClassicalColumn(this.currentPalette);
        break;
      case 'helmet':
      default:
        bundle = createHelmetMuseumStand(this.currentPalette, pedestalStyle, pTextures);
        this.attachGlbToBundle('helmet', '/models/DamagedHelmet.glb', bundle, {
          scale: 1.4,
          y: 1.72,
          rotY: Math.PI,
        });
        break;
    }

    this.currentModelBundle = bundle;
    this.scene.add(bundle.group);

    // Center camera orbit target
    const targetY = 1.45;
    this.controls.target.set(0, targetY, 0);
    this.rimSpotLight.target.position.set(0, targetY, 0);

    // Apply materials based on mode
    this.applyMaterialsToModel(this.currentPalette);
  }

  /**
   * Attaches loaded GLTF models (DamagedHelmet, BoomBox, Lantern, Online models) to the museum pedestal
   */
  private attachGlbToBundle(
    key: string,
    url: string,
    bundle: ProceduralModelBundle,
    transform: { scale: number; y: number; rotY: number }
  ) {
    if (this.glbModelGroups.has(key)) {
      const model = this.glbModelGroups.get(key)!;
      bundle.group.add(model);
      const meshes = this.glbMeshLists.get(key) || [];
      this.activeGlbMeshes = meshes;
      this.activeGlbMaterials = this.glbMaterialsMaps.get(key) || new Map();
      for (const mesh of meshes) {
        bundle.heroMeshes.push(mesh);
      }
      this.applyMaterialsToGlb(this.currentPalette);
      return;
    }

    if (this.loadingGlbSet.has(key)) return;
    this.loadingGlbSet.add(key);

    this.gltfLoader.load(
      url,
      (gltf) => {
        this.loadingGlbSet.delete(key);
        const model = gltf.scene;
        model.name = key;
        model.scale.set(transform.scale, transform.scale, transform.scale);
        model.position.set(0, transform.y, 0);
        model.rotation.y = transform.rotY;

        // Auto-normalize scale and center for custom models
        if (key.startsWith('custom_')) {
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const targetScale = 2.2 / maxDim;
            model.scale.set(targetScale, targetScale, targetScale);
            box.setFromObject(model);
            model.position.y += 1.3 - box.min.y;
          }
        }

        const meshList: THREE.Mesh[] = [];
        const matMap = new Map<THREE.Mesh, THREE.MeshStandardMaterial>();

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            meshList.push(child);
            if (child.material instanceof THREE.MeshStandardMaterial) {
              matMap.set(child, child.material.clone());
            }
          }
        });

        this.glbModelGroups.set(key, model);
        this.glbMeshLists.set(key, meshList);
        this.glbMaterialsMaps.set(key, matMap);

        const currentActiveKey =
          this.state.model === 'gear' ? 'boombox' : this.state.model;
        const isMatch =
          currentActiveKey === key ||
          (this.state.model === 'custom' && key.startsWith('custom_'));

        if (isMatch && this.currentModelBundle) {
          this.currentModelBundle.group.add(model);
          this.activeGlbMeshes = meshList;
          this.activeGlbMaterials = matMap;
          for (const mesh of meshList) {
            this.currentModelBundle.heroMeshes.push(mesh);
          }
          this.applyMaterialsToGlb(this.currentPalette);
        }
      },
      undefined,
      (err) => {
        this.loadingGlbSet.delete(key);
        console.warn(`Failed to load ${url}`, err);
      }
    );
  }

  /**
   * Reports which PBR map channels actually exist in the currently loaded GLB model.
   * Returns a record of map key → boolean. For procedural models (no GLB), all maps are true.
   */
  public getAvailableMaps(): Record<string, boolean> {
    const result = {
      albedoMap: true,
      normalMap: true,
      roughnessMap: true,
      metalnessMap: true,
      aoMap: true,
      emissiveMap: true,
    };

    if (this.activeGlbMeshes.length === 0) return result;

    // Scan all original GLB materials; a map is "available" if ANY mesh has it
    const found = { albedoMap: false, normalMap: false, roughnessMap: false, metalnessMap: false, aoMap: false, emissiveMap: false };
    for (const mesh of this.activeGlbMeshes) {
      const mat = this.activeGlbMaterials.get(mesh);
      if (!mat) continue;
      if (mat.map) found.albedoMap = true;
      if (mat.normalMap) found.normalMap = true;
      if (mat.roughnessMap) found.roughnessMap = true;
      if (mat.metalnessMap) found.metalnessMap = true;
      if (mat.aoMap) found.aoMap = true;
      if (mat.emissiveMap) found.emissiveMap = true;
    }
    return found;
  }

  /**
   * Updates active GLB mesh materials based on PBR, IBL, AO, or Legacy modes & individual PBR maps
   */
  private applyMaterialsToGlb(
    _palette: MaterialsPalette,
    forceLegacy?: 'unlit' | 'phong' | 'no_ao' | 'hard_shadow' | 'no_ibl'
  ) {
    if (this.activeGlbMeshes.length === 0) return;

    const { pbr, ao, lighting } = this.state;
    const isPbr = !forceLegacy && pbr.pbrEnabled;
    const isNoAo = forceLegacy === 'no_ao' || !ao.enabled;
    const isNoIbl = forceLegacy === 'no_ibl' || !lighting.iblEnabled;

    for (const mesh of this.activeGlbMeshes) {
      const origMat = this.activeGlbMaterials.get(mesh);
      if (!origMat) continue;

      if (ao.aoOnlyMode && !forceLegacy) {
        // Pure AO Debug Mode: Display the baked occlusion map
        mesh.material = new THREE.MeshBasicMaterial({
          map: origMat.aoMap || origMat.map,
          color: 0xffffff,
          wireframe: pbr.wireframe,
        });
        continue;
      }

      if (forceLegacy === 'unlit') {
        mesh.material = new THREE.MeshBasicMaterial({
          map: origMat.map,
          wireframe: pbr.wireframe,
        });
        continue;
      }

      if (!isPbr || forceLegacy === 'phong') {
        // Legacy Non-PBR Blinn-Phong: Strip metallic-roughness and IBL reflections
        const maps = pbr.maps || {
          albedoMap: true,
          normalMap: true,
          roughnessMap: true,
          metalnessMap: true,
          aoMap: true,
          emissiveMap: true,
        };
        mesh.material = new THREE.MeshPhongMaterial({
          map: maps.albedoMap ? origMat.map : null,
          color: maps.albedoMap ? origMat.color : new THREE.Color(0xcccccc),
          normalMap: maps.normalMap ? origMat.normalMap : null,
          normalScale: origMat.normalScale,
          specular: new THREE.Color(0x555555),
          shininess: 30,
          wireframe: pbr.wireframe,
        });
        continue;
      }

      // Modern PBR (Canonical Khronos glTF PBR standard with individual map toggles)
      const pbrMat = origMat.clone();
      pbrMat.wireframe = pbr.wireframe;

      const maps = pbr.maps || {
        albedoMap: true,
        normalMap: true,
        roughnessMap: true,
        metalnessMap: true,
        aoMap: true,
        emissiveMap: true,
      };

      // 1. Albedo / Base Color map
      if (maps.albedoMap) {
        pbrMat.map = origMat.map;
        pbrMat.color.copy(origMat.color);
      } else {
        pbrMat.map = null;
        pbrMat.color.set(0xcccccc); // Clean neutral clay base
      }

      // 2. Normal map (micro-details, rivets, indentations)
      if (maps.normalMap) {
        pbrMat.normalMap = origMat.normalMap;
        if (origMat.normalScale) {
          pbrMat.normalScale.copy(origMat.normalScale);
        }
      } else {
        pbrMat.normalMap = null;
      }

      // 3. Roughness map (scratched vs shiny micro-facets)
      if (maps.roughnessMap) {
        pbrMat.roughnessMap = origMat.roughnessMap;
        pbrMat.roughness = origMat.roughness;
      } else {
        pbrMat.roughnessMap = null;
        pbrMat.roughness = pbr.roughness; // Uniform roughness
      }

      // 4. Metalness map (conductor metal vs dielectric armor)
      if (maps.metalnessMap) {
        pbrMat.metalnessMap = origMat.metalnessMap;
        pbrMat.metalness = origMat.metalness;
      } else {
        pbrMat.metalnessMap = null;
        pbrMat.metalness = pbr.metalness; // Uniform metalness
      }

      // 5. Ambient Occlusion map (crevices & deep cavity shading)
      if (maps.aoMap && !isNoAo) {
        pbrMat.aoMap = origMat.aoMap;
        pbrMat.aoMapIntensity = ao.intensity || 1.0;
      } else {
        pbrMat.aoMap = null;
        pbrMat.aoMapIntensity = 0;
      }

      // 6. Emissive map (sensor indicators and tech lights)
      if (maps.emissiveMap) {
        pbrMat.emissiveMap = origMat.emissiveMap;
        pbrMat.emissive.copy(origMat.emissive);
      } else {
        pbrMat.emissiveMap = null;
        pbrMat.emissive.set(0x000000);
      }

      pbrMat.envMapIntensity = isNoIbl ? 0 : lighting.iblIntensity;
      pbrMat.needsUpdate = true;
      mesh.material = pbrMat;
    }
  }

  /**
   * Applies palette materials to current model
   */
  private applyMaterialsToModel(
    palette: MaterialsPalette,
    forceLegacy?: 'unlit' | 'phong' | 'no_ao' | 'hard_shadow' | 'no_ibl'
  ) {
    if (!this.currentModelBundle) return;

    if (this.state.materialMode === 'assembly') {
      // Physically accurate multi-material assembly
      for (const part of this.currentModelBundle.parts) {
        part.mesh.material = palette[part.info.role];
      }
    } else {
      // Single uniform test material across hero and parts
      for (const part of this.currentModelBundle.parts) {
        part.mesh.material = palette.car_paint;
      }
    }

    // Apply to loaded GLTF model if present
    this.applyMaterialsToGlb(palette, forceLegacy);
  }

  /**
   * Applies the entire state configuration into the Three.js scene
   */
  public applyState(newState: RenderState) {
    const prevState = this.state;
    this.state = newState;

    // 1. Model or Pedestal switch
    if (
      newState.model !== prevState?.model ||
      newState.pedestalStyle !== prevState?.pedestalStyle ||
      newState.customModelUrl !== prevState?.customModelUrl
    ) {
      this.loadModel(newState.model, newState.pedestalStyle, newState.customModelUrl);
    }

    // 1b. Pedestal visibility toggle
    if (this.currentModelBundle) {
      for (const part of this.currentModelBundle.parts) {
        if (part.info.id.startsWith('pedestal_') || part.info.id === 'shaderball_base') {
          part.mesh.visible = newState.showPedestal;
        }
      }
      // Also hide non-part pedestal children (shadow gap, LED ring, gasket, riser ring)
      this.currentModelBundle.group.traverse((child) => {
        if (child.name === 'MasterPedestalStandModel') return;
        if (child instanceof THREE.Mesh && !this.currentModelBundle!.parts.some(p => p.mesh === child) &&
            !this.currentModelBundle!.heroMeshes.includes(child)) {
          child.visible = newState.showPedestal;
        }
      });
    }

    // 2. Material update
    this.currentPalette = this.buildMaterialsPalette(newState, !newState.pbr.pbrEnabled);

    if (newState.splitCompare.enabled) {
      const leftModeMap: Record<string, 'unlit' | 'phong' | 'no_ao' | 'hard_shadow' | 'no_ibl'> = {
        unlit: 'unlit',
        legacy_phong: 'phong',
        no_ao: 'no_ao',
        hard_shadow: 'hard_shadow',
        no_ibl: 'no_ibl',
      };
      this.leftPalette = this.buildMaterialsPalette(
        newState,
        true,
        leftModeMap[newState.splitCompare.leftMode] || 'phong'
      );
    } else {
      this.leftPalette = null;
    }

    this.applyMaterialsToModel(this.currentPalette);

    // 3. Lighting: Directional Sun / Key Light
    const { lighting, shadow, post } = newState;
    if (lighting.directEnabled) {
      this.keyDirectionalLight.visible = true;
      this.keyDirectionalLight.intensity = lighting.directIntensity;
      this.keyDirectionalLight.color.set(lighting.directColor);

      // Spherical coordinate position calculation
      const phi = THREE.MathUtils.degToRad(90 - lighting.directElevation);
      const theta = THREE.MathUtils.degToRad(lighting.directAzimuth);
      const distance = 8.5;

      const lx = distance * Math.sin(phi) * Math.sin(theta);
      const ly = distance * Math.cos(phi);
      const lz = distance * Math.sin(phi) * Math.cos(theta);

      this.keyDirectionalLight.position.set(lx, ly, lz);
      this.keyDirectionalLight.target.position.set(0, 1.2, 0);
      this.keyDirectionalLight.target.updateMatrixWorld();
    } else {
      this.keyDirectionalLight.visible = false;
    }

    // Ambient Light (Flat Ambient Diffuse Illumination)
    const isAmbientOn = lighting.ambientEnabled ?? false;
    this.ambientLight.visible = isAmbientOn;
    this.ambientLight.intensity = isAmbientOn ? (lighting.ambientIntensity ?? 0.3) : 0;
    if (lighting.ambientColor) {
      this.ambientLight.color.set(lighting.ambientColor);
    }

    // Fill Light
    this.fillHemiLight.visible = lighting.fillEnabled;
    this.fillHemiLight.intensity = lighting.fillIntensity;

    // Rim Light
    this.rimSpotLight.visible = lighting.rimEnabled;
    this.rimSpotLight.intensity = lighting.rimIntensity;

    // 3.5 IBL Environment & 360° Studio Skybox
    this.updateEnvironmentAndSkybox(lighting, prevState?.lighting);

    // 4. Shadows & Softening
    if (shadow.mode === 'none') {
      this.keyDirectionalLight.castShadow = false;
      this.renderer.shadowMap.enabled = false;
    } else {
      this.keyDirectionalLight.castShadow = true;
      this.renderer.shadowMap.enabled = true;

      if (shadow.mode === 'hard') {
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.keyDirectionalLight.shadow.radius = 1;
      } else {
        // Modern Three.js uses PCFShadowMap with shadow.radius for soft shadows
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.keyDirectionalLight.shadow.radius = shadow.mode === 'pcf' ? 2.0 : shadow.radius;
      }

      this.keyDirectionalLight.shadow.bias = shadow.bias;
      if (this.keyDirectionalLight.shadow.map) {
        this.keyDirectionalLight.shadow.map.dispose();
        this.keyDirectionalLight.shadow.map = null;
      }
      this.keyDirectionalLight.shadow.mapSize.width = shadow.resolution;
      this.keyDirectionalLight.shadow.mapSize.height = shadow.resolution;
    }

    // Contact Ground Shadow
    this.contactShadowMesh.visible = shadow.contactShadow;
    this.contactShadowMat.opacity = shadow.contactOpacity;

    // 5. Tone Mapping & Exposure
    switch (post.toneMapping) {
      case 'aces':
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
      case 'reinhard':
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case 'cineon':
        this.renderer.toneMapping = THREE.CineonToneMapping;
        break;
      case 'linear':
        this.renderer.toneMapping = THREE.LinearToneMapping;
        break;
      case 'none':
      default:
        this.renderer.toneMapping = THREE.NoToneMapping;
        break;
    }
    this.renderer.toneMappingExposure = post.exposure;

    // 6. Bloom Glow Post-Processing
    if (this.bloomPass) {
      this.bloomPass.enabled = post.bloom;
      this.bloomPass.strength = post.bloomStrength ?? 0.45;
      this.bloomPass.radius = post.bloomRadius ?? 0.4;
      this.bloomPass.threshold = post.bloomThreshold ?? 0.85;
    }

    // 7. Atmospheric Fog
    this.updateFog(newState.fog, newState.lighting);
  }

  /**
   * Updates atmospheric fog (Exp2 or Linear) and integrates with environment background
   */
  private updateFog(fog: RenderState['fog'] | undefined, lighting: RenderState['lighting']) {
    if (!fog || !fog.enabled) {
      if (lighting.showSkybox && this.currentEnvTexture) {
        this.scene.fog = null;
        this.scene.background = this.currentEnvTexture;
      } else {
        // Standard studio backdrop & subtle depth fade
        this.scene.background = new THREE.Color(0x0c0d12);
        this.scene.fog = new THREE.Fog(0x0c0d12, 12, 35);
      }
      return;
    }

    const fogColor = new THREE.Color(fog.color || '#0a0d14');
    if (fog.type === 'exp2') {
      this.scene.fog = new THREE.FogExp2(fogColor, fog.density ?? 0.028);
    } else {
      this.scene.fog = new THREE.Fog(fogColor, fog.near ?? 5, fog.far ?? 24);
    }

    // When fog is enabled, blend canvas clear background with fog color unless skybox is active
    if (!lighting.showSkybox) {
      this.scene.background = fogColor;
    }
  }

  /**
   * Camera View Angle Presets
   */
  public setCameraView(preset: 'iso' | 'front' | 'top' | 'rim') {
    const target = this.controls.target;
    switch (preset) {
      case 'iso':
        this.camera.position.set(4.2, 3.2, 5.2);
        break;
      case 'front':
        this.camera.position.set(0, target.y + 0.2, 6.2);
        break;
      case 'top':
        this.camera.position.set(0.1, 7.5, 0.1);
        break;
      case 'rim':
        this.camera.position.set(-4.5, target.y + 0.8, -4.5);
        break;
    }
    this.controls.update();
  }

  /**
   * Main Render Loop
   */
  private startLoop() {
    const renderFrame = () => {
      if (this.isDisposed) return;

      const delta = this.clock.getDelta();

      // Auto-rotation
      if (this.state.autoRotate && this.currentModelBundle) {
        this.currentModelBundle.group.rotation.y += delta * this.state.rotationSpeed;
      }

      this.controls.update();

      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      if (this.state.splitCompare.enabled && this.leftPalette && this.currentModelBundle) {
        // --- GPU Scissor Split-Screen Comparison Mode ---
        const splitX = Math.floor(width * this.state.splitCompare.splitPosition);

        this.renderer.setScissorTest(true);

        // Crucial fix: Keep full canvas viewport (0, 0, width, height) so camera projection and aspect ratio
        // match identically across both sides without any horizontal distortion or compression.
        this.renderer.setViewport(0, 0, width, height);

        const leftModeMap: Record<string, 'unlit' | 'phong' | 'no_ao' | 'hard_shadow' | 'no_ibl'> = {
          unlit: 'unlit',
          legacy_phong: 'phong',
          no_ao: 'no_ao',
          hard_shadow: 'hard_shadow',
          no_ibl: 'no_ibl',
        };

        // 1. Left Comparison Slice (Legacy / Profile under test: [0, splitX])
        if (splitX > 0) {
          this.renderer.setScissor(0, 0, splitX, height);
          this.applyMaterialsToModel(this.leftPalette, leftModeMap[this.state.splitCompare.leftMode] || 'phong');
          this.renderer.render(this.scene, this.camera);
        }

        // 2. Right Comparison Slice (Full Next-Gen PBR pipeline: [splitX, width])
        if (width - splitX > 0) {
          this.renderer.setScissor(splitX, 0, width - splitX, height);
          this.applyMaterialsToModel(this.currentPalette);
          this.renderer.render(this.scene, this.camera);
        }

        this.renderer.setScissorTest(false);
      } else {
        // --- Standard Single Viewport Render ---
        this.renderer.setViewport(0, 0, width, height);
        if (this.state.post.bloom && this.composer && this.bloomPass?.enabled) {
          this.composer.render(delta);
        } else {
          this.renderer.render(this.scene, this.camera);
        }
      }

      this.animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }

  private loadHdrTexture(url: string, onLoad: (texture: THREE.Texture) => void) {
    if (this.hdrTextureCache.has(url)) {
      onLoad(this.hdrTextureCache.get(url)!);
      return;
    }
    this.rgbeLoader.load(
      url,
      (hdrTexture) => {
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.hdrTextureCache.set(url, hdrTexture);
        onLoad(hdrTexture);
      },
      undefined,
      (err) => {
        console.warn(`[HDR Loader] Failed to load ${url}, falling back to roomEnv`, err);
        if (this.roomEnvTexture) {
          onLoad(this.roomEnvTexture);
        }
      }
    );
  }

  private updateEnvironmentAndSkybox(
    lighting: RenderState['lighting'],
    prevLighting?: RenderState['lighting']
  ) {
    if (!lighting.iblEnabled) {
      this.scene.environment = null;
      this.updateFog(this.state.fog, lighting);
      return;
    }

    const applyBackgroundAndFog = (texture: THREE.Texture) => {
      if (this.isDisposed) return;
      if (lighting.showSkybox) {
        this.scene.background = texture;
        // In modern Three.js, backgroundBlurriness (0.0 to 1.0) and backgroundIntensity control visual HDR backdrop
        (this.scene as any).backgroundBlurriness = lighting.skyboxBlur;
        (this.scene as any).backgroundIntensity = lighting.skyboxIntensity;
        if (this.state.fog?.enabled) {
          this.updateFog(this.state.fog, lighting);
        } else {
          this.scene.fog = null; // Clear dark fog so 360° studio HDR is clearly visible
        }
      } else {
        this.updateFog(this.state.fog, lighting);
      }
    };

    const hdrFileMap: Record<string, string> = {
      ferndale_studio: '/textures/hdr/ferndale_studio_04_1k.hdr',
      monochrome_studio: '/textures/hdr/monochrome_studio_02_1k.hdr',
      sunset: '/textures/hdr/venice_sunset_1k.hdr',
    };

    const hdrPath = hdrFileMap[lighting.iblPreset];

    // If preset hasn't changed and currentEnvTexture exists, update background settings directly
    if (this.currentEnvTexture && prevLighting?.iblPreset === lighting.iblPreset) {
      this.scene.environment = this.currentEnvTexture;
      applyBackgroundAndFog(this.currentEnvTexture);
      return;
    }

    if (hdrPath) {
      this.loadHdrTexture(hdrPath, (hdrTexture) => {
        if (this.state.lighting.iblPreset === lighting.iblPreset) {
          this.currentEnvTexture = hdrTexture;
          this.scene.environment = hdrTexture;
          applyBackgroundAndFog(hdrTexture);
        }
      });
    } else {
      // Procedural fallback for industrial or night presets
      const proceduralKey = `proc_${lighting.iblPreset}`;
      if (!this.hdrTextureCache.has(proceduralKey)) {
        const procTex = generateProceduralEnvironmentTexture(lighting.iblPreset, 1024, 512);
        this.hdrTextureCache.set(proceduralKey, procTex);
      }
      const tex = this.hdrTextureCache.get(proceduralKey)!;
      this.currentEnvTexture = tex;
      this.scene.environment = tex;
      applyBackgroundAndFog(tex);
    }
  }

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
      }
    });
  }

  /**
   * Clean destruction of all WebGL resources on unmount
   */
  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);

    this.controls.dispose();
    if (this.currentModelBundle) {
      this.disposeObject(this.currentModelBundle.group);
    }
    this.groundPlane.geometry.dispose();
    this.contactShadowMesh.geometry.dispose();
    this.contactShadowMat.dispose();

    this.aoTexture.dispose();
    this.normalTexture.dispose();
    this.contactTexture.dispose();
    this.woodTexture.dispose();
    this.marbleTexture.dispose();
    if (this.currentEnvTexture) this.currentEnvTexture.dispose();
    if (this.roomEnvTexture) this.roomEnvTexture.dispose();
    this.hdrTextureCache.forEach((tex) => tex.dispose());
    this.hdrTextureCache.clear();
    this.pmremGenerator.dispose();
    if (this.bloomPass) {
      this.bloomPass.dispose();
    }
    if (this.composer) {
      this.composer.renderTarget1.dispose();
      this.composer.renderTarget2.dispose();
    }

    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
