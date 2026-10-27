/**
 * Lumina 3D - Procedural Texture and Environment Map Generators
 * 100% zero-dependency procedural textures (no external 404s)
 */

import * as THREE from 'three';

/**
 * Generates an ambient occlusion texture with micro-crevice darkening
 */
export function generateProceduralAoTexture(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base white (no occlusion)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw simulated panel grooves and seam occlusions
  const numGrooves = 16;
  const step = height / numGrooves;

  for (let i = 0; i < numGrooves; i++) {
    const y = i * step + step * 0.5;

    // Dark crevice center
    const gradient = ctx.createLinearGradient(0, y - 8, 0, y + 8);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.35, 'rgba(120, 120, 120, 1)');
    gradient.addColorStop(0.5, 'rgba(30, 30, 30, 1)');
    gradient.addColorStop(0.65, 'rgba(120, 120, 120, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - 8, width, 16);
  }

  // Corner cavity vignette
  const radial = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.2,
    width * 0.5,
    height * 0.5,
    width * 0.65
  );
  radial.addColorStop(0, 'rgba(255, 255, 255, 1)');
  radial.addColorStop(0.8, 'rgba(255, 255, 255, 0.9)');
  radial.addColorStop(1, 'rgba(150, 150, 150, 0.6)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Micro surface noise for realistic grit
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace; // Data map in linear space
  return texture;
}

/**
 * Generates normal map for brushed micro-scratches or carbon weave
 */
export function generateProceduralNormalTexture(
  type: 'brushed' | 'weave' | 'noise' = 'brushed',
  width = 512,
  height = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Flat normal base (RGB 128, 128, 255 = normal pointing straight out Z)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  if (type === 'brushed') {
    // Horizontal brushed lines
    for (let y = 0; y < height; y++) {
      const lineStrength = (Math.random() - 0.5) * 35;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const microNoise = (Math.random() - 0.5) * 10;
        data[idx] = Math.min(255, Math.max(0, 128 + lineStrength + microNoise)); // X tangent
        data[idx + 1] = Math.min(255, Math.max(0, 128 + microNoise * 0.5)); // Y bitangent
        data[idx + 2] = 250; // Z normal
      }
    }
  } else if (type === 'weave') {
    // Carbon fiber twill weave pattern
    const tileSize = 16;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const cx = Math.floor(x / tileSize) % 2;
        const cy = Math.floor(y / tileSize) % 2;
        const isHorizontal = (cx + cy) % 2 === 0;

        const subX = (x % tileSize) / tileSize - 0.5;
        const subY = (y % tileSize) / tileSize - 0.5;

        const slope = isHorizontal ? subX * 80 : subY * 80;
        data[idx] = Math.min(255, Math.max(0, 128 + (isHorizontal ? slope : 0)));
        data[idx + 1] = Math.min(255, Math.max(0, 128 + (!isHorizontal ? slope : 0)));
        data[idx + 2] = 230;
      }
    }
  } else {
    // Subtle granite / concrete normal noise
    for (let i = 0; i < data.length; i += 4) {
      const nx = (Math.random() - 0.5) * 40;
      const ny = (Math.random() - 0.5) * 40;
      data[i] = Math.min(255, Math.max(0, 128 + nx));
      data[i + 1] = Math.min(255, Math.max(0, 128 + ny));
      data[i + 2] = 245;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Generates custom procedural Studio / Sunset / Industrial / Night Equirectangular Environment Texture
 */
export function generateProceduralEnvironmentTexture(
  preset: string = 'studio',
  width = 1024,
  height = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  if (preset === 'studio') {
    // Dark studio gradient backdrop with 2 bright overhead rectangular softboxes
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#12141a');
    bgGrad.addColorStop(0.5, '#1e222e');
    bgGrad.addColorStop(1, '#0d0f14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Key softbox 1 (Top-Left)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 40;
    ctx.fillRect(width * 0.15, height * 0.15, width * 0.22, height * 0.25);

    // Warm Fill softbox 2 (Top-Right)
    ctx.fillStyle = '#fff4e6';
    ctx.shadowColor = '#ffe8cc';
    ctx.shadowBlur = 30;
    ctx.fillRect(width * 0.65, height * 0.2, width * 0.18, height * 0.2);

    // Cool rim strip light (Back edge)
    ctx.fillStyle = '#d0e1fd';
    ctx.shadowColor = '#9ec5fe';
    ctx.shadowBlur = 20;
    ctx.fillRect(width * 0.42, height * 0.05, width * 0.16, height * 0.08);
  } else if (preset === 'sunset') {
    // Golden hour warm dusk environment
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#2d1b4e'); // Purple dusk zenith
    bgGrad.addColorStop(0.4, '#c2410c'); // Deep amber orange
    bgGrad.addColorStop(0.52, '#fbbf24'); // Bright sun glow horizon
    bgGrad.addColorStop(0.65, '#451a03'); // Earth ground bounce
    bgGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Blazing golden sun disk
    const sunGrad = ctx.createRadialGradient(
      width * 0.25,
      height * 0.48,
      10,
      width * 0.25,
      height * 0.48,
      120
    );
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.2, '#fed7aa');
    sunGrad.addColorStop(0.6, '#f97316');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(width * 0.1, height * 0.25, width * 0.3, height * 0.45);
  } else if (preset === 'industrial') {
    // Cool metallic factory with high-contrast overhead strip fixtures
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#334155');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Multiple fluorescent tube lights
    ctx.fillStyle = '#e0f2fe';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 25;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(width * (0.1 + i * 0.22), height * 0.12, width * 0.12, height * 0.04);
    }
  } else if (preset === 'night') {
    // Deep obsidian cyberpunk night with neon blue and magenta rim highlights
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    // Cyan key glow
    const cyanGlow = ctx.createRadialGradient(
      width * 0.2,
      height * 0.3,
      10,
      width * 0.2,
      height * 0.3,
      180
    );
    cyanGlow.addColorStop(0, '#67e8f9');
    cyanGlow.addColorStop(0.4, '#06b6d4');
    cyanGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = cyanGlow;
    ctx.fillRect(0, 0, width * 0.5, height * 0.7);

    // Magenta rim glow
    const magGlow = ctx.createRadialGradient(
      width * 0.8,
      height * 0.35,
      10,
      width * 0.8,
      height * 0.35,
      160
    );
    magGlow.addColorStop(0, '#f472b6');
    magGlow.addColorStop(0.4, '#db2777');
    magGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = magGlow;
    ctx.fillRect(width * 0.5, 0, width * 0.5, height * 0.7);
  } else {
    // Whitebox / Clean architectural photography studio
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.5, '#e2e8f0');
    bgGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 50;
    ctx.fillRect(width * 0.3, height * 0.1, width * 0.4, height * 0.3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates procedural ground contact shadow radial gradient
 */
export function generateContactShadowTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, size * 0.05, center, center, size * 0.48);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.25, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Generates procedural wood grain texture (Walnut / Mahogany)
 */
export function generateProceduralWoodTexture(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base warm dark wood
  ctx.fillStyle = '#451a03'; // Warm mahogany / dark walnut
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Wood growth rings & wavy fibers algorithm
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      // Distorted distance to simulated tree center offset
      const dx = (nx - 0.25) * 2.0;
      const dy = (ny - 0.5) * 8.0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Annual growth rings frequency with harmonic waviness
      const ring = Math.sin(dist * 45 + Math.sin(ny * 25) * 1.5 + Math.cos(nx * 15) * 0.8);
      const ringFactor = (ring + 1) * 0.5; // 0 to 1

      // Fine longitudinal wood fiber noise
      const fiber = (Math.random() - 0.5) * 20;

      // Blend wood tones: dark amber (#542308) to warm golden walnut (#854d0e)
      const r = Math.min(255, Math.max(0, 85 + ringFactor * 55 + fiber));
      const g = Math.min(255, Math.max(0, 45 + ringFactor * 35 + fiber * 0.6));
      const b = Math.min(255, Math.max(0, 18 + ringFactor * 18 + fiber * 0.3));

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates procedural marble texture (Carrara White with delicate grey veins)
 */
export function generateProceduralMarbleTexture(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Off-white base
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Marble veining turbulence simulation
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      // Sine wave with turbulence
      const veinPattern =
        Math.sin(nx * 8 + Math.sin(ny * 12) * 2.2 + Math.cos((nx + ny) * 16) * 1.2) * 0.5 + 0.5;

      const isVein = Math.pow(veinPattern, 6); // Sharpen veins
      const darkness = isVein * 110;
      const microNoise = (Math.random() - 0.5) * 6;

      const baseVal = 242 - darkness + microNoise;
      data[idx] = Math.min(255, Math.max(0, baseVal));
      data[idx + 1] = Math.min(255, Math.max(0, baseVal - 3)); // slightly cool
      data[idx + 2] = Math.min(255, Math.max(0, baseVal + 2));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

import { PedestalStyle } from '../types/rendering';

/**
 * Generates ultra-high fidelity 1024x1024 Albedo PBR map for museum and engineering pedestals
 */
export function generatePedestalAlbedoTexture(
  style: PedestalStyle = 'obsidianGold',
  width = 1024,
  height = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = width / 2;
  const cy = height / 2;

  // Obsidian & Brushed Gold Master Plinth
  // Deep volcanic basalt stone with golden calcite mineral veins and luxury brass inlays
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.5);
  bgGrad.addColorStop(0, '#181a20');
  bgGrad.addColorStop(0.65, '#111317');
  bgGrad.addColorStop(0.9, '#0b0c0f');
  bgGrad.addColorStop(1, '#050608');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Natural obsidian fine mineral speckling & golden calcite veins
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      // Mineral crystalline grain
      const grain = (Math.random() - 0.5) * 14;

      // Branching gold calcite vein pattern
      const v = Math.sin(nx * 12 + Math.sin(ny * 15) * 3.2 + Math.cos((nx + ny) * 10) * 1.8);
      const isVein = Math.pow((v + 1) * 0.5, 12); // Narrow crack veins

      if (isVein > 0.08) {
        const goldFactor = Math.min(1.0, isVein * 1.8);
        data[idx] = Math.min(255, data[idx] + goldFactor * 190);
        data[idx + 1] = Math.min(255, data[idx + 1] + goldFactor * 150);
        data[idx + 2] = Math.min(255, data[idx + 2] + goldFactor * 45);
      } else {
        data[idx] = Math.min(255, Math.max(0, data[idx] + grain));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain + 2));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Double Inlaid 24K Brushed Gold Border Rings
  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.44, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.435, 0, Math.PI * 2);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner Concentric Brass Accent Line
  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.32, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 12 Classical Perimeter Gilded Rosette Alignment Marks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rx = cx + Math.cos(a) * (width * 0.38);
    const ry = cy + Math.sin(a) * (width * 0.38);
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates Tangent-Space Normal PBR Map for Pedestals
 * Produces genuine radial anisotropic brushed rings and micro-stone pitted bump
 */
export function generatePedestalNormalTexture(
  style: PedestalStyle = 'obsidianGold',
  width = 1024,
  height = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Flat normal base (128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const idx = (y * width + x) * 4;

      // 1. Concentric Radial Tooling Grooves (creates genuine anisotropic circular highlight!)
      const radialFreq = 0.45;
      const radialWave = Math.sin(dist * radialFreq) * 18;
      // Normal perturbation is orthogonal to concentric ring
      const nxRadial = -Math.cos(angle) * radialWave;
      const nyRadial = -Math.sin(angle) * radialWave;

      // 2. Micro-surface mineral pitting / granite chiseled relief
      const microNoise = (Math.random() - 0.5) * 16;
      const microNy = (Math.random() - 0.5) * 16;

      // 3. Beveled rim ridge normals
      let rimNormalX = 0;
      let rimNormalY = 0;
      const rimRadius = width * 0.44;
      if (Math.abs(dist - rimRadius) < 6) {
        const rimSlope = (dist - rimRadius) * 6;
        rimNormalX = Math.cos(angle) * rimSlope;
        rimNormalY = Math.sin(angle) * rimSlope;
      }

      data[idx] = Math.min(255, Math.max(0, 128 + nxRadial + microNoise + rimNormalX));
      data[idx + 1] = Math.min(255, Math.max(0, 128 + nyRadial + microNy + rimNormalY));
      data[idx + 2] = 245; // Z normal pointing mostly out
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Generates Roughness PBR map for Pedestals
 * Accurately models polished brass/gold inlays, micro-abrasions, and matte stone
 */
export function generatePedestalRoughnessTexture(
  style: PedestalStyle = 'obsidianGold',
  width = 1024,
  height = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = width / 2;
  const cy = height / 2;

  // Base stone roughness (~0.42 to 0.55)
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * width + x) * 4;

      // Noise variation for fingerprint oil and handling wear
      const noise = (Math.random() - 0.5) * 20;
      let roughnessVal = 105 + noise; // ~0.41

      // Central polished presentation stage (smoother reflection)
      if (dist < width * 0.3) {
        roughnessVal = 60 + noise * 0.5; // ~0.24 (high gloss reflection)
      }

      // Inlaid gold/brass metal ring is polished smooth (low roughness)
      const ringRadius = width * 0.44;
      if (Math.abs(dist - ringRadius) < 8) {
        roughnessVal = 35 + Math.random() * 8; // ~0.14 (mirror-like gold sheen)
      }

      // Crevices and edge bevels have higher micro-dust roughness
      if (Math.abs(dist - (ringRadius + 8)) < 4 || Math.abs(dist - (ringRadius - 8)) < 4) {
        roughnessVal = 180; // ~0.70
      }

      data[idx] = Math.min(255, Math.max(0, roughnessVal));
      data[idx + 1] = data[idx];
      data[idx + 2] = data[idx];
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Generates Metallic Mask PBR Map for Pedestals
 * Conductor (1.0 = 255) for brass, gold, and titanium inlays; Dielectric (0.0 = 0) for stone/marble
 */
export function generatePedestalMetallicTexture(
  style: PedestalStyle = 'obsidianGold',
  width = 1024,
  height = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = width / 2;
  const cy = height / 2;

  // Base stone/dielectric is 0 (pure black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Inlaid Gold/Brass Rings (100% metalness = pure white 255)
  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.44, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.32, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 12 Rosettes / Bolt inlays
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rx = cx + Math.cos(a) * (width * 0.38);
    const ry = cy + Math.sin(a) * (width * 0.38);
    ctx.beginPath();
    ctx.arc(rx, ry, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Generates Ambient Occlusion PBR Map for Pedestals
 * Contact crevice darkening under collars and chamfers
 */
export function generatePedestalAoTexture(width = 1024, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = width / 2;
  const cy = height / 2;

  // Base white (no occlusion)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Occlusion under the central spindle & upper riser
  const centerAo = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.22);
  centerAo.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
  centerAo.addColorStop(0.4, 'rgba(80, 80, 80, 0.5)');
  centerAo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = centerAo;
  ctx.fillRect(0, 0, width, height);

  // Shadow groove around the outer brass collar
  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.44 + 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.7)';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, width * 0.44 - 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

