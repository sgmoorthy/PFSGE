import numpy as np
from PIL import Image, ImageDraw
import io
from pfsge.simulation import run_pfsge_simulation
from pfsge.calculator import compute_spiral_dispensing_parameters
from pfsge.interpreter import process_gel_image, generate_virtual_electropherogram

def test_pipeline():
    print("Testing Simulation...")
    trajectories = run_pfsge_simulation(
        n_particles=50,
        n_steps=100,
        dt=0.1,
        field_magnitude=1.0,
        field_frequency=1.0,
        zeta_0=1.0,
        alpha=0.01,
        noise_strength=0.1
    )
    assert trajectories.shape == (50, 100, 2), "Simulation shape mismatch"
    print("Simulation OK!")

    print("Testing Interpreter (Virtual Electropherogram)...")
    results = generate_virtual_electropherogram(trajectories)
    assert len(results['bin_centers']) > 0, "No bins generated"
    print("Virtual Electropherogram OK!")

    print("Testing Dispenser Calculator...")
    disp = compute_spiral_dispensing_parameters(
        target_alpha=0.05,
        radius_range=(10, 50),
        base_concentration=1.0,
        max_concentration=4.0,
        bead_width=1.5
    )
    assert len(disp['radii']) == 1000, "Dispenser range mismatch"
    print("Dispenser Calculator OK!")

    print("Testing Image Interpreter with synthetic spiral gel image...")
    # Create a 200x200 black image with 3 concentric white circles (bands)
    img = Image.new('L', (200, 200), color=0)
    draw = ImageDraw.Draw(img)
    
    # Draw concentric circles (representing separated DNA bands)
    draw.ellipse([80, 80, 120, 120], outline=255, width=3)
    draw.ellipse([60, 60, 140, 140], outline=200, width=3)
    draw.ellipse([40, 40, 160, 160], outline=150, width=3)
    
    # Save to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()
    
    # Process
    img_results = process_gel_image(img_bytes, center_x=100.0, center_y=100.0, n_bins=50)
    print(f"Detected peaks: {img_results['peak_positions']}")
    assert len(img_results['peak_positions']) > 0, "No peaks detected on synthetic image"
    print("Image Interpreter OK!")
    
    print("\nAll pipeline components verified successfully!")

if __name__ == "__main__":
    test_pipeline()
