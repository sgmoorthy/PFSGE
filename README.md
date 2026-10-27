# PFSGE: Pulsed-Field Spiral Gel Electrophoresis

[![Live Portal](https://img.shields.io/badge/Vercel-pfsge.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pfsge.vercel.app)
[![Patent Status](https://img.shields.io/badge/Patent-Application%20Published%20(202641085541)-blue.svg?style=for-the-badge)](https://iprsearch.ipindia.gov.in/publicsearch)
[![Google Scholar](https://img.shields.io/badge/Google%20Scholar-Gurumurthy%20Swaminathan-4285F4?style=for-the-badge&logo=googlescholar&logoColor=white)](https://scholar.google.com/citations?user=wpgzVMsAAAAJ&hl=en&authuser=1)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> 🌐 **Interactive Web Application:**  
> **[https://pfsge.vercel.app](https://pfsge.vercel.app)** — Fully functional in silico simulation, live radial gel image interpreter, automated dispenser calculator, and virtual electropherogram suite running on the Vercel Global Edge Network.

> 📜 **Intellectual Property Notice:**  
> The physical apparatus, architectural geometry, field switching protocols, and core methodologies in this repository are subject to **Indian Patent Application No. 202641085541**, titled *"A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation"*, officially published by the Indian Patent Office under Section 11A of the Patents Act, 1970.

---

## 👨‍🔬 Inventor & Research Profile
* **Inventor:** Gurumurthy Swaminathan
* **Google Scholar Profile:** [Gurumurthy Swaminathan on Google Scholar](https://scholar.google.com/citations?user=wpgzVMsAAAAJ&hl=en&authuser=1)
* **GitHub Repository:** [https://github.com/sgmoorthy/PFSGE](https://github.com/sgmoorthy/PFSGE)
* **Published Portal:** [https://pfsge.vercel.app](https://pfsge.vercel.app)

---

## ⚡ Key Highlights & Core Innovation

Pulsed-Field Spiral Gel Electrophoresis (PFSGE) is an advanced analytical framework and simulation environment for modeling, designing, and analyzing the separation of high-molecular-weight (HMW) DNA molecules in a non-uniform, spiral gel structure.

Unlike traditional Pulsed-Field Gel Electrophoresis (PFGE) which relies on homogeneous gel matrices and discrete switching angles, PFSGE leverages:
1. **A Programmable Radial Drag Gradient** (generated via automated Archimedean spiral deposition of varying polymer concentration).
2. **A Continuous Rotating Electric Field** to mitigate reptation elongation, prevent molecular bunching, and achieve rapid, high-resolution separation of large genomic fragments (> 5 Mb).

---

## 🖥️ Live Analytical Platform Features ([pfsge.vercel.app](https://pfsge.vercel.app))

The online suite provides instant, client-side sub-millisecond execution and serverless API integration:

1. **Radial Gel Image Interpreter**
   * Drag-and-drop fluorescence gel scans (PNG, JPG, TIFF, WebP).
   * **⚡ Load Benchmark Gel**: Instant synthetic spiral gel generator with 3 distinct DNA bands.
   * Real-time interactive crosshair dragging for origin alignment at 60 FPS.
   * 1D Gaussian kernel smoothing ($\sigma$ slider), background thresholding, band peak detection, and radial variance ($\sigma^2$) quantification.
   * Direct CSV export of electropherograms.

2. **In Silico Electrophoresis Simulation Engine**
   * Solves 2D overdamped Langevin equations with rotating field vector $\mathbf{E}(t) = \big(E_0 \cos(\omega t), E_0 \sin(\omega t)\big)$ and non-linear drag $\zeta(r) = \zeta_0(1 + \alpha r^2)$.
   * Interactive 2D migration chamber canvas with real-time field compass needle and animated DNA fragments.
   * Virtual electropherogram generation, band resolution indices, and preset comparisons (Conventional PFGE vs. PFSGE Gradient).

3. **Automated Spiral Gel Dispenser Calculator**
   * Machine control mathematics for Archimedean spiral deposition: $r(\theta) = r_{\text{inner}} + \frac{w}{2\pi}\theta$.
   * Dynamic stage angular velocity regulation $\omega_{\text{stage}}(r) = \frac{v_{\text{linear}}}{r}$ and flow rate profiling $Q(r)$.
   * Dual-axis interactive plots and automated **G-code toolpath** & **CSV parameter table** export.

4. **REST API Endpoints**
   * `POST https://pfsge.vercel.app/api/simulate`: Run Langevin dynamics simulation via JSON API.
   * `POST https://pfsge.vercel.app/api/dispenser`: Compute machine printing parameters via JSON API.
   * `POST https://pfsge.vercel.app/api/analyze-image`: API endpoint for gel radial electropherogram analysis.

---

## 🔬 Theoretical Principles & Physical Model

### 1. Radial Drag (Porosity) Gradient
The gel structure is cast with a radial polymer concentration gradient. The effective drag coefficient $\zeta(r)$ experienced by a DNA fragment at a radial distance $r$ from the center is modeled as:

$$
\zeta(r) = \zeta_0 (1 + \alpha r^2)
$$

Where:
* $\zeta_0$: Base drag coefficient at the origin ($r = 0$).
* $\alpha$: Programmable radial drag gradient parameter.
* $r = \sqrt{x^2 + y^2}$: Radial distance from the center.

### 2. Particle Dynamics (Equation of Motion)
The motion of each DNA segment is governed by an overdamped Langevin equation:

$$
\frac{d\mathbf{x}}{dt} = \frac{q \mathbf{E}(t)}{\zeta(r)} + \boldsymbol{\eta}(t)
$$

Where:
* $\mathbf{x} = (x, y)$ is the 2D coordinate of the DNA segment.
* $q$ is the effective charge of the DNA fragment.
* $\mathbf{E}(t) = \big(E_{\text{mag}}\cos(\omega t), E_{\text{mag}}\sin(\omega t)\big)$ is the rotating electric field vector with frequency $\omega$.
* $\boldsymbol{\eta}(t)$ represents Brownian thermal noise with properties:

$$
\langle \eta_i(t) \rangle = 0, \quad \langle \eta_i(t)\eta_j(t') \rangle = \frac{2 D_0}{\zeta(r)} \delta_{ij}\delta(t-t')
$$

### 3. Spiral Dispensing Mechanics
To cast the gel, an automated deposition tool dispenses a polymer bead of width $w$ along an Archimedean spiral:

$$
r(\theta) = r_{\text{inner}} + \frac{w}{2\pi} \theta
$$

To ensure uniform deposition density under a variable concentration profile $C(r)$, the system regulates:
* **Stage Rotation Speed** (to maintain constant linear velocity $v_{\text{linear}}$):

$$
\omega_{\text{stage}}(r) = \frac{v_{\text{linear}}}{r}
$$

---

## ⚖️ Intellectual Property & Patent Status

The technology, mathematical physical modeling, structural apparatus design, and method of separation documented here are protected under international intellectual property frameworks:

* **Patent Title:** *A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation*
* **Application Number:** `202641085541` (Indian Patent Office)
* **Filing Date:** July 13, 2026
* **Publication Date:** October 23, 2026
* **Inventor:** Gurumurthy Swaminathan ([Google Scholar](https://scholar.google.com/citations?user=wpgzVMsAAAAJ&hl=en&authuser=1))

---

## 📚 Citation

If you use this simulation framework, apparatus geometry, web portal, or theoretical model in your research, please cite the published patent application as follows:

```bibtex
@patent{swaminathan2026pfsge,
  author    = {Swaminathan, Gurumurthy},
  title     = {A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation},
  number    = {202641085541},
  type      = {Patent Application},
  year      = {2026},
  month     = {October},
  publisher = {Indian Patent Office},
  url       = {https://pfsge.vercel.app}
}
```
