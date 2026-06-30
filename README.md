# PFSGE: Pulsed-Field Spiral Gel Electrophoresis

Pulsed-Field Spiral Gel Electrophoresis (PFSGE) is an advanced analytical framework and simulation tool for modeling, designing, and analyzing the separation of high-molecular-weight (HMW) DNA molecules in a non-uniform gel structure. 

Unlike traditional Pulsed-Field Gel Electrophoresis (PFGE) which uses homogeneous gel matrices and discrete switching angles, PFSGE leverages:
1. **A Programmable Radial Drag Gradient** (generated via automated Archimedean spiral deposition of varying polymer concentration).
2. **A Continuous Rotating Electric Field** to achieve rapid, high-resolution separation of large genomic fragments.

---

## 🔬 Theoretical Principles & Physical Model

### 1. Radial Drag (Porosity) Gradient
The gel structure is cast with a radial polymer concentration gradient. The effective drag coefficient $\zeta(r)$ experienced by a DNA fragment at a radial distance $r$ from the center is modeled as:

$$\zeta(r) = \zeta_0 (1 + \alpha r^2)$$

Where:
* $\zeta_0$: Base drag coefficient at the origin ($r = 0$).
* $\alpha$: Programmable radial drag gradient parameter.
* $r = \sqrt{x^2 + y^2}$: Radial distance from the center.

### 2. Particle Dynamics (Equation of Motion)
The motion of each DNA segment is governed by an overdamped Langevin equation:

$$\frac{d\mathbf{x}}{dt} = \frac{q \mathbf{E}(t)}{\zeta(r)} + \boldsymbol{\eta}(t)$$

Where:
* $\mathbf{x} = (x, y)$ is the 2D coordinate of the DNA segment.
* $q$ is the effective charge of the DNA fragment.
* $\mathbf{E}(t) = \big(E_{\text{mag}}\cos(\omega t), E_{\text{mag}}\sin(\omega t)\big)$ is the rotating electric field vector with frequency $\omega$.
* $\boldsymbol{\eta}(t)$ represents Brownian thermal noise with properties:
  $$\langle \eta_i(t) \rangle = 0, \quad \langle \eta_i(t)\eta_j(t') \rangle = \frac{2 D_0}{\zeta(r)} \delta_{ij}\delta(t-t')$$

### 3. Spiral Dispensing Mechanics
To cast the gel, an automated deposition tool dispenses a polymer bead of width $w$ along an Archimedean spiral:

$$r(\theta) = r_{\text{inner}} + \frac{w}{2\pi} \theta$$

To ensure uniform deposition density under a variable concentration profile $C(r)$, the system regulates:
* **Stage Rotation Speed** (to maintain constant linear velocity $v_{\text{linear}}$):
  $$\omega_{\text{stage}}(r) = \frac{v_{\text{linear}}}{r}$$
* **Dispenser Flow Rate**:
  $$Q(r) = Q_{\text{base}} \left(\frac{C(r)}{C_{\text{base}}}\right)$$

---

## 💻 Software Components & Architecture

The repository contains three primary components:
1. `pfsge/`: The core Python simulation and analysis package.
2. `backend/`: A FastAPI web portal serving the interactive simulation interface and analytical tools.
3. `test_pfsge.py`: Verification and validation test pipeline.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [uv](https://github.com/astral-sh/uv) or `python` (>= 3.9) installed.

### Installation
Clone the repository and install the dependencies:
```bash
# Using standard pip
pip install -r requirements.txt

# Or using uv (recommended)
uv pip install -r requirements.txt
```

---

## 📓 Running via Google Colab

Researchers can run the interactive simulation directly in a browser without local setup:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sgmoorthy/PFSGE/blob/master/notebooks/PFSGE_Simulation.ipynb)

### Google Colab Workflow:
1. Click the **Open In Colab** badge above.
2. Run the initialization cells to automatically clone the codebase and install requirements.
3. Use the interactive sliders to adjust physical parameters (e.g., field frequency $\omega$, drag gradient $\alpha$, electric field strength) and view real-time trajectories and virtual electropherograms.

---

## 🖥️ Running the Local Analytical Simulator

To launch the web interface locally, you can start the FastAPI application:

### On Windows (PowerShell):
```powershell
./run_backend.ps1
```

### On Linux / macOS (Bash):
```bash
chmod +x run_backend.sh
./run_backend.sh
```

Alternatively, launch the FastAPI server directly:
```bash
python backend/main.py
```

Once running, navigate to `http://localhost:8000` in your web browser to access:
* **Interactive Simulator**: Visualize 2D particle trajectories and export results.
* **Image Interpreter**: Upload raw images of spiral gel runs to extract radial intensity profiles and peak locations.
* **Dispenser Calculator**: Calculate precise stage speeds and flow rates for physical gel-casting instrumentation.

---

## 🧪 Verifying the Installation

To verify that the library and mathematical models are functioning correctly on your system, run the test pipeline:
```bash
python test_pfsge.py
```
This executes tests across the simulation engine, peak finder, and physical dispensing calculator.
