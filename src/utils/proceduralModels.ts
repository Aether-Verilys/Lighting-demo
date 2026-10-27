/**
 * Lumina 3D - Multi-Material Procedural 3D Models
 * Physically accurate multi-material assignments:
 * - Wood on wooden pedestals, plinths, and shafts
 * - Brass & Steel on mechanical gears, fasteners, and axles
 * - Chrome on mirror-reflective core calibration elements
 * - Marble on architectural fluted columns and sculpted busts
 * - Rubber on damping rings and base gaskets
 * - Glass on optical lenses and sensor visors
 * - Gold trim on luxury accents and calibrated chapter rings
 */

import * as THREE from 'three';
import { MaterialRole, PartMaterialInfo, PedestalStyle } from '../types/rendering';

export interface ModelPartRecord {
  mesh: THREE.Mesh;
  info: PartMaterialInfo;
}

export interface ProceduralModelBundle {
  group: THREE.Group;
  parts: ModelPartRecord[];
  heroMeshes: THREE.Mesh[]; // Meshes that can receive dynamic single-material testing
  height: number;
}

export type MaterialsPalette = Record<MaterialRole, THREE.Material>;

/**
 * 1. Multi-Material Calibration Shader Ball
 * - Pedestal Base: Walnut Hardwood (wood)
 * - Anti-slip Gasket: Matte Vulcanized Rubber (rubber)
 * - Support Collar & Knurls: Brushed Brass (brass)
 * - Inner Core Sphere: Mirror Chrome (chrome)
 * - Outer Slotted Shell: Pearlescent Car Paint / Hero (car_paint)
 * - Calibrated Chapter Ring: Polished 24K Gold (gold_trim)
 */
export function createShaderBall(materials: MaterialsPalette): ProceduralModelBundle {
  const group = new THREE.Group();
  group.name = 'ShaderBallModel';

  const parts: ModelPartRecord[] = [];
  const heroMeshes: THREE.Mesh[] = [];

  // 1. Pedestal Base Plinth: Solid Walnut Wood
  const baseGeom = new THREE.CylinderGeometry(1.45, 1.6, 0.25, 48);
  baseGeom.translate(0, 0.125, 0);
  const baseMesh = new THREE.Mesh(baseGeom, materials.wood);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);
  parts.push({
    mesh: baseMesh,
    info: {
      id: 'shaderball_base',
      name: '胡桃原木底座',
      nameEn: 'Walnut Hardwood Plinth',
      role: 'wood',
      description: '天然有机绝缘体材质，具有生长年轮微纹理与高粗糙度漫散射。',
      metalness: 0.0,
      roughness: 0.62,
      color: '#542308',
    },
  });

  // 2. Anti-slip Gasket Foot: Matte Vulcanized Rubber
  const gasketGeom = new THREE.TorusGeometry(1.52, 0.045, 16, 48);
  gasketGeom.rotateX(Math.PI / 2);
  gasketGeom.translate(0, 0.04, 0);
  const gasketMesh = new THREE.Mesh(gasketGeom, materials.rubber);
  gasketMesh.castShadow = true;
  group.add(gasketMesh);
  parts.push({
    mesh: gasketMesh,
    info: {
      id: 'shaderball_rubber',
      name: '基座减震胶圈',
      nameEn: 'Vulcanized Rubber Gasket',
      role: 'rubber',
      description: '极高微表面漫散射，无镜面高光，光线能量完全被微多孔结构吸收。',
      metalness: 0.0,
      roughness: 0.88,
      color: '#18181b',
    },
  });

  // 3. Stepped Bevel Collar: Brushed Brass Metal
  const collarGeom = new THREE.CylinderGeometry(1.15, 1.35, 0.2, 48);
  collarGeom.translate(0, 0.35, 0);
  const collarMesh = new THREE.Mesh(collarGeom, materials.brass);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);
  parts.push({
    mesh: collarMesh,
    info: {
      id: 'shaderball_collar',
      name: '黄铜固定台环',
      nameEn: 'Brushed Brass Collar',
      role: 'brass',
      description: '金属导体，高光呈现特有的暖金色反射，对周围环境光 (IBL) 极度敏感。',
      metalness: 0.95,
      roughness: 0.22,
      color: '#d4af37',
    },
  });

  // 4. Central Neck Stem: Dark Machine Steel
  const stemGeom = new THREE.CylinderGeometry(0.55, 0.7, 0.5, 36);
  stemGeom.translate(0, 0.7, 0);
  const stemMesh = new THREE.Mesh(stemGeom, materials.dark_steel);
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  group.add(stemMesh);
  parts.push({
    mesh: stemMesh,
    info: {
      id: 'shaderball_stem',
      name: '精钢主轴支架',
      nameEn: 'Hardened Steel Axle',
      role: 'dark_steel',
      description: '工业级黑化精钢，金属度高，具备抗眩光深灰冷色调反射。',
      metalness: 0.88,
      roughness: 0.38,
      color: '#27272a',
    },
  });

  // 5. Central Hero Inner Sphere: Specular Mirror Chrome
  const innerSphereGeom = new THREE.SphereGeometry(0.92, 48, 48);
  innerSphereGeom.translate(0, 1.7, 0);
  const innerSphereMesh = new THREE.Mesh(innerSphereGeom, materials.chrome);
  innerSphereMesh.castShadow = true;
  innerSphereMesh.receiveShadow = true;
  group.add(innerSphereMesh);
  parts.push({
    mesh: innerSphereMesh,
    info: {
      id: 'shaderball_inner_sphere',
      name: '核心镀铬镜面球',
      nameEn: 'Mirror Chrome Sphere',
      role: 'chrome',
      description: '极致镜面全反射，100% 金属导体，无漫反射基色，完全由环境贴图塑造形态。',
      metalness: 1.0,
      roughness: 0.04,
      color: '#f8fafc',
    },
  });
  heroMeshes.push(innerSphereMesh);

  // 6. Outer Slotted Shell: Pearlescent Paint (Hero Part)
  const outerGeom = new THREE.SphereGeometry(1.22, 64, 48, 0, Math.PI * 1.6, 0, Math.PI * 0.9);
  outerGeom.translate(0, 1.7, 0);
  const outerMesh = new THREE.Mesh(outerGeom, materials.car_paint);
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  group.add(outerMesh);
  parts.push({
    mesh: outerMesh,
    info: {
      id: 'shaderball_outer_shell',
      name: '双层烤漆外壳',
      nameEn: 'Clearcoat Lacquer Shell',
      role: 'car_paint',
      description: '双层复合光学结构：底层珍珠色漫反射 + 外层清漆 (Clearcoat) 镜面反射。',
      metalness: 0.15,
      roughness: 0.25,
      color: '#1d4ed8',
    },
  });
  heroMeshes.push(outerMesh);

  // 7. Calibrated Alignment Ring: 24K Gold Trim
  const ringGeom = new THREE.TorusGeometry(1.26, 0.045, 16, 64);
  ringGeom.rotateX(Math.PI / 2);
  ringGeom.translate(0, 1.7, 0);
  const ringMesh = new THREE.Mesh(ringGeom, materials.gold_trim);
  ringMesh.castShadow = true;
  group.add(ringMesh);
  parts.push({
    mesh: ringMesh,
    info: {
      id: 'shaderball_gold_ring',
      name: '24K 镀金刻度环',
      nameEn: '24K Gold Chapter Ring',
      role: 'gold_trim',
      description: '贵金属纯金反光，具备微表面各向异性光泽与奢华菲涅尔反射。',
      metalness: 0.98,
      roughness: 0.14,
      color: '#eab308',
    },
  });

  return { group, parts, heroMeshes, height: 2.95 };
}

/**
 * 2. Classical Architectural Bust & Column (文艺复兴雕塑石柱)
 * - Plinth Base: Dark Ebony Hardwood (wood)
 * - Torus Base Ring: Cast Bronze / Steel (dark_steel)
 * - Column Shaft: Carrara White Marble with veins (marble)
 * - Column Capital & Carvings: Gilded Gold Trim (gold_trim)
 * - Crowning Bust / Sculpture: Carrara White Marble (marble)
 */
export function createClassicalColumn(materials: MaterialsPalette): ProceduralModelBundle {
  const group = new THREE.Group();
  group.name = 'ClassicalColumnModel';

  const parts: ModelPartRecord[] = [];
  const heroMeshes: THREE.Mesh[] = [];

  // 1. Bottom Square Plinth: Dark Ebony Wood
  const plinthGeom = new THREE.BoxGeometry(2.1, 0.28, 2.1);
  plinthGeom.translate(0, 0.14, 0);
  const plinthMesh = new THREE.Mesh(plinthGeom, materials.wood);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  group.add(plinthMesh);
  parts.push({
    mesh: plinthMesh,
    info: {
      id: 'column_wood_plinth',
      name: '深色黑檀木基台',
      nameEn: 'Ebony Wood Plinth',
      role: 'wood',
      description: '古典家具级实木台座，高密度实木微纹理与丝绸般微漫光。',
      metalness: 0.0,
      roughness: 0.58,
      color: '#3b1807',
    },
  });

  // 2. Base Molding Ring: Dark Cast Bronze/Steel
  const torusBaseGeom = new THREE.CylinderGeometry(1.05, 1.15, 0.22, 48);
  torusBaseGeom.translate(0, 0.39, 0);
  const torusMesh = new THREE.Mesh(torusBaseGeom, materials.dark_steel);
  torusMesh.castShadow = true;
  torusMesh.receiveShadow = true;
  group.add(torusMesh);
  parts.push({
    mesh: torusMesh,
    info: {
      id: 'column_bronze_base',
      name: '铸铜托足线脚',
      nameEn: 'Cast Bronze Base Torus',
      role: 'dark_steel',
      description: '承重青铜铸件，岁月氧化的暗调金属反射。',
      metalness: 0.85,
      roughness: 0.45,
      color: '#3f3f46',
    },
  });

  // 3. Fluted Column Shaft: Carrara White Marble
  const shaftHeight = 2.4;
  const shaftGeom = new THREE.CylinderGeometry(0.78, 0.78, shaftHeight, 96, 16);
  const posAttr = shaftGeom.attributes.position;
  const flutesCount = 20;
  const fluteDepth = 0.08;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    if (Math.abs(y) < shaftHeight * 0.46) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const angle = Math.atan2(z, x);
      const flute = Math.sin(angle * flutesCount);
      if (flute > 0) {
        const factor = 1 - (flute * fluteDepth) / 0.78;
        posAttr.setX(i, x * factor);
        posAttr.setZ(i, z * factor);
      }
    }
  }
  shaftGeom.computeVertexNormals();
  shaftGeom.translate(0, 0.5 + shaftHeight * 0.5, 0);

  const shaftMesh = new THREE.Mesh(shaftGeom, materials.marble);
  shaftMesh.castShadow = true;
  shaftMesh.receiveShadow = true;
  group.add(shaftMesh);
  parts.push({
    mesh: shaftMesh,
    info: {
      id: 'column_marble_shaft',
      name: '卡拉拉白大理石柱身',
      nameEn: 'Fluted Carrara Marble Shaft',
      role: 'marble',
      description: '20道凹槽柱身，呈现天然大理石灰色矿脉与凹槽处极具深度的环境光遮蔽 (AO)。',
      metalness: 0.02,
      roughness: 0.38,
      color: '#f8fafc',
    },
  });
  heroMeshes.push(shaftMesh);

  // 4. Capital Collar: Gilded Gold Ornaments
  const capitalCollar = new THREE.CylinderGeometry(1.02, 0.84, 0.22, 48);
  capitalCollar.translate(0, 0.5 + shaftHeight + 0.11, 0);
  const collarMesh = new THREE.Mesh(capitalCollar, materials.gold_trim);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);
  parts.push({
    mesh: collarMesh,
    info: {
      id: 'column_gold_capital',
      name: '柱头镀金卷草纹饰',
      nameEn: 'Gilded Gold Capital Trim',
      role: 'gold_trim',
      description: '古典巴洛克金箔贴金工艺，强烈的金属高光与环境反射。',
      metalness: 0.96,
      roughness: 0.16,
      color: '#eab308',
    },
  });

  // 5. Capital Abacus Top Slab: Carrara White Marble
  const topSlabGeom = new THREE.BoxGeometry(1.9, 0.22, 1.9);
  topSlabGeom.translate(0, 0.5 + shaftHeight + 0.33, 0);
  const topSlabMesh = new THREE.Mesh(topSlabGeom, materials.marble);
  topSlabMesh.castShadow = true;
  topSlabMesh.receiveShadow = true;
  group.add(topSlabMesh);
  parts.push({
    mesh: topSlabMesh,
    info: {
      id: 'column_top_slab',
      name: '大理石顶板 (Abacus)',
      nameEn: 'Marble Abacus Slab',
      role: 'marble',
      description: '平整磨光的大理石顶板，与金属装饰形成鲜明绝缘体/导体对比。',
      metalness: 0.02,
      roughness: 0.35,
      color: '#f8fafc',
    },
  });

  // 6. Crowning Classical Sculpted Head: Carrara White Marble
  const crownGeom = new THREE.DodecahedronGeometry(0.58, 2);
  crownGeom.translate(0, 0.5 + shaftHeight + 0.44 + 0.58, 0);
  const crownMesh = new THREE.Mesh(crownGeom, materials.marble);
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  group.add(crownMesh);
  parts.push({
    mesh: crownMesh,
    info: {
      id: 'column_sculpture_head',
      name: '大理石雕塑冠顶',
      nameEn: 'Sculpted Marble Finial',
      role: 'marble',
      description: '雕塑曲面多面体，展现微表面反射与环境光漫散射的柔和交替。',
      metalness: 0.02,
      roughness: 0.36,
      color: '#f8fafc',
    },
  });
  heroMeshes.push(crownMesh);

  return { group, parts, heroMeshes, height: 4.2 };
}

/**
 * 3. Precision Mechanical Astrolabe & Clockwork Turbine (机械钟表与涡轮)
 * - Machine Bed: Walnut Hardwood Stand (wood)
 * - Center Axle: Mirror Chrome / Hardened Steel (chrome)
 * - Interlocking Blades / Rotor: Burnished Dark Steel (dark_steel)
 * - Planetary Gears: Polished Brass (brass)
 * - Optical Sight Glass / Inspection Port: Optical Glass (glass)
 * - Outer Shroud: Coated Car Paint / Gold Trim (gold_trim)
 */
export function createMechanicalTurbine(materials: MaterialsPalette): ProceduralModelBundle {
  const group = new THREE.Group();
  group.name = 'MechanicalTurbineModel';

  const parts: ModelPartRecord[] = [];
  const heroMeshes: THREE.Mesh[] = [];

  // 1. Hardwood Bed: Walnut Mount
  const bedGeom = new THREE.CylinderGeometry(1.65, 1.78, 0.28, 48);
  bedGeom.translate(0, 0.14, 0);
  const bedMesh = new THREE.Mesh(bedGeom, materials.wood);
  bedMesh.castShadow = true;
  bedMesh.receiveShadow = true;
  group.add(bedMesh);
  parts.push({
    mesh: bedMesh,
    info: {
      id: 'mech_wood_bed',
      name: '胡桃木机台底座',
      nameEn: 'Walnut Hardwood Mount',
      role: 'wood',
      description: '精密机加工仪器常用的实木吸震机座，提供厚重温暖的绝缘体质感。',
      metalness: 0.0,
      roughness: 0.64,
      color: '#542308',
    },
  });

  // 2. Central Axle Hub: Specular Chrome
  const hubGeom = new THREE.CylinderGeometry(0.5, 0.65, 1.6, 36);
  hubGeom.translate(0, 1.1, 0);
  const hubMesh = new THREE.Mesh(hubGeom, materials.chrome);
  hubMesh.castShadow = true;
  hubMesh.receiveShadow = true;
  group.add(hubMesh);
  parts.push({
    mesh: hubMesh,
    info: {
      id: 'mech_chrome_axle',
      name: '镀铬高转速主轴',
      nameEn: 'Mirror Chrome Axle Hub',
      role: 'chrome',
      description: '高精磨削镜面钢，轴承接触面摩擦系数近乎为零，倒映周围全部景物。',
      metalness: 1.0,
      roughness: 0.05,
      color: '#f8fafc',
    },
  });
  heroMeshes.push(hubMesh);

  // 3. 12 Aerodynamic Curved Turbine Blades: Dark Steel / Titanium
  const numBlades = 12;
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.quadraticCurveTo(0.6, 0.2, 0.95, 0.05);
  bladeShape.lineTo(0.9, 0.7);
  bladeShape.quadraticCurveTo(0.45, 0.6, 0, 0.4);
  bladeShape.closePath();

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    steps: 1,
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });

  const bladeGroup = new THREE.Group();
  for (let i = 0; i < numBlades; i++) {
    const angle = (i / numBlades) * Math.PI * 2;
    const bladeMesh = new THREE.Mesh(bladeGeom, materials.dark_steel);
    bladeMesh.rotation.y = angle;
    bladeMesh.rotation.x = Math.PI * 0.1;
    bladeMesh.position.set(Math.cos(angle) * 0.45, 1.2, Math.sin(angle) * 0.45);
    bladeMesh.castShadow = true;
    bladeMesh.receiveShadow = true;
    bladeGroup.add(bladeMesh);
    heroMeshes.push(bladeMesh);
  }
  group.add(bladeGroup);
  // Representative part record for blades
  const repBladeMesh = bladeGroup.children[0] as THREE.Mesh;
  parts.push({
    mesh: repBladeMesh,
    info: {
      id: 'mech_steel_blades',
      name: '钛合金涡轮叶片组 (12片)',
      nameEn: 'Titanium Rotor Blades',
      role: 'dark_steel',
      description: '多叶片相互投射极其丰富的阴影半影与镜面划痕高光。',
      metalness: 0.88,
      roughness: 0.32,
      color: '#334155',
    },
  });

  // 4. Secondary Planetary Gear Ring: Precision Polished Brass
  const gearRingGeom = new THREE.CylinderGeometry(1.25, 1.25, 0.22, 32);
  gearRingGeom.translate(0, 0.4, 0);
  const gearRingMesh = new THREE.Mesh(gearRingGeom, materials.brass);
  gearRingMesh.castShadow = true;
  gearRingMesh.receiveShadow = true;
  group.add(gearRingMesh);
  parts.push({
    mesh: gearRingMesh,
    info: {
      id: 'mech_brass_gear',
      name: '精密黄铜传动齿轮',
      nameEn: 'Precision Brass Spur Gear',
      role: 'brass',
      description: '传动齿轮采用特种耐磨黄铜，金黄发色与机械深度对比极强。',
      metalness: 0.94,
      roughness: 0.22,
      color: '#ca8a04',
    },
  });

  // 5. Outer Shroud Ring: 24K Gold Trim
  const ringGeom = new THREE.TorusGeometry(1.4, 0.08, 16, 64);
  ringGeom.rotateX(Math.PI / 2);
  ringGeom.translate(0, 1.25, 0);
  const ringMesh = new THREE.Mesh(ringGeom, materials.gold_trim);
  ringMesh.castShadow = true;
  ringMesh.receiveShadow = true;
  group.add(ringMesh);
  parts.push({
    mesh: ringMesh,
    info: {
      id: 'mech_gold_shroud',
      name: '整流定子金色锁紧环',
      nameEn: 'Gilded Stator Retention Ring',
      role: 'gold_trim',
      description: '高反光金箔滚边饰环，提供极其细腻的高亮切线反光。',
      metalness: 0.98,
      roughness: 0.14,
      color: '#eab308',
    },
  });

  // 6. Central Sight Loupe / Glass Port: Optical Glass
  const glassLensGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 32);
  glassLensGeom.translate(0, 1.95, 0);
  const glassLensMesh = new THREE.Mesh(glassLensGeom, materials.glass);
  glassLensMesh.castShadow = true;
  group.add(glassLensMesh);
  parts.push({
    mesh: glassLensMesh,
    info: {
      id: 'mech_glass_lens',
      name: '顶部光学观测窗',
      nameEn: 'Optical Glass Inspection Port',
      role: 'glass',
      description: '通透高透光光学电介质，高反射清漆边缘与折射率 1.5。',
      metalness: 0.05,
      roughness: 0.06,
      color: '#e0f2fe',
    },
  });

  return { group, parts, heroMeshes, height: 2.2 };
}

/**
 * 4. Cybernetic Drone Core
 */
export function createCyberneticDrone(materials: MaterialsPalette): ProceduralModelBundle {
  const group = new THREE.Group();
  group.name = 'CyberneticDroneModel';

  const parts: ModelPartRecord[] = [];
  const heroMeshes: THREE.Mesh[] = [];

  // 1. Dock Base: Carbon Composite / Wood Mount
  const dockGeom = new THREE.CylinderGeometry(1.25, 1.5, 0.22, 48);
  dockGeom.translate(0, 0.11, 0);
  const dockMesh = new THREE.Mesh(dockGeom, materials.wood);
  dockMesh.castShadow = true;
  dockMesh.receiveShadow = true;
  group.add(dockMesh);
  parts.push({
    mesh: dockMesh,
    info: {
      id: 'drone_dock',
      name: '复合碳化实木座',
      nameEn: 'Carbonized Wood Dock',
      role: 'wood',
      description: '硬质绝缘基座，提供有机漫射吸光基底。',
      metalness: 0.0,
      roughness: 0.65,
      color: '#3b1807',
    },
  });

  // 2. Thruster Cone: Titanium Dark Steel
  const thrusterGeom = new THREE.ConeGeometry(0.48, 0.42, 32);
  thrusterGeom.rotateX(Math.PI);
  thrusterGeom.translate(0, 0.52, 0);
  const thrusterMesh = new THREE.Mesh(thrusterGeom, materials.dark_steel);
  thrusterMesh.castShadow = true;
  group.add(thrusterMesh);
  parts.push({
    mesh: thrusterMesh,
    info: {
      id: 'drone_thruster',
      name: '耐热钛合金喷管',
      nameEn: 'Titanium Thruster Nozzle',
      role: 'dark_steel',
      description: '耐高温航天合金金属表面。',
      metalness: 0.9,
      roughness: 0.4,
      color: '#334155',
    },
  });

  // 3. Drone Main Body: Pearlescent Car Paint
  const droneBodyGeom = new THREE.SphereGeometry(0.96, 64, 48);
  droneBodyGeom.translate(0, 1.5, 0);
  const bodyMesh = new THREE.Mesh(droneBodyGeom, materials.car_paint);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);
  parts.push({
    mesh: bodyMesh,
    info: {
      id: 'drone_body',
      name: '流线装甲外壳',
      nameEn: 'Aero Coated Shell',
      role: 'car_paint',
      description: '高反光双层漆面装甲。',
      metalness: 0.15,
      roughness: 0.25,
      color: '#1d4ed8',
    },
  });
  heroMeshes.push(bodyMesh);

  // 4. Visor Lens: Optical Glass
  const lensGeom = new THREE.CylinderGeometry(0.34, 0.36, 0.16, 32);
  lensGeom.rotateX(Math.PI / 2);
  lensGeom.translate(0, 1.5, 0.9);
  const lensMesh = new THREE.Mesh(lensGeom, materials.glass);
  lensMesh.castShadow = true;
  group.add(lensMesh);
  parts.push({
    mesh: lensMesh,
    info: {
      id: 'drone_lens',
      name: '感应传感器视窗',
      nameEn: 'Optical Visor Glass',
      role: 'glass',
      description: '高折射光学玻璃，光晕与透镜折射反射并存。',
      metalness: 0.05,
      roughness: 0.04,
      color: '#e0f2fe',
    },
  });

  // 5. Gimbal Ring: Polished Brass
  const collarGeom = new THREE.TorusGeometry(1.18, 0.09, 16, 48);
  collarGeom.rotateX(Math.PI * 0.45);
  collarGeom.translate(0, 1.5, 0);
  const collarMesh = new THREE.Mesh(collarGeom, materials.brass);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);
  parts.push({
    mesh: collarMesh,
    info: {
      id: 'drone_gimbal',
      name: '云台黄铜稳定环',
      nameEn: 'Brass Gimbal Orbit Ring',
      role: 'brass',
      description: '高亮黄铜轴套环。',
      metalness: 0.95,
      roughness: 0.2,
      color: '#d4af37',
    },
  });

  return { group, parts, heroMeshes, height: 2.7 };
}

/**
 * Pedestal PBR Textures interface
 */
export interface PedestalTextures {
  albedo: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  metallic: THREE.CanvasTexture;
  ao: THREE.CanvasTexture;
}

/**
 * 5. Master Museum Exhibition Pedestal Stand with Realistic Multi-Tier Geometry & PBR Maps
 * Features:
 * - Tier 1: Heavy Chamfered Base Sub-Plinth (Volcanic Basalt / Carrara Marble / Anodized Titanium)
 * - Tier 2: Recessed Shadow Gap with Perimeter LED Accent Groove (Subtle Light Channel)
 * - Tier 3: CNC Machined Brushed Brass / Titanium Chamfer Collar Ring
 * - Tier 4: Precision Top Presentation Disc with Micro-PBR Maps (Radial Tooling, 360° Dial, Mineral Veins)
 * - Tier 5: 6x Knurled Perimeter Hex Fastener Studs / Rosettes
 * - Tier 6: Intermediate Stepped Riser Collar
 * - Tier 7: Anti-slip Vulcanized Rubber / Gasket Ring
 * - Tier 8: Quenched Tool Steel Support Spindle with Grip Knurling
 * - Tier 9: Universal Swivel Ball Joint (Chrome / Gold)
 */
export function createHelmetMuseumStand(
  materials: MaterialsPalette,
  style: PedestalStyle = 'obsidianGold',
  textures?: PedestalTextures
): ProceduralModelBundle {
  const group = new THREE.Group();
  group.name = 'MasterPedestalStandModel';

  const parts: ModelPartRecord[] = [];
  const heroMeshes: THREE.Mesh[] = [];

  // --- Tier 1: Heavy Architectural Sub-Plinth (Base Foundation) ---
  const baseGeom = new THREE.CylinderGeometry(1.65, 1.78, 0.22, 64);
  baseGeom.translate(0, 0.11, 0);
  const baseMat = materials.wood;
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);
  parts.push({
    mesh: baseMesh,
    info: {
      id: 'pedestal_base_plinth',
      name: '黑曜玄武岩重型展台底座',
      nameEn: 'Obsidian Basalt Display Plinth',
      role: 'wood',
      description: '画廊大师级展台厚重基础座，微倒角工艺与天然矿物漫反射。',
      metalness: 0.05,
      roughness: 0.58,
      color: '#181a20',
    },
  });

  // --- Tier 2: Recessed Shadow Gap with Perimeter LED Accent Groove ---
  // A narrow recessed channel (radius 1.52m, height 0.06m) creating realistic ambient crevice occlusion
  const shadowGapGeom = new THREE.CylinderGeometry(1.52, 1.52, 0.06, 64);
  shadowGapGeom.translate(0, 0.25, 0);
  const shadowGapMesh = new THREE.Mesh(shadowGapGeom, materials.rubber);
  shadowGapMesh.castShadow = true;
  shadowGapMesh.receiveShadow = true;
  group.add(shadowGapMesh);

  // Integrated Subtle LED Accent Light Slit
  const ledRingGeom = new THREE.TorusGeometry(1.54, 0.014, 16, 64);
  ledRingGeom.rotateX(Math.PI / 2);
  ledRingGeom.translate(0, 0.25, 0);
  const ledGlowColor = new THREE.Color(0x67e8f9);
  const ledMat = new THREE.MeshStandardMaterial({
    color: ledGlowColor,
    emissive: ledGlowColor,
    emissiveIntensity: 0.65,
    roughness: 0.1,
    metalness: 0.2,
  });
  const ledMesh = new THREE.Mesh(ledRingGeom, ledMat);
  group.add(ledMesh);

  // --- Tier 3: CNC Machined Brushed Brass / Titanium Chamfer Collar Ring ---
  // Beveled metal collar ring (radius 1.42m top, 1.56m bottom, height 0.14m)
  const collarGeom = new THREE.CylinderGeometry(1.42, 1.56, 0.14, 64);
  collarGeom.translate(0, 0.35, 0);
  const collarMat = materials.brass;
  const collarMesh = new THREE.Mesh(collarGeom, collarMat);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);
  parts.push({
    mesh: collarMesh,
    info: {
      id: 'pedestal_brass_collar',
      name: '黄铜 CNC 高精倒角台环',
      nameEn: 'Brushed Brass Chamfer Collar',
      role: 'brass',
      description: '45° 倒角高光切面，冷热双色温光源下呈现极具层次感的各向异性金属反射。',
      metalness: 0.95,
      roughness: 0.22,
      color: '#d4af37',
    },
  });

  // --- Tier 4: Precision Top Presentation Disc with Full PBR Maps ---
  // The main presentation stage disc (radius 1.4m, height 0.07m)
  const discGeom = new THREE.CylinderGeometry(1.38, 1.42, 0.07, 64);
  discGeom.translate(0, 0.455, 0);

  // Dedicated physical PBR material for the top disc using generated 1024x1024 PBR maps
  const topDiscMat = textures
    ? new THREE.MeshPhysicalMaterial({
        map: textures.albedo,
        normalMap: textures.normal,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughnessMap: textures.roughness,
        metalnessMap: textures.metallic,
        aoMap: textures.ao,
        aoMapIntensity: 1.25,
        roughness: 0.38,
        metalness: 0.25,
        clearcoat: 0.45,
        clearcoatRoughness: 0.08,
      })
    : materials.wood;

  const discMesh = new THREE.Mesh(discGeom, topDiscMat);
  discMesh.castShadow = true;
  discMesh.receiveShadow = true;
  group.add(discMesh);
  heroMeshes.push(discMesh);
  parts.push({
    mesh: discMesh,
    info: {
      id: 'pedestal_top_disc',
      name: '黑曜金嵌金纹理展示台板',
      nameEn: 'Gold-Inlaid Obsidian Presentation Disc',
      role: 'wood',
      description: '配备完整 1024×1024 PBR 贴图（固有色、法线微凹凸、粗糙度磨损图、金属遮罩与微暗部 AO）。',
      metalness: 0.2,
      roughness: 0.32,
      color: '#d4af37',
    },
  });

  // --- Tier 5: 6x Knurled Perimeter Fastener Studs / Hex Bolts ---
  // High-precision machined fastening studs evenly spaced along radius 1.26m
  const boltGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 6);
  boltGeom.translate(0, 0.51, 0);
  const boltMat = materials.brass;
  const boltGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const bx = Math.cos(angle) * 1.26;
    const bz = Math.sin(angle) * 1.26;
    const boltMesh = new THREE.Mesh(boltGeom, boltMat);
    boltMesh.position.set(bx, 0, bz);
    boltMesh.rotation.y = angle + 0.3;
    boltMesh.castShadow = true;
    boltMesh.receiveShadow = true;
    boltGroup.add(boltMesh);
  }
  group.add(boltGroup);
  const repBolt = boltGroup.children[0] as THREE.Mesh;
  parts.push({
    mesh: repBolt,
    info: {
      id: 'pedestal_hex_bolts',
      name: '黄铜加固铆钉饰件 (6枚)',
      nameEn: 'Precision Knurled Fastener Studs',
      role: 'brass',
      description: '六角机械结构在点光源与面光源照射下形成极锐利的微高光。',
      metalness: 0.98,
      roughness: 0.18,
      color: '#ca8a04',
    },
  });

  // --- Tier 6: Upper Stepped Riser Collar & Gilded Accent Ring ---
  const riserGeom = new THREE.CylinderGeometry(0.92, 1.08, 0.16, 48);
  riserGeom.translate(0, 0.57, 0);
  const riserMat = materials.dark_steel;
  const riserMesh = new THREE.Mesh(riserGeom, riserMat);
  riserMesh.castShadow = true;
  riserMesh.receiveShadow = true;
  group.add(riserMesh);

  const riserRingGeom = new THREE.TorusGeometry(0.95, 0.03, 16, 48);
  riserRingGeom.rotateX(Math.PI / 2);
  riserRingGeom.translate(0, 0.65, 0);
  const riserRingMesh = new THREE.Mesh(riserRingGeom, materials.gold_trim);
  riserRingMesh.castShadow = true;
  group.add(riserRingMesh);

  // --- Tier 7: Anti-slip Damping Rubber Gasket Ring ---
  const gasketGeom = new THREE.TorusGeometry(0.72, 0.035, 16, 48);
  gasketGeom.rotateX(Math.PI / 2);
  gasketGeom.translate(0, 0.67, 0);
  const gasketMesh = new THREE.Mesh(gasketGeom, materials.rubber);
  gasketMesh.castShadow = true;
  group.add(gasketMesh);

  // --- Tier 8: Central Quenched Tool Steel Support Spindle ---
  // Tapered column shaft with knurled adjustment collar
  const spindleGeom = new THREE.CylinderGeometry(0.32, 0.44, 0.48, 36);
  spindleGeom.translate(0, 0.91, 0);
  const spindleMesh = new THREE.Mesh(spindleGeom, materials.dark_steel);
  spindleMesh.castShadow = true;
  spindleMesh.receiveShadow = true;
  group.add(spindleMesh);
  parts.push({
    mesh: spindleMesh,
    info: {
      id: 'pedestal_central_spindle',
      name: '淬火精钢支撑主轴',
      nameEn: 'Hardened Steel Support Spindle',
      role: 'dark_steel',
      description: '重载精密支撑轴，微哑光黑化精钢防腐处理。',
      metalness: 0.9,
      roughness: 0.32,
      color: '#27272a',
    },
  });

  // --- Tier 9: Universal Swivel Ball Joint & Specular Chrome Mount ---
  const ballGeom = new THREE.SphereGeometry(0.24, 32, 32);
  ballGeom.translate(0, 1.18, 0);
  const ballMat = materials.chrome;
  const ballMesh = new THREE.Mesh(ballGeom, ballMat);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  group.add(ballMesh);
  parts.push({
    mesh: ballMesh,
    info: {
      id: 'pedestal_ball_joint',
      name: '全向多角度阻尼万向球',
      nameEn: 'Specular Damping Swivel Joint',
      role: 'chrome',
      description: '镜面镀铬球形铰链，100% 导体倒映全景摄影棚柔光箱与环境天幕。',
      metalness: 1.0,
      roughness: 0.04,
      color: '#ffffff',
    },
  });

  return { group, parts, heroMeshes, height: 2.8 };
}

