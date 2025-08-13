import { config } from "../config/galaxyConfig.js";

// Simple Perlin noise for variation
function perlinNoise(x, y, scale, seed) {
  const rand = (seed) => {
    const value = Math.sin(seed * 127.1 + x * 11.3 + y * 7.7) * 43758.5453;
    return value - Math.floor(value);
  };
  x *= scale;
  y *= scale;
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;
  const fx = x - x0;
  const fy = y - y0;
  const n00 = rand(seed + x0 + y0 * 57);
  const n01 = rand(seed + x0 + y1 * 57);
  const n10 = rand(seed + x1 + y0 * 57);
  const n11 = rand(seed + x1 + y1 * 57);
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const nx0 = n00 + u * (n10 - n00);
  const nx1 = n01 + u * (n11 - n01);
  return nx0 + v * (nx1 - nx0);
}

export function generateSpiralArray(width, height) {
  const data = Array(height).fill().map(() => Array(width).fill(0));
  const seed = Math.random() * 1000; // Random seed for variation
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;

  // Config parameters
  const armCount = config.ARMS;
  const armPitch = config.ARM_PITCH;
  const spiral = config.SPIRAL;
  const coreXDist = config.CORE_X_DIST / config.OUTER_CORE_X_DIST; // Normalize for array scale
  const coreYDist = config.CORE_Y_DIST / config.OUTER_CORE_Y_DIST; // Normalize for array scale
  const outerCoreXDist = config.OUTER_CORE_X_DIST / config.OUTER_CORE_X_DIST; // Scale factor
  const outerCoreYDist = config.OUTER_CORE_Y_DIST / config.OUTER_CORE_Y_DIST; // Scale factor
  const armXDist = config.ARM_X_DIST / config.OUTER_CORE_X_DIST;
  const armYDist = config.ARM_Y_DIST / config.OUTER_CORE_Y_DIST;
  const armXMean = config.ARM_X_MEAN / config.OUTER_CORE_X_DIST;
  const armYMean = config.ARM_Y_MEAN / config.OUTER_CORE_Y_DIST;
  const barLength = config.BAR_LENGTH / config.OUTER_CORE_X_DIST;
  const barWidth = config.BAR_WIDTH / config.OUTER_CORE_Y_DIST;
  const haloRadius = config.HALO_RADIUS / config.OUTER_CORE_X_DIST;
  const haloDensity = config.HALO_DENSITY;
  const nebulaDensity = config.NEBULA_DENSITY;
  const nebulaScale = (config.NEBULA_SCALE_MIN + config.NEBULA_SCALE_MAX) / 2 / 10; // Normalize for noise
  const starSizeVariance = config.STAR_SIZE_VARIANCE;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / maxRadius;
      const dy = (y - centerY) / maxRadius;
      const radius = Math.sqrt(dx * dx * outerCoreXDist + dy * dy * outerCoreYDist);
      const angle = Math.atan2(dy, dx);

      // Logarithmic spiral for arms
      const armAngle = angle * armCount + radius * spiral / armPitch;
      const spiralIntensity = Math.cos(armAngle) * Math.exp(-radius / (armXMean + armYMean));
      const armInfluence = Math.exp(-(dx * dx) / (2 * armXDist * armXDist) - (dy * dy) / (2 * armYDist * armYDist));

      // Core intensity
      const coreInfluence = Math.exp(-(dx * dx) / (2 * coreXDist * coreXDist) - (dy * dy) / (2 * coreYDist * coreYDist));

      // Bar intensity
      const barInfluence = Math.abs(dx) < barLength / 2 && Math.abs(dy) < barWidth / 2 ? 1 : 0;

      // Halo intensity
      const haloInfluence = radius < haloRadius ? haloDensity * Math.exp(-radius / haloRadius) : 0;

      // Noise for nebulae and star variation
      const noise = perlinNoise(x, y, nebulaScale * 0.05, seed) * nebulaDensity * (1 + starSizeVariance);

      // Combine intensities
      let intensity = (
        spiralIntensity * armInfluence * 0.4 + // Spiral arms
        coreInfluence * 0.3 + // Central core
        barInfluence * 0.2 + // Central bar
        haloInfluence * 0.1 + // Halo
        noise // Nebulae and star variation
      );

      data[y][x] = Math.min(1, Math.max(0, intensity)); // Clamp to [0, 1]
      //data[y][x] = intensity > 0.5 ? 1 : 0; // binary mask instead of brightness
      //data[y][x] = 0;

    }
  }

  return { data, width, height };
}