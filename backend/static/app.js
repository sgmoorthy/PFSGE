// Tab Switching
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Find the button clicking it
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.textContent.toLowerCase().includes(tabId.substring(0, 3)));
    if (activeBtn) activeBtn.classList.add('active');
    
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// ----------------------------------------------------
// 1. DATA INTERPRETATION TAB
// ----------------------------------------------------
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const gelCanvas = document.getElementById('gel-canvas');
const canvasContainer = document.getElementById('canvas-container');
const interpretResults = document.getElementById('interpret-results');

let gelImage = null;
let centerPoint = { x: 0, y: 0 };
let isDragging = false;
let uploadedFile = null;
let interpretChart = null;

// File Upload Triggers
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        uploadedFile = e.dataTransfer.files[0];
        loadImage(uploadedFile);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        uploadedFile = e.target.files[0];
        loadImage(uploadedFile);
    }
});

// Load Image on Canvas
function loadImage(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        gelImage = new Image();
        gelImage.onload = () => {
            canvasContainer.style.display = 'block';
            
            // Set initial center coordinates
            centerPoint.x = gelImage.width / 2;
            centerPoint.y = gelImage.height / 2;
            
            drawCanvas();
            analyzeGelImage();
        };
        gelImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Draw Canvas with Crosshair
function drawCanvas() {
    if (!gelImage) return;
    const ctx = gelCanvas.getContext('2d');
    
    // Scale down size to fit UI comfortably but keep aspect ratio
    const maxUIWidth = 400;
    const scale = Math.min(1, maxUIWidth / gelImage.width);
    
    gelCanvas.width = gelImage.width * scale;
    gelCanvas.height = gelImage.height * scale;
    
    // Draw the image
    ctx.drawImage(gelImage, 0, 0, gelCanvas.width, gelCanvas.height);
    
    // Draw crosshair at centerPoint (mapped to UI scale)
    const drawX = centerPoint.x * scale;
    const drawY = centerPoint.y * scale;
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    
    // Circle
    ctx.beginPath();
    ctx.arc(drawX, drawY, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Cross lines
    ctx.beginPath();
    ctx.moveTo(drawX - 20, drawY);
    ctx.lineTo(drawX + 20, drawY);
    ctx.moveTo(drawX, drawY - 20);
    ctx.lineTo(drawX, drawY + 20);
    ctx.stroke();
}

// Drag & Drop Center Point inside Canvas
gelCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateCenterFromEvent(e);
});

gelCanvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        updateCenterFromEvent(e);
    }
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        analyzeGelImage(); // Analyze when user finishes dragging
    }
});

// Support touch devices
gelCanvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateCenterFromEvent(e.touches[0]);
});
gelCanvas.addEventListener('touchmove', (e) => {
    if (isDragging) {
        updateCenterFromEvent(e.touches[0]);
    }
});
gelCanvas.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
        analyzeGelImage();
    }
});

function updateCenterFromEvent(e) {
    const rect = gelCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Map back to original image coordinates
    const scale = gelImage.width / gelCanvas.width;
    centerPoint.x = Math.max(0, Math.min(gelImage.width, x * scale));
    centerPoint.y = Math.max(0, Math.min(gelImage.height, y * scale));
    
    drawCanvas();
}

// Analyze Gel Image using backend API
async function analyzeGelImage() {
    if (!uploadedFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('center_x', centerPoint.x);
    formData.append('center_y', centerPoint.y);
    
    try {
        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Analysis failed.');
        const data = await response.json();
        
        // Show interpret results card
        interpretResults.style.opacity = '1';
        interpretResults.style.pointerEvents = 'auto';
        
        // Update Stats
        document.getElementById('interpret-peaks-count').textContent = data.peak_positions.length;
        document.getElementById('interpret-variance').textContent = data.radial_variance.toFixed(2);
        
        // Render Chart
        renderChart('interpretChart', interpretChart, data.bin_centers, data.densities, 'Radial Intensity Profile', '#3b82f6', (chart) => interpretChart = chart);
        
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

// ----------------------------------------------------
// 2. SIMULATION TAB
// ----------------------------------------------------
let simChart = null;

async function runSimulation(event) {
    event.preventDefault();
    
    const payload = {
        n_particles: parseInt(document.getElementById('n_particles').value),
        n_steps: parseInt(document.getElementById('n_steps').value),
        dt: parseFloat(document.getElementById('dt').value),
        field_magnitude: parseFloat(document.getElementById('field_magnitude').value),
        field_frequency: parseFloat(document.getElementById('field_frequency').value),
        zeta_0: parseFloat(document.getElementById('zeta_0').value),
        alpha: parseFloat(document.getElementById('alpha').value),
        noise_strength: parseFloat(document.getElementById('noise_strength').value),
        charge: 1.0
    };
    
    const submitBtn = event.target.querySelector('button');
    submitBtn.textContent = 'Simulating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Simulation failed.');
        const data = await response.json();
        
        // Update UI
        const simResults = document.getElementById('simulate-results');
        simResults.style.opacity = '1';
        simResults.style.pointerEvents = 'auto';
        
        document.getElementById('sim-peaks-count').textContent = data.peak_positions.length;
        document.getElementById('sim-variance').textContent = data.radial_variance.toFixed(4);
        
        renderChart('simChart', simChart, data.bin_centers, data.densities, 'Simulated DNA Band Density', '#a855f7', (chart) => simChart = chart);
        
    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.textContent = 'Execute in silico Electrophoresis';
        submitBtn.disabled = false;
    }
}

// ----------------------------------------------------
// 3. DISPENSER CALCULATOR TAB
// ----------------------------------------------------
let dispenserChart = null;

async function calculateDispenser(event) {
    event.preventDefault();
    
    const payload = {
        target_alpha: parseFloat(document.getElementById('target_alpha').value),
        r_min: parseFloat(document.getElementById('r_min').value),
        r_max: parseFloat(document.getElementById('r_max').value),
        base_concentration: parseFloat(document.getElementById('base_concentration').value),
        max_concentration: parseFloat(document.getElementById('max_concentration').value),
        bead_width: parseFloat(document.getElementById('bead_width').value),
        constant_linear_velocity: parseFloat(document.getElementById('linear_velocity').value)
    };
    
    try {
        const response = await fetch('/api/dispenser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Dispenser calculation failed.');
        const data = await response.json();
        
        const dispResults = document.getElementById('dispenser-results');
        dispResults.style.opacity = '1';
        dispResults.style.pointerEvents = 'auto';
        
        // Print Summary
        const totalRevolutions = (payload.r_max - payload.r_min) / payload.bead_width;
        document.getElementById('dispenser-summary').innerHTML = `
            <strong>Manufacturing Target Summary:</strong><br>
            • Total Revolutions required: <strong>${totalRevolutions.toFixed(2)}</strong><br>
            • Stage rotation speed (inner): <strong>${(data.stage_rotation_speed[0]).toFixed(2)} rad/s</strong><br>
            • Stage rotation speed (outer): <strong>${(data.stage_rotation_speed[data.stage_rotation_speed.length - 1]).toFixed(2)} rad/s</strong><br>
            • Maximum polymer flow rate: <strong>${Math.max(...data.dispenser_flow_rate).toFixed(2)} mm³/s</strong>
        `;
        
        // Render Chart with multiple datasets (Concentration and Flow Rate)
        if (dispenserChart) {
            dispenserChart.destroy();
        }
        
        const ctx = document.getElementById('dispenserChart').getContext('2d');
        dispenserChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.radii.map(r => r.toFixed(1)),
                datasets: [
                    {
                        label: 'Polymer Concentration (%)',
                        data: data.polymer_concentration,
                        borderColor: '#10b981',
                        borderWidth: 2.5,
                        yAxisID: 'y',
                        pointRadius: 0
                    },
                    {
                        label: 'Flow Rate (mm³/s)',
                        data: data.dispenser_flow_rate,
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Radius (mm)', color: '#9ca3af' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', maxTicksLimit: 10 }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Concentration (%)', color: '#10b981' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Flow Rate (mm³/s)', color: '#3b82f6' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#9ca3af' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#f3f4f6' } }
                }
            }
        });
        
    } catch (err) {
        alert(err.message);
    }
}

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------
function renderChart(elementId, existingChart, labels, data, labelText, color, saveChartCallback) {
    if (existingChart) {
        existingChart.destroy();
    }
    
    const ctx = document.getElementById(elementId).getContext('2d');
    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(x => (typeof x === 'number') ? x.toFixed(2) : x),
            datasets: [{
                label: labelText,
                data: data,
                borderColor: color,
                backgroundColor: `${color}15`,
                borderWidth: 2,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', maxTicksLimit: 10 }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f3f4f6' }
                }
            }
        }
    });
    
    saveChartCallback(newChart);
}
