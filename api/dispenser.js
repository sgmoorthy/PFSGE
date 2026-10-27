export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const target_alpha = parseFloat(body.target_alpha ?? 0.05);
    const r_min = parseFloat(body.r_min ?? 10.0);
    const r_max = parseFloat(body.r_max ?? 60.0);
    const base_concentration = parseFloat(body.base_concentration ?? 1.0);
    const max_concentration = parseFloat(body.max_concentration ?? 4.0);
    const bead_width = parseFloat(body.bead_width ?? 1.5);
    const constant_linear_velocity = parseFloat(body.constant_linear_velocity ?? 15.0);

    const c = bead_width / (2 * Math.PI);
    const theta_max = (r_max - r_min) / c;
    const n_points = 1000;

    const thetas = [];
    const radii = [];
    const omega_stage = [];
    const concentration_profile = [];
    const flow_rates = [];

    const Q_base = constant_linear_velocity * bead_width * 1.0;

    for (let i = 0; i < n_points; i++) {
      const theta = (theta_max * i) / (n_points - 1);
      const r = r_min + c * theta;
      const omega = constant_linear_velocity / r;
      const conc = base_concentration + (max_concentration - base_concentration) * ((target_alpha * r * r) / (target_alpha * r_max * r_max));
      const flow = Q_base * (conc / base_concentration);

      thetas.push(theta);
      radii.push(r);
      omega_stage.push(omega);
      concentration_profile.push(conc);
      flow_rates.push(flow);
    }

    return res.status(200).json({
      radii,
      theta: thetas,
      stage_rotation_speed: omega_stage,
      dispenser_flow_rate: flow_rates,
      polymer_concentration: concentration_profile,
      summary: {
        theta_max_rad: theta_max,
        total_turns: theta_max / (2 * Math.PI),
        initial_rpm: (omega_stage[0] * 60) / (2 * Math.PI),
        final_rpm: (omega_stage[n_points - 1] * 60) / (2 * Math.PI),
        total_path_length_mm: 0.5 * c * (theta_max * Math.sqrt(1 + theta_max * theta_max) + Math.log(theta_max + Math.sqrt(1 + theta_max * theta_max)))
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
