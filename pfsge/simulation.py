import numpy as np

def run_pfsge_simulation(
    n_particles: int,
    n_steps: int,
    dt: float,
    field_magnitude: float,
    field_frequency: float,
    zeta_0: float,
    alpha: float,
    noise_strength: float,
    charge: float = 1.0,
    seed: int = None
) -> np.ndarray:
    """
    Simulates the 2D trajectories of DNA segments in a spiral gel under a rotating electric field.
    
    Parameters:
    -----------
    n_particles : int
        Number of DNA fragments to simulate.
    n_steps : int
        Number of time steps for the simulation.
    dt : float
        Time step size.
    field_magnitude : float
        Magnitude of the rotating electric field.
    field_frequency : float
        Rotational frequency of the electric field (radians per unit time).
    zeta_0 : float
        Base drag coefficient at the origin.
    alpha : float
        Programmable drag gradient parameter (radially dependent).
    noise_strength : float
        Base amplitude of Brownian thermal noise.
    charge : float, optional
        Effective charge of the DNA fragment (default: 1.0).
    seed : int, optional
        Random seed for reproducibility.
        
    Returns:
    --------
    np.ndarray
        Array of shape [n_particles, n_steps, 2] containing the (x, y) coordinates of each particle.
    """
    if seed is not None:
        np.random.seed(seed)
        
    trajectories = np.zeros((n_particles, n_steps, 2))
    trajectories[:, 0, :] = np.random.normal(0, 0.01, (n_particles, 2))
    times = np.arange(n_steps) * dt
    
    for t_idx in range(1, n_steps):
        t = times[t_idx-1]
        current_pos = trajectories[:, t_idx-1, :]
        r_sq = np.sum(current_pos**2, axis=1)
        local_zeta = zeta_0 * (1 + alpha * r_sq)
        
        E_x = field_magnitude * np.cos(field_frequency * t)
        E_y = field_magnitude * np.sin(field_frequency * t)
        
        drift_x = (charge * E_x) / local_zeta
        drift_y = (charge * E_y) / local_zeta
        drift = np.column_stack((drift_x, drift_y))
        
        local_noise_std = noise_strength / np.sqrt(local_zeta)
        noise = np.random.normal(0, 1, (n_particles, 2)) * local_noise_std[:, np.newaxis] * np.sqrt(dt)
        
        trajectories[:, t_idx, :] = current_pos + drift * dt + noise
        
    return trajectories
