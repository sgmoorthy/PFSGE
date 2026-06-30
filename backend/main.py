from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn
from pfsge import process_gel_image, run_pfsge_simulation, generate_virtual_electropherogram, compute_spiral_dispensing_parameters
import os
import sys

# Ensure workspace root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = FastAPI(title="PFSGE Analytical Portal")

# Ensure static directory exists
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open(os.path.join(STATIC_DIR, "index.html"), "r") as f:
        return f.read()

@app.post("/api/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    center_x: float = Form(None),
    center_y: float = Form(None)
):
    contents = await file.read()
    results = process_gel_image(contents, center_x=center_x, center_y=center_y)
    return results

class SimulationRequest(BaseModel):
    n_particles: int = 100
    n_steps: int = 500
    dt: float = 0.05
    field_magnitude: float = 1.0
    field_frequency: float = 1.0
    zeta_0: float = 1.0
    alpha: float = 0.05
    noise_strength: float = 0.1
    charge: float = 1.0

@app.post("/api/simulate")
async def simulate(req: SimulationRequest):
    trajectories = run_pfsge_simulation(
        n_particles=req.n_particles,
        n_steps=req.n_steps,
        dt=req.dt,
        field_magnitude=req.field_magnitude,
        field_frequency=req.field_frequency,
        zeta_0=req.zeta_0,
        alpha=req.alpha,
        noise_strength=req.noise_strength,
        charge=req.charge,
        seed=42
    )
    results = generate_virtual_electropherogram(trajectories, n_bins=100)
    return results

class DispenserRequest(BaseModel):
    target_alpha: float = 0.05
    r_min: float = 5.0
    r_max: float = 50.0
    base_concentration: float = 1.0
    max_concentration: float = 4.0
    bead_width: float = 1.5
    constant_linear_velocity: float = 10.0

@app.post("/api/dispenser")
async def dispenser(req: DispenserRequest):
    results = compute_spiral_dispensing_parameters(
        target_alpha=req.target_alpha,
        radius_range=(req.r_min, req.r_max),
        base_concentration=req.base_concentration,
        max_concentration=req.max_concentration,
        bead_width=req.bead_width,
        constant_linear_velocity=req.constant_linear_velocity
    )
    return results

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
