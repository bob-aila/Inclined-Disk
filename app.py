from flask import Flask, request, jsonify, render_template
import numpy as np

app = Flask(__name__)

# --- Physical Constants ---
R_PHYS = 0.1  # Radius (m)
m = 1.0       # Mass (kg)
g = 9.81      # Gravity (m/s²)
I = 0.5 * m * R_PHYS**2 # Moment of Inertia for a disk

# Global state dictionary to hold the current state across requests
state = {
    'x': 0.0, 'v': 0.0, 'phi': 0.0, 'omega': 0.0,
    'T': 0.0, 'N': 0.0, 'time': 0.0,
    'current_regime': 'Rest' # Added to display the current motion type
}

# --- STATIC FRICTION CONSTANT (Fixed as requested) ---
MU_S_DEFAULT = 0.50 

@app.route('/')
def index():
    """Serves the main HTML page from the templates folder."""
    return render_template('index.html')

@app.route('/api/reset', methods=['POST'])
def reset_state():
    """Resets the simulation state."""
    global state
    state = {
        'x': 0.0, 'v': 0.0, 'phi': 0.0, 'omega': 0.0,
        'T': 0.0, 'N': 0.0, 'time': 0.0,
        'current_regime': 'Rest'
    }
    return jsonify({'status': 'ok', 'state': state})

@app.route('/api/update', methods=['POST'])
def update_simulation():
    """Calculates the next step of the simulation using Euler integration."""
    data = request.json
    
    # Parameters from the frontend
    angle_deg = data.get('angle', 30)
    mu_k = data.get('mu_k', 0.10) 
    mode = data.get('mode', 'sliproll') # Changed default mode
    dt = data.get('dt', 0.05) 

    # --- Use the fixed static friction constant ---
    mu_s = MU_S_DEFAULT 

    theta = np.deg2rad(angle_deg)
    
    # Get current state
    v = state['v']
    
    # Calculate key constants
    mg_sin_theta = m * g * np.sin(theta)
    mg_cos_theta = m * g * np.cos(theta)
    N = mg_cos_theta

    # Calculate accelerations and forces
    a = 0.0
    alpha = 0.0
    T_mag = 0.0
    
    # Pre-calculate required friction for pure rolling (used in the sliproll condition)
    T_roll_required = (1.0 / 3.0) * mg_sin_theta
    F_s_max = mu_s * N # Maximum possible static friction (mu_s * m * g * cos(theta))

    # --- NEW: SLIPROLL MODE ---
    if mode == 'sliproll':
        # Condition: Check if T_required > T_max or tan(theta) > 3*mu_s (for disk)
        
        # Check if the required static friction is greater than the maximum available static friction
        if T_roll_required <= F_s_max:
            # Case 1: PURE ROLLING (Static friction holds)
            a = (2.0 / 3.0) * g * np.sin(theta)
            alpha = a / R_PHYS
            T_mag = T_roll_required
            state['current_regime'] = 'Pure Rolling'
        else:
            # Case 2: SLIPPING (Static friction fails, use kinetic friction)
            T_mag = mu_k * N
            T_force_vector = -T_mag 
            
            # Translational: m*a = mg*sin(theta) - T_mag
            a = g * np.sin(theta) + T_force_vector / m
            
            # Rotational: I*alpha = R * T_mag (The disk still rotates due to kinetic friction)
            alpha = R_PHYS * T_mag / I
            state['current_regime'] = 'Slipping'
            
    elif mode == 'rolling':
        # Pure Rolling (forced)
        a = (2.0 / 3.0) * g * np.sin(theta)
        alpha = a / R_PHYS
        T_mag = (1.0 / 3.0) * mg_sin_theta 
        state['current_regime'] = 'Pure Rolling (Forced)'
    
    elif mode == 'sliding_block': # Renamed from 'slipping' for clarity
        # Pure Sliding (No rotation, like a block)
        T_mag = mu_k * N
        T_force_vector = -T_mag 
        
        a = g * np.sin(theta) + T_force_vector / m
        alpha = 0.0 # Force alpha to zero for block-like sliding
        state['current_regime'] = 'Pure Sliding'

    # --- Euler Integration ---
    state['v'] += a * dt
    state['omega'] += alpha * dt
    
    # The disk moves along the plane (x, in meters)
    state['x'] += state['v'] * dt
    state['phi'] += state['omega'] * dt
    state['time'] += dt
    
    # Update forces in state
    state['T'] = T_mag # Store magnitude for display
    state['N'] = N

    return jsonify(state)

if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True)