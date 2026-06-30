import numpy as np
from scipy.signal import find_peaks
from PIL import Image
import io

def generate_virtual_electropherogram(trajectories: np.ndarray, n_bins: int = 100):
    """Converts 2D terminal trajectories into a 1D virtual electropherogram."""
    terminal_positions = trajectories[:, -1, :]
    radii = np.sqrt(np.sum(terminal_positions**2, axis=1))
    
    hist, bin_edges = np.histogram(radii, bins=n_bins, density=True)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    peaks, _ = find_peaks(hist, prominence=0.05)
    peak_positions = bin_centers[peaks]
    radial_variance = np.var(radii)
    
    return {
        'bin_centers': bin_centers.tolist(),
        'densities': hist.tolist(),
        'peak_indices': peaks.tolist(),
        'peak_positions': peak_positions.tolist(),
        'radial_variance': float(radial_variance)
    }

def process_gel_image(image_bytes: bytes, center_x: float = None, center_y: float = None, n_bins: int = 100):
    """
    Processes an uploaded gel image, computes radial distances from a center, and returns an electropherogram.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('L') # Convert to grayscale
    img_array = np.array(img)
    
    height, width = img_array.shape
    if center_x is None:
        center_x = width / 2.0
    if center_y is None:
        center_y = height / 2.0
        
    y_indices, x_indices = np.indices((height, width))
    radii = np.sqrt((x_indices - center_x)**2 + (y_indices - center_y)**2)
    
    # Flatten the arrays
    radii_flat = radii.flatten()
    intensities_flat = img_array.flatten()
    
    # Filter out pure black background to reduce noise
    mask = intensities_flat > 10
    radii_filtered = radii_flat[mask]
    weights_filtered = intensities_flat[mask]
    
    if len(radii_filtered) == 0:
        return {
            'bin_centers': [],
            'densities': [],
            'peak_indices': [],
            'peak_positions': [],
            'radial_variance': 0.0,
            'center_x': center_x,
            'center_y': center_y
        }
        
    hist, bin_edges = np.histogram(radii_filtered, bins=n_bins, weights=weights_filtered, density=True)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    # Smooth the histogram for peak finding
    from scipy.ndimage import gaussian_filter1d
    hist_smooth = gaussian_filter1d(hist, sigma=2)
    
    peaks, _ = find_peaks(hist_smooth, prominence=np.max(hist_smooth)*0.05)
    peak_positions = bin_centers[peaks]
    
    return {
        'bin_centers': bin_centers.tolist(),
        'densities': hist.tolist(),
        'peak_indices': peaks.tolist(),
        'peak_positions': peak_positions.tolist(),
        'radial_variance': float(np.var(radii_filtered)),
        'center_x': center_x,
        'center_y': center_y
    }
