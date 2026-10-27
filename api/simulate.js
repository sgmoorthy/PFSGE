function boxMullerRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function gaussianSmooth(arr, sigma = 2) {
  const radius = Math.ceil(sigma * 3);
  const kernel = [];
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(val);
    sum += val;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  const result = new Array(arr.length).fill(0);
  for (let i = 0; i < arr.length; i++) {
    let acc = 0;
    for (let k = -radius; k <= radius; k++) {
      const idx = Math.min(Math.max(i + k, 0), arr.length - 1);
      acc += arr[idx] * kernel[k + radius];
    }
    result[i] = acc;
  }
  return result;
}

function findPeaks(arr, prominenceThreshold = 0.05) {
  const peaks = [];
  const maxVal = Math.max(...arr);
  const minProminence = maxVal * prominenceThreshold;

  for (let i = 1; i < arr.length - 1; i++) {
    if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1] && arr[i] >= minProminence) {
      peaks.push(i);
    }
  }
  return peaks;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const n_particles = Math.min(Math.max(parseInt(body.n_particles ?? 200), 10), 2000);
    const n_steps = Math.min(Math.max(parseInt(body.n_steps ?? 1000), 50), 5000);
    const dt = parseFloat(body.dt ?? 0.05);
    const field_magnitude = parseFloat(body.field_magnitude ?? 2.0);
    const field_frequency = parseFloat(body.field_frequency ?? 0.5);
    const zeta_0 = parseFloat(body.zeta_0 ?? 1.0);
    const alpha = parseFloat(body.alpha ?? 0.02);
    const noise_strength = parseFloat(body.noise_strength ?? 0.2);
    const charge = parseFloat(body.charge ?? 1.0);

    // Initialize particles near origin (x, y)
    const positions = new Float64Array(n_particles * 2);
    for (let i = 0; i < n_particles; i++) {
      positions[i * 2] = boxMullerRandom() * 0.01;
      positions[i * 2 + 1] = boxMullerRandom() * 0.01;
    }

    const sqrtDt = Math.sqrt(dt);

    for (let step = 1; step < n_steps; step++) {
      const t = (step - 1) * dt;
      const Ex = field_magnitude * Math.cos(field_frequency * t);
      const Ey = field_magnitude * Math.sin(field_frequency * t);

      for (let i = 0; i < n_particles; i++) {
        const x = positions[i * 2];
        const y = positions[i * 2 + 1];
        const r_sq = x * x + y * y;
        const local_zeta = zeta_0 * (1 + alpha * r_sq);

        const drift_x = (charge * Ex) / local_zeta;
        const drift_y = (charge * Ey) / local_zeta;

        const noise_std = noise_strength / Math.sqrt(local_zeta);
        const nx = boxMullerRandom() * noise_std * sqrtDt;
        const ny = boxMullerRandom() * noise_std * sqrtDt;

        positions[i * 2] = x + drift_x * dt + nx;
        positions[i * 2 + 1] = y + drift_y * dt + ny;
      }
    }

    // Terminal radii
    const radii = new Float64Array(n_particles);
    let maxR = 0.001;
    let sumR = 0;
    for (let i = 0; i < n_particles; i++) {
      const r = Math.sqrt(positions[i * 2] * positions[i * 2] + positions[i * 2 + 1] * positions[i * 2 + 1]);
      radii[i] = r;
      if (r > maxR) maxR = r;
      sumR += r;
    }

    const meanR = sumR / n_particles;
    let varR = 0;
    for (let i = 0; i < n_particles; i++) {
      varR += (radii[i] - meanR) * (radii[i] - meanR);
    }
    varR /= n_particles;

    // Histogram
    const n_bins = 100;
    const hist = new Array(n_bins).fill(0);
    const binWidth = maxR / n_bins;
    for (let i = 0; i < n_particles; i++) {
      let b = Math.floor(radii[i] / binWidth);
      if (b >= n_bins) b = n_bins - 1;
      hist[b]++;
    }

    // Convert to density: hist[b] / (n_particles * binWidth)
    const densities = hist.map(h => h / (n_particles * binWidth));
    const bin_centers = hist.map((_, i) => (i + 0.5) * binWidth);

    const smoothed = gaussianSmooth(densities, 2);
    const peakIndices = findPeaks(smoothed, 0.05);
    const peak_positions = peakIndices.map(idx => bin_centers[idx]);

    // Sample final trajectory coordinates for 2D visualization
    const sampled_positions = [];
    const sampleCount = Math.min(n_particles, 300);
    for (let i = 0; i < sampleCount; i++) {
      sampled_positions.push({
        x: positions[i * 2],
        y: positions[i * 2 + 1],
        r: radii[i]
      });
    }

    return res.status(200).json({
      bin_centers,
      densities,
      smoothed_densities: smoothed,
      peak_indices: peakIndices,
      peak_positions,
      radial_variance: varR,
      mean_radius: meanR,
      particles: sampled_positions
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
