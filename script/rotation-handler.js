// Rotation handling functions
function initRotationHandler(appState, canvasHandler) {
    const { elements, canvas: canvasState, rotation } = appState;
    const { canvasWrapper, rotationIndicator, resetRotationBtn } = elements;
    
    // Initialize rotation gesture handlers
    function init() {
        canvasWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvasWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvasWrapper.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvasWrapper.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        
        // Reset rotation button
        resetRotationBtn.addEventListener('click', resetRotation);
    }
    
    // Reset rotation to 0 degrees
    function resetRotation() {
        rotation.currentRotation = 0;
        rotation.pageRotations[appState.pages.currentPage - 1] = 0;
        canvasHandler.applyRotation();
        appState.utils.showToast('Rotation reset');
    }
    
    // Handle touch start for rotation detection
    function handleTouchStart(e) {
        // Only detect rotation when 2 or more fingers
        if (e.touches.length >= 2) {
            e.preventDefault(); // Prevent default browser behavior
            
            // We're starting a rotation gesture
            rotation.isRotating = true;
            
            // Record the IDs of the active touches
            rotation.activeTouchIds = [];
            for (let i = 0; i < e.touches.length; i++) {
                rotation.activeTouchIds.push(e.touches[i].identifier);
            }
            
            // Calculate initial positions
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            // Store the initial angle between the two touch points
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            rotation.startAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Show rotation indicator
            rotationIndicator.textContent = `${Math.round(rotation.currentRotation)}°`;
            rotationIndicator.classList.add('visible');
            
            // Disable drawing while rotating
            canvasState.isDrawing = false;
        }
    }
    
    // Handle touch move for rotation
    function handleTouchMove(e) {
        if (rotation.isRotating && e.touches.length >= 2) {
            e.preventDefault(); // Prevent default browser behavior
            
            // Find the two touch points we're tracking
            let touch1, touch2;
            let foundTouches = 0;
            
            // Look for our tracked touch points using their IDs
            for (let i = 0; i < e.touches.length; i++) {
                if (rotation.activeTouchIds.includes(e.touches[i].identifier)) {
                    if (foundTouches === 0) touch1 = e.touches[i];
                    else if (foundTouches === 1) touch2 = e.touches[i];
                    foundTouches++;
                    if (foundTouches >= 2) break;
                }
            }
            
            // If we found our two tracked points
            if (foundTouches >= 2) {
                // Calculate current angle
                const dx = touch2.clientX - touch1.clientX;
                const dy = touch2.clientY - touch1.clientY;
                const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                // Calculate rotation change
                let angleDiff = currentAngle - rotation.startAngle;
                
                // Update current rotation (with some smoothing)
                rotation.currentRotation = (rotation.currentRotation + angleDiff) % 360;
                
                // Save rotation for this page
                rotation.pageRotations[appState.pages.currentPage - 1] = rotation.currentRotation;
                
                // Reset start angle for incremental rotation
                rotation.startAngle = currentAngle;
                
                // Apply the rotation
                canvasHandler.applyRotation();
                
                // Update rotation indicator
                rotationIndicator.textContent = `${Math.round(rotation.currentRotation)}°`;
            }
        }
    }
    
    // Handle touch end for rotation
    function handleTouchEnd(e) {
        if (rotation.isRotating) {
            // Check if we still have 2 or more touches
            if (e.touches.length < 2) {
                rotation.isRotating = false;
                
                // Hide rotation indicator after a delay
                setTimeout(() => {
                    rotationIndicator.classList.remove('visible');
                }, 1000);
            }
        }
    }
    
    // Initialize module
    init();
    
    // Return public methods
    return {
        resetRotation,
        getCurrentRotation: () => rotation.currentRotation
    };
}