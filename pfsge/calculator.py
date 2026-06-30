import numpy as np

def compute_spiral_dispensing_parameters(
    target_alpha: float,
    radius_range: tuple,
    base_concentration: float,
    max_concentration: float,
    bead_width: float,
    constant_linear_velocity: float = 10.0
) -> dict:
    """
    Maps a desired porosity/drag gradient to machine-level dispensing parameters.
    """
    r_inner, r_outer = radius_range
    c = bead_width / (2 * np.pi)
    theta_max = (r_outer - r_inner) / c
    
    thetas = np.linspace(0, theta_max, 1000)
    radii = r_inner + c * thetas
    
    omega_stage = constant_linear_velocity / radii
    concentration_profile = base_concentration + (max_concentration - base_concentration) * (target_alpha * radii**2) / (target_alpha * r_outer**2)
    
    Q_base = constant_linear_velocity * bead_width * 1.0
    flow_rates = Q_base * (concentration_profile / base_concentration)
    
    return {
        'radii': radii.tolist(),
        'theta': thetas.tolist(),
        'stage_rotation_speed': omega_stage.tolist(),
        'dispenser_flow_rate': flow_rates.tolist(),
        'polymer_concentration': concentration_profile.tolist()
    }
