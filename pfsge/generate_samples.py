"""
PFSGE Benchmark Sample Gel Generator
Generates 4 scientifically authentic synthetic Archimedean spiral gel scans:
1. Standard 3-Band S. cerevisiae Chromosome Benchmark (High SNR)
2. Extended Megabase Ladder (6-Band High-Density Spectrum)
3. High-Background Fluorometric Scan (Low SNR / Autofluorescence Filter Test)
4. Eccentric Off-Center Loading Scan (Spatial Crosshair Alignment Test)
"""

import os
import numpy as np
from PIL import Image, ImageFilter

def create_sample_gels(output_dirs):
    for out_dir in output_dirs:
        os.makedirs(out_dir, exist_ok=True)

    size = 512
    cx, cy = size // 2, size // 2
    y_grid, x_grid = np.indices((size, size), dtype=np.float64)

    # Helper to generate spiral track line
    def get_spiral_track(center_x, center_y, c_spiral=1.45, max_theta=36*np.pi):
        track = np.zeros((size, size), dtype=np.float64)
        thetas = np.linspace(0, max_theta, 15000)
        radii = 14 + c_spiral * thetas
        valid = radii < (size * 0.46)
        thetas = thetas[valid]
        radii = radii[valid]
        xs = np.clip(np.round(center_x + radii * np.cos(thetas)).astype(int), 0, size - 1)
        ys = np.clip(np.round(center_y + radii * np.sin(thetas)).astype(int), 0, size - 1)
        track[ys, xs] = 30.0
        # Smooth track slightly
        track_img = Image.fromarray(track.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.7))
        return np.array(track_img, dtype=np.float64)

    # -------------------------------------------------------------
    # 1. Standard 3-Band S. cerevisiae Chromosome Benchmark
    # -------------------------------------------------------------
    print("Generating Sample 1: Standard 3-Band Ladder...")
    np.random.seed(42)
    img1 = np.full((size, size), 6.0, dtype=np.float64)
    # Background subtle radial lum
    dist_c = np.sqrt((x_grid - cx)**2 + (y_grid - cy)**2)
    img1 += 18.0 * np.exp(-dist_c / (size * 0.35))

    # Add spiral track
    img1 += get_spiral_track(cx, cy, c_spiral=1.5)

    # Center loading well
    well_mask = dist_c < 9.0
    img1[well_mask] = 160.0
    well_border = (dist_c >= 9.0) & (dist_c <= 11.5)
    img1[well_border] = 230.0

    # 3 distinct bands: 10 Mb (r=62), 5 Mb (r=125), 1 Mb (r=188)
    bands_1 = [
        {'r': 62.0, 'sigma': 4.5, 'amp': 225.0},
        {'r': 125.0, 'sigma': 6.0, 'amp': 210.0},
        {'r': 188.0, 'sigma': 7.5, 'amp': 185.0}
    ]
    for b in bands_1:
        dr = dist_c - b['r']
        profile = b['amp'] * np.exp(-(dr**2) / (2.0 * b['sigma']**2))
        img1 += profile

    # Sensor noise
    noise1 = np.random.normal(0, 3.5, (size, size))
    img1 = np.clip(img1 + noise1, 0, 255).astype(np.uint8)

    # -------------------------------------------------------------
    # 2. Extended Megabase Ladder (6-Band Spectrum)
    # -------------------------------------------------------------
    print("Generating Sample 2: Extended 6-Band Megabase Spectrum...")
    np.random.seed(101)
    img2 = np.full((size, size), 5.0, dtype=np.float64)
    img2 += 14.0 * np.exp(-dist_c / (size * 0.4))
    img2 += get_spiral_track(cx, cy, c_spiral=1.35)

    # Center well
    img2[well_mask] = 150.0
    img2[well_border] = 220.0

    # 6 bands: 12, 8, 5.7, 3.5, 1.8, 0.7 Mb
    bands_2 = [
        {'r': 46.0, 'sigma': 3.5, 'amp': 230.0},
        {'r': 80.0, 'sigma': 4.0, 'amp': 218.0},
        {'r': 114.0, 'sigma': 4.6, 'amp': 205.0},
        {'r': 148.0, 'sigma': 5.2, 'amp': 195.0},
        {'r': 182.0, 'sigma': 5.8, 'amp': 180.0},
        {'r': 216.0, 'sigma': 6.5, 'amp': 165.0}
    ]
    for b in bands_2:
        dr = dist_c - b['r']
        profile = b['amp'] * np.exp(-(dr** dr) / (2.0 * b['sigma']**2) if dr.dtype == np.int64 else -(dr**2) / (2.0 * b['sigma']**2))
        img2 += profile

    noise2 = np.random.normal(0, 4.0, (size, size))
    img2 = np.clip(img2 + noise2, 0, 255).astype(np.uint8)

    # -------------------------------------------------------------
    # 3. High-Background Fluorometric Scan (Low SNR / Auto-fluorescence)
    # -------------------------------------------------------------
    print("Generating Sample 3: High-Background Fluorometric Scan...")
    np.random.seed(202)
    # Non-uniform matrix autofluorescence pedestal (gradient + diffuse blob)
    autofluor = 34.0 + 28.0 * np.exp(-((x_grid - 200)**2 + (y_grid - 280)**2) / (2.0 * 160**2))
    autofluor += 12.0 * np.sin(x_grid / 70.0) * np.cos(y_grid / 80.0)
    img3 = autofluor.copy()
    img3 += get_spiral_track(cx, cy, c_spiral=1.45) * 0.7

    img3[well_mask] = 180.0
    img3[well_border] = 235.0

    bands_3 = [
        {'r': 55.0, 'sigma': 5.5, 'amp': 165.0},
        {'r': 105.0, 'sigma': 7.0, 'amp': 150.0},
        {'r': 156.0, 'sigma': 8.5, 'amp': 135.0},
        {'r': 205.0, 'sigma': 10.0, 'amp': 120.0}
    ]
    for b in bands_3:
        dr = dist_c - b['r']
        profile = b['amp'] * np.exp(-(dr**2) / (2.0 * b['sigma']**2))
        img3 += profile

    # Realistic shot noise + speckle
    noise3 = np.random.normal(0, 11.5, (size, size))
    # Add random camera pixel speckles
    speckles = (np.random.random((size, size)) < 0.003) * np.random.uniform(30, 90, (size, size))
    img3 = np.clip(img3 + noise3 + speckles, 0, 255).astype(np.uint8)

    # -------------------------------------------------------------
    # 4. Eccentric Off-Center Loading Scan (Origin Alignment Test)
    # -------------------------------------------------------------
    print("Generating Sample 4: Eccentric Off-Center Loading Scan...")
    np.random.seed(303)
    off_cx = cx + 42.0  # 298
    off_cy = cy - 30.0  # 226
    dist_off = np.sqrt((x_grid - off_cx)**2 + (y_grid - off_cy)**2)

    img4 = np.full((size, size), 7.0, dtype=np.float64)
    img4 += 16.0 * np.exp(-dist_off / (size * 0.38))
    img4 += get_spiral_track(off_cx, off_cy, c_spiral=1.45)

    # Off-center well
    well_off_mask = dist_off < 9.0
    img4[well_off_mask] = 160.0
    well_off_border = (dist_off >= 9.0) & (dist_off <= 11.5)
    img4[well_off_border] = 230.0

    bands_4 = [
        {'r': 58.0, 'sigma': 5.0, 'amp': 225.0},
        {'r': 118.0, 'sigma': 6.5, 'amp': 210.0},
        {'r': 176.0, 'sigma': 8.0, 'amp': 190.0}
    ]
    for b in bands_4:
        dr = dist_off - b['r']
        profile = b['amp'] * np.exp(-(dr**2) / (2.0 * b['sigma']**2))
        img4 += profile

    noise4 = np.random.normal(0, 3.8, (size, size))
    img4 = np.clip(img4 + noise4, 0, 255).astype(np.uint8)

    # Save to all target directories
    samples = [
        ('benchmark_yeast_standard_3band.png', img1),
        ('benchmark_megabase_ladder_6band.png', img2),
        ('benchmark_high_noise_fluorescence.png', img3),
        ('benchmark_eccentric_offcenter.png', img4)
    ]

    for filename, arr in samples:
        pil_img = Image.fromarray(arr, mode='L')
        # Also convert to RGB so standard viewers / color pickers display it crisply
        pil_rgb = pil_img.convert('RGB')
        for out_dir in output_dirs:
            filepath = os.path.join(out_dir, filename)
            pil_rgb.save(filepath, format='PNG', optimize=True)
            print(f"Saved: {filepath} ({os.path.getsize(filepath)} bytes)")

if __name__ == '__main__':
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dirs = [
        os.path.join(root_dir, "sample_gels"),
        os.path.join(root_dir, "backend", "static", "sample_gels")
    ]
    create_sample_gels(out_dirs)
    print("All benchmark samples successfully generated!")
