# PFSGE: Pulsed-Field Spiral Gel Electrophoresis

[![Patent Status](https://img.shields.io/badge/Patent-Application%20Published%20(202641085541)-blue.svg)](https://iprsearch.ipindia.gov.in/publicsearch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Research%20%26%20Simulation-brightgreen.svg)]()

> 📜 **Intellectual Property Notice:**  
> The physical apparatus, architectural geometry, field switching protocols, and core methodologies in this repository are subject to **Indian Patent Application No. 202641085541**, titled *"A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation"*, officially published by the Indian Patent Office under Section 11A of the Patents Act, 1970.

---

Pulsed-Field Spiral Gel Electrophoresis (PFSGE) is an advanced analytical framework and simulation environment for modeling, designing, and analyzing the separation of high-molecular-weight (HMW) DNA molecules in a non-uniform, spiral gel structure.

Unlike traditional Pulsed-Field Gel Electrophoresis (PFGE) which relies on homogeneous gel matrices and discrete switching angles, PFSGE leverages:
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

---

## ⚖️ Intellectual Property & Patent Status

The technology, mathematical physical modeling, structural apparatus design, and method of separation documented here are protected under international intellectual property frameworks:

* **Patent Title:** *A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation*
* **Application Number:** `202641085541` (Indian Patent Office)
* **Filing Date:** July 13, 2026
* **Publication Date:** October 23, 2026
* **Inventor:** Gurumurthy Swaminathan

---

## 📚 Citation

If you use this simulation framework, apparatus geometry, or theoretical model in your research, please cite the published patent application and forthcoming paper as follows:

```bibtex
@patent{swaminathan2026pfsge,
  author    = {Swaminathan, Gurumurthy},
  title     = {A Pulsed-Field Spiral Gel Electrophoresis (PFSGE) Method and Apparatus for High-Molecular-Weight DNA Separation},
  number    = {202641085541},
  type      = {Patent Application},
  year      = {2026},
  month     = {October},
  publisher = {Indian Patent Office}
}
