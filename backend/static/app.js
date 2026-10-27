// ========================================================
// PFSGE: PULSED-FIELD SPIRAL GEL ELECTROPHORESIS PLATFORM
// Client-side Computational Engine & Visualization Suite
// ========================================================

// --------------------------------------------------------
// 1. NAVIGATION & TAB SWITCHING
// --------------------------------------------------------
function switchTab(tabId) {
  const tabs = ['interpreter', 'simulation', 'dispenser', 'theory'];
  tabs.forEach(t => {
    const pane = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (pane) pane.classList.remove('active');
    if (btn) btn.classList.remove('active');
  });

  const activePane = document.getElementById(`tab-${tabId}`);
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activePane) activePane.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');

  // Trigger chart resize if rendered
  if (tabId === 'interpreter' && chartInterpreter) chartInterpreter.resize();
  if (tabId === 'simulation' && chartSimulation) chartSimulation.resize();
  if (tabId === 'dispenser' && chartDispenser) {
    chartDispenser.resize();
    if (chartFlowRate) chartFlowRate.resize();
  }
}

// --------------------------------------------------------
// 2. MATHEMATICAL & ALGORITHMIC UTILITIES
// --------------------------------------------------------

// Box-Muller transform for standard normal distribution N(0, 1)
function boxMullerRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// 1D Gaussian kernel smoothing (identical to scipy.ndimage.gaussian_filter1d)
function gaussianSmooth(arr, sigma = 2.0) {
  if (arr.length === 0) return [];
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

// Peak detection with prominence threshold
function findPeaks(arr, prominenceThreshold = 0.05) {
  const peaks = [];
  if (arr.length < 3) return peaks;
  const maxVal = Math.max(...arr);
  if (maxVal <= 0) return peaks;
  const minProminence = maxVal * prominenceThreshold;

  for (let i = 1; i < arr.length - 1; i++) {
    if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1] && arr[i] >= minProminence) {
      peaks.push(i);
    }
  }
  return peaks;
}

// --------------------------------------------------------
// 3. IMAGE INTERPRETER & RADIAL DENSITY PROFILER
// --------------------------------------------------------
let gelCanvas = document.getElementById('gel-canvas');
let gelCtx = gelCanvas ? gelCanvas.getContext('2d') : null;
let gelImage = null;
let centerPoint = { x: 200, y: 200 };
let isDraggingCrosshair = false;
let chartInterpreter = null;
let lastAnalyzedInterpreterData = null;

// Initialize Drop Zone
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

if (dropzone && fileInput) {
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleImageFile(e.target.files[0]);
    }
  });
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file (PNG, JPG, TIFF, WebP).');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      gelImage = img;
      centerPoint = { x: img.width / 2, y: img.height / 2 };
      document.getElementById('gel-canvas-wrapper').style.display = 'flex';
      document.getElementById('canvas-toolbar').style.display = 'flex';
      drawGelImage();
      analyzeGelImageClientSide();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Generate Benchmark Synthetic Spiral Gel
function loadBenchmarkGel() {
  const size = 420;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = size;
  offCanvas.height = size;
  const ctx = offCanvas.getContext('2d');

  // Dark background with gradient noise
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Background radial luminescence
  const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, size * 0.45);
  radGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
  radGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.04)');
  radGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, size, size);

  // Spiral track simulation
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const cSpiral = 1.2;
  for (let theta = 0; theta < 40 * Math.PI; theta += 0.1) {
    const r = 12 + cSpiral * theta;
    if (r > size * 0.45) break;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    if (theta === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw 3 distinct concentrated DNA bands (concentric rings simulating separated molecular weights)
  const bands = [
    { r: 48, width: 7, intensity: 230, color: 'rgba(56, 189, 248, ' }, // 10 Mb fragment
    { r: 96, width: 9, intensity: 210, color: 'rgba(168, 85, 247, ' }, // 5 Mb fragment
    { r: 148, width: 11, intensity: 180, color: 'rgba(52, 211, 153, ' } // 1 Mb fragment
  ];

  bands.forEach(band => {
    for (let dr = -band.width; dr <= band.width; dr += 0.5) {
      const alpha = Math.exp(-(dr * dr) / (band.width * band.width * 0.35));
      ctx.beginPath();
      ctx.arc(cx, cy, band.r + dr, 0, 2 * Math.PI);
      ctx.strokeStyle = `${band.color}${alpha * (band.intensity / 255)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  // Add random speckle/noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const img = new Image();
  img.onload = () => {
    gelImage = img;
    centerPoint = { x: cx, y: cy };
    document.getElementById('gel-canvas-wrapper').style.display = 'flex';
    document.getElementById('canvas-toolbar').style.display = 'flex';
    drawGelImage();
    analyzeGelImageClientSide();
  };
  img.src = offCanvas.toDataURL();
}

function drawGelImage() {
  if (!gelImage || !gelCanvas) return;
  const maxUIWidth = 400;
  const scale = Math.min(1, maxUIWidth / gelImage.width);

  gelCanvas.width = gelImage.width * scale;
  gelCanvas.height = gelImage.height * scale;

  gelCtx.drawImage(gelImage, 0, 0, gelCanvas.width, gelCanvas.height);

  // Draw Crosshair
  const drawX = centerPoint.x * scale;
  const drawY = centerPoint.y * scale;

  gelCtx.strokeStyle = '#f43f5e';
  gelCtx.lineWidth = 2;

  // Cross lines
  gelCtx.beginPath();
  gelCtx.moveTo(drawX - 22, drawY);
  gelCtx.lineTo(drawX + 22, drawY);
  gelCtx.moveTo(drawX, drawY - 22);
  gelCtx.lineTo(drawX, drawY + 22);
  gelCtx.stroke();

  // Concentric circle
  gelCtx.beginPath();
  gelCtx.arc(drawX, drawY, 12, 0, 2 * Math.PI);
  gelCtx.stroke();
}

function resetGelCenter() {
  if (!gelImage) return;
  centerPoint = { x: gelImage.width / 2, y: gelImage.height / 2 };
  drawGelImage();
  analyzeGelImageClientSide();
}

// Mouse & Touch events for Draggable Crosshair
if (gelCanvas) {
  function getCanvasCoords(e) {
    const rect = gelCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scale = gelImage.width / gelCanvas.width;
    return {
      x: Math.max(0, Math.min(gelImage.width, (clientX - rect.left) * scale)),
      y: Math.max(0, Math.min(gelImage.height, (clientY - rect.top) * scale))
    };
  }

  gelCanvas.addEventListener('mousedown', (e) => {
    isDraggingCrosshair = true;
    centerPoint = getCanvasCoords(e);
    drawGelImage();
    analyzeGelImageClientSide();
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingCrosshair) {
      centerPoint = getCanvasCoords(e);
      drawGelImage();
      analyzeGelImageClientSide();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingCrosshair) {
      isDraggingCrosshair = false;
      analyzeGelImageClientSide();
    }
  });

  // Touch handlers
  gelCanvas.addEventListener('touchstart', (e) => {
    isDraggingCrosshair = true;
    centerPoint = getCanvasCoords(e);
    drawGelImage();
    analyzeGelImageClientSide();
  }, { passive: false });

  gelCanvas.addEventListener('touchmove', (e) => {
    if (isDraggingCrosshair) {
      e.preventDefault();
      centerPoint = getCanvasCoords(e);
      drawGelImage();
      analyzeGelImageClientSide();
    }
  }, { passive: false });

  gelCanvas.addEventListener('touchend', () => {
    isDraggingCrosshair = false;
  });
}

function updateInterpreterThreshold(val) {
  document.getElementById('val-threshold').textContent = val;
  analyzeGelImageClientSide();
}

function updateInterpreterSmooth(val) {
  document.getElementById('val-smooth').textContent = parseFloat(val).toFixed(1);
  analyzeGelImageClientSide();
}

// Sub-millisecond Client-Side Radial Intensity Profiling
function analyzeGelImageClientSide() {
  if (!gelImage) return;

  // Use offscreen canvas to sample original pixels
  const offCanvas = document.createElement('canvas');
  offCanvas.width = gelImage.width;
  offCanvas.height = gelImage.height;
  const offCtx = offCanvas.getContext('2d');
  offCtx.drawImage(gelImage, 0, 0);

  const imgData = offCtx.getImageData(0, 0, gelImage.width, gelImage.height).data;
  const width = gelImage.width;
  const height = gelImage.height;

  const threshold = parseFloat(document.getElementById('filter-threshold').value || 15);
  const sigma = parseFloat(document.getElementById('filter-smooth').value || 2.0);

  const maxRadius = Math.sqrt(Math.max(centerPoint.x, width - centerPoint.x) ** 2 + Math.max(centerPoint.y, height - centerPoint.y) ** 2);
  const nBins = 100;
  const binWidth = maxRadius / nBins;

  const binSums = new Float64Array(nBins);
  const binCounts = new Float64Array(nBins);

  let totalWeight = 0;
  let weightedRadiusSum = 0;
  let weightedRadiusSqSum = 0;

  // Pixel traversal (sub-sampled for ultra-smooth 60fps drag performance)
  const step = Math.max(1, Math.floor(Math.min(width, height) / 300));
  for (let y = 0; y < height; y += step) {
    const dy = y - centerPoint.y;
    const dySq = dy * dy;
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x += step) {
      const idx = rowOffset + x * 4;
      // Grayscale intensity
      const intensity = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];

      if (intensity > threshold) {
        const dx = x - centerPoint.x;
        const r = Math.sqrt(dx * dx + dySq);
        let b = Math.floor(r / binWidth);
        if (b >= nBins) b = nBins - 1;

        binSums[b] += intensity;
        binCounts[b]++;

        totalWeight += intensity;
        weightedRadiusSum += intensity * r;
        weightedRadiusSqSum += intensity * r * r;
      }
    }
  }

  // Densities (normalized)
  const densities = [];
  const binCenters = [];
  let maxDensity = 0;

  for (let i = 0; i < nBins; i++) {
    const density = binCounts[i] > 0 ? binSums[i] / (binCounts[i] * (i + 1)) : 0; // Area normalized
    densities.push(density);
    binCenters.push(parseFloat(((i + 0.5) * binWidth).toFixed(1)));
    if (density > maxDensity) maxDensity = density;
  }

  // Normalize densities to 0 - 100%
  const normDensities = maxDensity > 0 ? densities.map(d => (d / maxDensity) * 100) : densities;
  const smoothed = gaussianSmooth(normDensities, sigma);

  // Peak detection
  const peakIndices = findPeaks(smoothed, 0.08);
  const peakRadii = peakIndices.map(idx => binCenters[idx]);

  // Radial variance
  let variance = 0;
  if (totalWeight > 0) {
    const meanR = weightedRadiusSum / totalWeight;
    variance = (weightedRadiusSqSum / totalWeight) - (meanR * meanR);
  }

  lastAnalyzedInterpreterData = {
    binCenters,
    rawDensities: normDensities,
    smoothed,
    peakIndices,
    peakRadii,
    variance
  };

  // Update UI Stats
  document.getElementById('interp-peak-count').textContent = peakIndices.length;
  document.getElementById('interp-variance').textContent = Math.max(0, variance).toFixed(2);
  document.getElementById('interp-peak-radii').textContent = peakRadii.length > 0 ? peakRadii.join(', ') : 'None detected';

  renderInterpreterChart(binCenters, smoothed, peakIndices);
}

function renderInterpreterChart(labels, data, peakIndices) {
  const ctx = document.getElementById('chart-interpreter').getContext('2d');

  const pointBackgroundColors = data.map((_, i) => peakIndices.includes(i) ? '#f43f5e' : 'transparent');
  const pointRadii = data.map((_, i) => peakIndices.includes(i) ? 6 : 0);

  if (chartInterpreter) {
    chartInterpreter.data.labels = labels;
    chartInterpreter.data.datasets[0].data = data;
    chartInterpreter.data.datasets[0].pointBackgroundColor = pointBackgroundColors;
    chartInterpreter.data.datasets[0].pointRadius = pointRadii;
    chartInterpreter.update('none'); // fast update without animation
    return;
  }

  chartInterpreter = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Radial Integrated Intensity',
        data: data,
        borderColor: '#06b6d4',
        borderWidth: 2.5,
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: pointRadii
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { family: 'JetBrains Mono' },
          bodyFont: { family: 'JetBrains Mono' },
          callbacks: {
            title: (items) => `Radius: ${items[0].label} px`,
            label: (item) => `Intensity: ${parseFloat(item.raw).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Radial Distance r (pixels)', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', maxTicksLimit: 12 }
        },
        y: {
          title: { display: true, text: 'Fluorescence Intensity (%)', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' },
          min: 0,
          max: 105
        }
      }
    }
  });
}

// --------------------------------------------------------
// 4. IN SILICO ELECTROPHORESIS SIMULATION ENGINE
// --------------------------------------------------------
let chartSimulation = null;
let simAnimationId = null;
let lastSimulationData = null;

const simPresets = {
  pfsge_standard: {
    n_particles: 250, n_steps: 1000, dt: 0.05, field_magnitude: 2.0, field_freq: 0.5,
    zeta_0: 1.0, alpha: 0.02, noise: 0.20
  },
  pfge_uniform: {
    n_particles: 250, n_steps: 1000, dt: 0.05, field_magnitude: 2.0, field_freq: 0.5,
    zeta_0: 1.0, alpha: 0.00, noise: 0.20
  },
  hmw_5mb: {
    n_particles: 350, n_steps: 1200, dt: 0.04, field_magnitude: 2.4, field_freq: 0.35,
    zeta_0: 1.2, alpha: 0.05, noise: 0.15
  },
  rapid_switching: {
    n_particles: 300, n_steps: 900, dt: 0.05, field_magnitude: 3.5, field_freq: 1.2,
    zeta_0: 1.0, alpha: 0.03, noise: 0.25
  }
};

function loadSimulationScenario(scenarioKey) {
  const p = simPresets[scenarioKey];
  if (!p) return;
  document.getElementById('sim_n_particles').value = p.n_particles;
  document.getElementById('sim_n_steps').value = p.n_steps;
  document.getElementById('sim_dt').value = p.dt;
  document.getElementById('sim_field_magnitude').value = p.field_magnitude;
  document.getElementById('sim_field_freq').value = p.field_freq;
  document.getElementById('sim_zeta_0').value = p.zeta_0;
  document.getElementById('sim_alpha').value = p.alpha;
  document.getElementById('sim_noise').value = p.noise;
}

function applySelectedScenario() {
  const key = document.getElementById('sim-scenario-select').value;
  loadSimulationScenario(key);
  startSimulation();
}

async function startSimulation() {
  const runBtn = document.getElementById('btn-run-sim');
  const progressEl = document.getElementById('sim-progress-indicator');

  runBtn.disabled = true;
  runBtn.textContent = '⏳ Simulating...';
  progressEl.textContent = 'Executing Langevin integration...';

  // Extract parameters
  const n_particles = parseInt(document.getElementById('sim_n_particles').value);
  const n_steps = parseInt(document.getElementById('sim_n_steps').value);
  const dt = parseFloat(document.getElementById('sim_dt').value);
  const field_magnitude = parseFloat(document.getElementById('sim_field_magnitude').value);
  const field_frequency = parseFloat(document.getElementById('sim_field_freq').value);
  const zeta_0 = parseFloat(document.getElementById('sim_zeta_0').value);
  const alpha = parseFloat(document.getElementById('sim_alpha').value);
  const noise_strength = parseFloat(document.getElementById('sim_noise').value);
  const charge = 1.0;

  // Let browser render the button change
  await new Promise(r => setTimeout(r, 20));

  // Initialize particle positions (x, y)
  const positions = new Float64Array(n_particles * 2);
  for (let i = 0; i < n_particles; i++) {
    positions[i * 2] = boxMullerRandom() * 0.02;
    positions[i * 2 + 1] = boxMullerRandom() * 0.02;
  }

  const sqrtDt = Math.sqrt(dt);
  const trajectoryFrames = []; // Record snapshots for smooth animated playback

  // Integrate Overdamped Langevin Equations
  for (let step = 1; step < n_steps; step++) {
    const t = (step - 1) * dt;
    const Ex = field_magnitude * Math.cos(field_frequency * t);
    const Ey = field_magnitude * Math.sin(field_frequency * t);

    for (let i = 0; i < n_particles; i++) {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];
      const r_sq = x * x + y * y;
      const local_zeta = zeta_0 * (1.0 + alpha * r_sq);

      const drift_x = (charge * Ex) / local_zeta;
      const drift_y = (charge * Ey) / local_zeta;

      const noise_std = noise_strength / Math.sqrt(local_zeta);
      const nx = boxMullerRandom() * noise_std * sqrtDt;
      const ny = boxMullerRandom() * noise_std * sqrtDt;

      positions[i * 2] = x + drift_x * dt + nx;
      positions[i * 2 + 1] = y + drift_y * dt + ny;
    }

    // Save keyframes for 2D animation
    if (step % Math.max(1, Math.floor(n_steps / 60)) === 0) {
      trajectoryFrames.push({
        t: t,
        Ex: Ex,
        Ey: Ey,
        pts: new Float64Array(positions)
      });
    }
  }

  // Calculate terminal radial statistics
  const terminalRadii = new Float64Array(n_particles);
  let maxR = 0.001;
  let sumR = 0;
  for (let i = 0; i < n_particles; i++) {
    const r = Math.sqrt(positions[i * 2] * positions[i * 2] + positions[i * 2 + 1] * positions[i * 2 + 1]);
    terminalRadii[i] = r;
    if (r > maxR) maxR = r;
    sumR += r;
  }

  const meanR = sumR / n_particles;
  let varR = 0;
  for (let i = 0; i < n_particles; i++) {
    varR += (terminalRadii[i] - meanR) * (terminalRadii[i] - meanR);
  }
  varR /= n_particles;

  // Build histogram
  const nBins = 100;
  const binWidth = maxR / nBins;
  const hist = new Float64Array(nBins);
  for (let i = 0; i < n_particles; i++) {
    let b = Math.floor(terminalRadii[i] / binWidth);
    if (b >= nBins) b = nBins - 1;
    hist[b]++;
  }

  const densities = [];
  const binCenters = [];
  for (let i = 0; i < nBins; i++) {
    densities.push(hist[i] / (n_particles * binWidth));
    binCenters.push(parseFloat(((i + 0.5) * binWidth).toFixed(2)));
  }

  const smoothed = gaussianSmooth(densities, 2.0);
  const peakIndices = findPeaks(smoothed, 0.05);
  const peakRadii = peakIndices.map(idx => binCenters[idx]);

  lastSimulationData = {
    binCenters,
    densities,
    smoothed,
    peakIndices,
    peakRadii,
    varR,
    meanR,
    n_particles
  };

  // Update Stats in DOM
  document.getElementById('sim-peaks-count').textContent = peakIndices.length;
  document.getElementById('sim-variance').textContent = varR.toFixed(4);
  document.getElementById('sim-mean-r').textContent = meanR.toFixed(2);
  progressEl.textContent = `Completed: ${n_particles} fragments over ${n_steps} steps.`;

  renderSimulationChart(binCenters, smoothed, peakIndices);
  play2DChamberAnimation(trajectoryFrames, maxR);

  runBtn.disabled = false;
  runBtn.textContent = '▶ Run Simulation';
}

function renderSimulationChart(labels, data, peakIndices) {
  const ctx = document.getElementById('chart-simulation').getContext('2d');
  const pointBg = data.map((_, i) => peakIndices.includes(i) ? '#a855f7' : 'transparent');
  const pointR = data.map((_, i) => peakIndices.includes(i) ? 6 : 0);

  if (chartSimulation) {
    chartSimulation.data.labels = labels;
    chartSimulation.data.datasets[0].data = data;
    chartSimulation.data.datasets[0].pointBackgroundColor = pointBg;
    chartSimulation.data.datasets[0].pointRadius = pointR;
    chartSimulation.update();
    return;
  }

  chartSimulation = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Virtual Electropherogram P(r)',
        data: data,
        borderColor: '#a855f7',
        borderWidth: 2.5,
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pointBg,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: pointR
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            title: (items) => `Radial Position: ${items[0].label} units`,
            label: (item) => `Probability Density: ${parseFloat(item.raw).toFixed(3)}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Radial Migration Distance r', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        },
        y: {
          title: { display: true, text: 'Probability Density P(r)', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        }
      }
    }
  });
}

function play2DChamberAnimation(frames, maxR) {
  if (simAnimationId) cancelAnimationFrame(simAnimationId);
  const canvas = document.getElementById('sim-2d-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = (Math.min(w, h) * 0.42) / (maxR || 1);

  let frameIdx = 0;
  const needleEl = document.getElementById('sim-compass-needle');

  function renderFrame() {
    if (frameIdx >= frames.length) {
      frameIdx = frames.length - 1; // Stay on terminal frame
    }

    const currentFrame = frames[frameIdx];
    const pts = currentFrame.pts;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Chamber boundaries
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.44, 0, 2 * Math.PI);
    ctx.stroke();

    // Radial guide rings
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.44 * frac, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.stroke();
    });

    // 6 Cathodes arranged in circle (Hexagonal PFSGE configuration)
    const nCathodes = 6;
    for (let i = 0; i < nCathodes; i++) {
      const angle = (2 * Math.PI * i) / nCathodes;
      const ex = cx + Math.min(w, h) * 0.43 * Math.cos(angle);
      const ey = cy + Math.min(w, h) * 0.43 * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e3a8a';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Center Anode
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Particles
    const n = pts.length / 2;
    for (let i = 0; i < n; i++) {
      const px = cx + pts[i * 2] * scale;
      const py = cy + pts[i * 2 + 1] * scale;

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.85)';
      ctx.fill();
    }

    // Rotate compass needle
    if (needleEl) {
      const angleDeg = Math.atan2(currentFrame.Ey, currentFrame.Ex) * (180 / Math.PI) + 90;
      needleEl.style.transform = `rotate(${angleDeg}deg)`;
    }

    if (frameIdx < frames.length - 1) {
      frameIdx++;
      simAnimationId = requestAnimationFrame(renderFrame);
    }
  }

  renderFrame();
}

// --------------------------------------------------------
// 5. AUTOMATED SPIRAL GEL DISPENSER CALCULATOR
// --------------------------------------------------------
let chartDispenser = null;
let chartFlowRate = null;
let lastDispenserData = null;

function calculateDispenser() {
  const target_alpha = parseFloat(document.getElementById('disp_alpha').value);
  const r_min = parseFloat(document.getElementById('disp_rmin').value);
  const r_max = parseFloat(document.getElementById('disp_rmax').value);
  const base_concentration = parseFloat(document.getElementById('disp_base_conc').value);
  const max_concentration = parseFloat(document.getElementById('disp_max_conc').value);
  const bead_width = parseFloat(document.getElementById('disp_bead_width').value);
  const linear_velocity = parseFloat(document.getElementById('disp_velocity').value);

  const c = bead_width / (2 * Math.PI);
  const theta_max = (r_max - r_min) / c;
  const n_points = 500;

  const radii = [];
  const omegaRPM = [];
  const concentrations = [];
  const flowRates = [];

  const Q_base = linear_velocity * bead_width * 1.0; // mm^3/s

  for (let i = 0; i < n_points; i++) {
    const theta = (theta_max * i) / (n_points - 1);
    const r = r_min + c * theta;
    const omega = linear_velocity / r; // rad/s
    const rpm = (omega * 60) / (2 * Math.PI);
    const conc = base_concentration + (max_concentration - base_concentration) * ((target_alpha * r * r) / (target_alpha * r_max * r_max));
    const flow = Q_base * (conc / base_concentration);

    radii.push(parseFloat(r.toFixed(2)));
    omegaRPM.push(parseFloat(rpm.toFixed(2)));
    concentrations.push(parseFloat(conc.toFixed(3)));
    flowRates.push(parseFloat(flow.toFixed(2)));
  }

  const totalTurns = theta_max / (2 * Math.PI);
  const approxPathLength = 0.5 * c * (theta_max * Math.sqrt(1 + theta_max * theta_max) + Math.log(theta_max + Math.sqrt(1 + theta_max * theta_max)));
  const printTime = approxPathLength / linear_velocity;

  lastDispenserData = {
    radii,
    omegaRPM,
    concentrations,
    flowRates,
    totalTurns,
    approxPathLength,
    printTime,
    bead_width,
    linear_velocity
  };

  // Update Summary Metrics
  document.getElementById('disp-total-turns').textContent = totalTurns.toFixed(1);
  document.getElementById('disp-path-length').textContent = `${Math.round(approxPathLength)} mm`;
  document.getElementById('disp-print-time').textContent = `${Math.round(printTime)} s`;
  document.getElementById('disp-max-rpm').textContent = `${Math.round(omegaRPM[0])} RPM`;

  renderDispenserCharts(radii, omegaRPM, concentrations, flowRates);
}

function renderDispenserCharts(radii, omegaRPM, concentrations, flowRates) {
  const ctxDisp = document.getElementById('chart-dispenser').getContext('2d');
  const ctxFlow = document.getElementById('chart-flowrate').getContext('2d');

  if (chartDispenser) chartDispenser.destroy();
  if (chartFlowRate) chartFlowRate.destroy();

  // Dual axis: RPM and Concentration
  chartDispenser = new Chart(ctxDisp, {
    type: 'line',
    data: {
      labels: radii,
      datasets: [
        {
          label: 'Stage Rotation Speed (RPM)',
          data: omegaRPM,
          borderColor: '#06b6d4',
          borderWidth: 2.5,
          yAxisID: 'yRPM',
          tension: 0.2,
          pointRadius: 0
        },
        {
          label: 'Agarose Concentration C(r) (%)',
          data: concentrations,
          borderColor: '#a855f7',
          borderWidth: 2.5,
          yAxisID: 'yConc',
          tension: 0.2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { family: 'Inter', weight: 600 } }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Spiral Radius r (mm)', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        },
        yRPM: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Rotation Speed (RPM)', color: '#06b6d4' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#06b6d4' }
        },
        yConc: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Polymer Concentration (%)', color: '#a855f7' },
          grid: { drawOnChartArea: false },
          ticks: { color: '#a855f7' }
        }
      }
    }
  });

  // Flow Rate Chart
  chartFlowRate = new Chart(ctxFlow, {
    type: 'line',
    data: {
      labels: radii,
      datasets: [{
        label: 'Dispenser Flow Rate Q(r) (mm³/s)',
        data: flowRates,
        borderColor: '#10b981',
        borderWidth: 2,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { family: 'Inter', weight: 600 } }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Spiral Radius r (mm)', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        },
        y: {
          title: { display: true, text: 'Flow Rate (mm³/s)', color: '#10b981' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#10b981' }
        }
      }
    }
  });
}

// --------------------------------------------------------
// 6. EXPORT UTILITIES (CSV, G-CODE, CITATIONS)
// --------------------------------------------------------
function exportElectropherogramCSV(type) {
  let data = type === 'interpreter' ? lastAnalyzedInterpreterData : lastSimulationData;
  if (!data || !data.binCenters || data.binCenters.length === 0) {
    alert('Please run analysis or simulation before exporting.');
    return;
  }

  let csv = 'Radius,Intensity_or_Density,Smoothed\n';
  const raw = type === 'interpreter' ? data.rawDensities : data.densities;
  for (let i = 0; i < data.binCenters.length; i++) {
    csv += `${data.binCenters[i]},${raw[i]},${data.smoothed[i]}\n`;
  }

  downloadBlob(csv, `pfsge_${type}_electropherogram.csv`, 'text/csv');
}

function exportDispenserCSV() {
  if (!lastDispenserData) {
    calculateDispenser();
  }
  let csv = 'Radius_mm,Stage_RPM,Polymer_Concentration_Percent,Flow_Rate_mm3_per_s\n';
  const d = lastDispenserData;
  for (let i = 0; i < d.radii.length; i++) {
    csv += `${d.radii[i]},${d.omegaRPM[i]},${d.concentrations[i]},${d.flowRates[i]}\n`;
  }
  downloadBlob(csv, 'pfsge_dispenser_toolpath_parameters.csv', 'text/csv');
}

function exportDispenserGCode() {
  if (!lastDispenserData) calculateDispenser();
  const d = lastDispenserData;
  let gcode = `; ==========================================\n`;
  gcode += `; PFSGE SPIRAL GEL DISPENSER TOOLPATH\n`;
  gcode += `; Patent App: 202641085541 (Gurumurthy Swaminathan)\n`;
  gcode += `; Total Revolutions: ${d.totalTurns.toFixed(2)}\n`;
  gcode += `; Total Path Length: ${Math.round(d.approxPathLength)} mm\n`;
  gcode += `; Linear Speed: ${d.linear_velocity} mm/s\n`;
  gcode += `; ==========================================\n`;
  gcode += `G21 ; Millimeters\nG90 ; Absolute coordinates\nM82 ; Extruder absolute mode\nG28 ; Home all axes\nG1 Z2.0 F1200 ; Stand-off height\n\n`;

  let currentE = 0;
  for (let i = 0; i < d.radii.length; i += 5) {
    const r = d.radii[i];
    const theta = (i / d.radii.length) * (d.totalTurns * 2 * Math.PI);
    const x = (r * Math.cos(theta)).toFixed(3);
    const y = (r * Math.sin(theta)).toFixed(3);
    currentE += d.flowRates[i] * 0.1;

    gcode += `G1 X${x} Y${y} E${currentE.toFixed(3)} F${Math.round(d.linear_velocity * 60)}\n`;
  }

  gcode += `\nM104 S0 ; Cooldown\nM84 ; Disable steppers\n`;
  downloadBlob(gcode, 'pfsge_spiral_gel.gcode', 'text/plain');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyBibtex() {
  const text = document.getElementById('bibtex-block').textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('BibTeX citation copied to clipboard!');
  });
}

function copyPatentDetails() {
  const text = `Indian Patent Application No. 202641085541\nTitle: A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation\nPublication Date: October 23, 2026\nInventor: Gurumurthy Swaminathan`;
  navigator.clipboard.writeText(text).then(() => {
    alert('Patent details copied to clipboard!');
  });
}

// --------------------------------------------------------
// 7. INITIALIZATION ON PAGE LOAD
// --------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Load benchmark gel by default
  loadBenchmarkGel();

  // Initialize dispenser calculator
  calculateDispenser();

  // Auto-run initial simulation preset
  setTimeout(() => {
    startSimulation();
  }, 400);
});
