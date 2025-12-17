// ... (Imports and component definition remain the same)

const RollingDiskSimulation = () => {
    // ... (State definitions remain the same)
    
    // Physical parameters
    const g = 9.81; // m/s²
    const R_PIXELS = 40; // Disk radius (pixels) - INCREASED for better visibility
    const m = 1; // Mass (kg)
    const mu_s = 0.5; // Static friction coefficient
    const mu_k = 0.3; // Kinetic friction coefficient
    
    // Simulation state
    const [position, setPosition] = useState({ x: 50, y: 0, theta: 0 }); // x is distance along plane (m), y is not used, theta is angle
    const [velocity, setVelocity] = useState({ v: 0, omega: 0 });
    const [forces, setForces] = useState({ friction: 0, normal: 0 });
    
    // New state to map physical distance to pixels
    const [xPixels, setXPixels] = useState(100); 

    const dt = 0.05; // Increased dt for smoother API calls / slower visual speed
    
    // --- REMOVE calculateAcceleration and checkTransition functions here ---
    // Physics is now handled by Flask

    // Update simulation (Replaced with API call)
    useEffect(() => {
        if (!isPlaying) return;
        
        const interval = setInterval(() => {
            // 1. API Call to Flask
            fetch('http://127.0.0.1:5000/api/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    angle: angle,
                    mu_s: mu_s,
                    mu_k: mu_k,
                    mode: mode,
                    dt: dt
                }),
            })
            .then(res => res.json())
            .then(data => {
                // 2. Update state from Flask response
                // data = { x: new_x_m, v: new_v_m_s, phi: new_phi_rad, omega: new_omega_rad_s, T: ..., N: ..., time: ... }
                
                // Map the physical position (x, in meters) to screen position (xPixels)
                // Use a scale factor, e.g., 50 pixels per meter.
                const scale_factor = 50; 
                const newXPixels = 100 + data.x * scale_factor; // Starts at 100 pixels

                setPosition(prev => ({ 
                    x: data.x, // Physical position (m)
                    y: 0,      // Unused (for simplicity)
                    theta: data.phi // Rotation angle (rad)
                }));
                setXPixels(newXPixels); // Pixel position for drawing
                
                setVelocity({ v: data.v, omega: data.omega });
                setForces({ friction: data.T, normal: data.N });
                setTime(data.time);
                
                // Check canvas limits
                if (newXPixels > canvasRef.current.width - R_PIXELS) {
                    reset();
                }
            })
            .catch(error => console.error("Error updating simulation:", error));
            
        }, dt * 1000); // dt is in seconds, *1000 for setInterval in milliseconds
        
        return () => clearInterval(interval);
    }, [isPlaying, angle, mode, mu_s, mu_k]);
    
    const reset = () => {
        // API call to Flask to reset the server state
        fetch('http://127.0.0.1:5000/api/reset', { method: 'POST' })
            .then(() => {
                setIsPlaying(false);
                setPosition({ x: 0, y: 0, theta: 0 });
                setXPixels(100);
                setVelocity({ v: 0, omega: 0 });
                setTime(0);
                setForces({ friction: 0, normal: 0 });
            })
            .catch(error => console.error("Error resetting state:", error));
    };

    // Draw on canvas (Updated to draw DOWN the plane)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const angleRad = (angle * Math.PI) / 180;
        const groundY = 400; // Starting Y coordinate for the plane

        // 1. Draw the inclined plane (Moving DOWN from left to right)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Start: Top-Left (x=50, y=groundY)
        ctx.moveTo(50, groundY);
        // End: Bottom-Right (x=750, y=groundY + distance*tan(theta))
        const distance = 700;
        ctx.lineTo(50 + distance * Math.cos(angleRad), groundY + distance * Math.sin(angleRad)); 
        ctx.stroke();

        // 2. Calculate Disk Position on the Plane
        // This math places the disk center R_PIXELS perpendicularly above the plane,
        // starting at the initial X position (100 pixels) and moving along the plane.
        
        const diskX = xPixels;
        
        // This is the Y-coordinate of the contact point on the plane
        const contactY = groundY + (diskX - 100) * Math.tan(angleRad);

        // The disk center is R_PIXELS *PERPENDICULARLY* above the contact point
        const diskY = contactY - R_PIXELS * Math.cos(angleRad); // Vertical offset from contact point

        // 3. Draw the disk
        ctx.fillStyle = mode === 'rolling' ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(diskX, diskY, R_PIXELS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 4. Radius showing rotation (using R_PIXELS)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(diskX, diskY);
        ctx.lineTo(
            diskX + R_PIXELS * Math.cos(position.theta - angleRad), // Subtract angleRad to align rotation to inclined plane
            diskY + R_PIXELS * Math.sin(position.theta - angleRad)
        );
        ctx.stroke();
        
        // 5. Force vectors (T and N) - This part is complex to draw accurately and is optional.
        // For simplicity, let's skip complex vector drawing in the skeleton.
        
    }, [xPixels, position.theta, angle, mode, forces]);
    
    // ... (togglePlay and return statement remain the same)
}

// export default RollingDiskSimulation;