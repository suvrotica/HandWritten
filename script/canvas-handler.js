// Canvas drawing and manipulation functions
function initCanvasHandler(appState) {
    const { elements, canvas: canvasState, pages, rotation, paper } = appState;
    const { canvas, ctx } = elements;
    
    return {
        // Resize canvas to fit its container with A4 ratio
        resizeCanvas: function() {
            const container = canvas.parentElement.parentElement;
            
            // Always prioritize using full width for A4
            canvas.width = container.clientWidth;
            // Calculate height based on A4 aspect ratio (1:1.414)
            canvas.height = canvas.width * 1.414;
            
            // Scroll to top to ensure paper top is visible
            container.scrollTop = 0;
            
            this.redrawCanvas();
        },
        
        // Redraw canvas with current page content and ruled lines
        redrawCanvas: function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Always draw ruled lines first
            this.drawRuledLines();
            
            // Draw page content
            const currentPageIndex = pages.currentPage - 1;
            if (pages.userDrawings[currentPageIndex]) {
                // Draw just the user's drawings on top of ruled lines
                ctx.drawImage(pages.userDrawings[currentPageIndex], 0, 0);
            }
            
            // Apply the saved rotation for this page
            rotation.currentRotation = rotation.pageRotations[currentPageIndex] || 0;
            this.applyRotation();
        },
        
        // Draw ruled lines and margins
        drawRuledLines: function() {
            // Fill with very light background color to simulate paper
            ctx.fillStyle = 'rgba(252, 252, 250, 1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw horizontal ruled lines
            ctx.beginPath();
            ctx.strokeStyle = paper.LINE_COLOR;
            ctx.lineWidth = 1;
            
            // Start from the top margin and draw lines with even spacing
            for (let y = paper.MARGIN_TOP; y < canvas.height - paper.MARGIN_BOTTOM; y += paper.LINE_SPACING) {
                ctx.moveTo(paper.MARGIN_LEFT, y);
                ctx.lineTo(canvas.width - paper.MARGIN_RIGHT, y);
            }
            ctx.stroke();
            
            // Draw margin line
            ctx.beginPath();
            ctx.strokeStyle = paper.MARGIN_LINE_COLOR;
            ctx.lineWidth = 1;
            
            // Left margin vertical line
            ctx.moveTo(paper.MARGIN_LEFT, paper.MARGIN_TOP);
            ctx.lineTo(paper.MARGIN_LEFT, canvas.height - paper.MARGIN_BOTTOM);
            
            // Top margin horizontal line
            ctx.moveTo(paper.MARGIN_LEFT, paper.MARGIN_TOP);
            ctx.lineTo(canvas.width - paper.MARGIN_RIGHT, paper.MARGIN_TOP);
            
            // Bottom margin horizontal line
            ctx.moveTo(paper.MARGIN_LEFT, canvas.height - paper.MARGIN_BOTTOM);
            ctx.lineTo(canvas.width - paper.MARGIN_RIGHT, canvas.height - paper.MARGIN_BOTTOM);
            
            ctx.stroke();
        },
        
        // Apply current rotation to the canvas wrapper
        applyRotation: function() {
            elements.canvasWrapper.style.transform = `rotate(${rotation.currentRotation}deg)`;
        },
        
        // Capture user drawings only - without ruled lines or background
        captureUserDrawings: function() {
            const currentPageIndex = pages.currentPage - 1;
            
            // If there are no drawings yet
            if (!pages.pages[currentPageIndex]) {
                return null;
            }
            
            // Create an off-screen canvas to process the content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // First, get the full canvas with background and lines
            tempCtx.drawImage(canvas, 0, 0);
            
            // Now recreate a clean version with just the drawings
            const cleanCanvas = document.createElement('canvas');
            cleanCanvas.width = canvas.width;
            cleanCanvas.height = canvas.height;
            const cleanCtx = cleanCanvas.getContext('2d');
            
            // Fill with transparent background instead of white
            cleanCtx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height);
            
            // Get pixel data to process
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Create a new image data object for the clean version
            const cleanImageData = cleanCtx.createImageData(cleanCanvas.width, cleanCanvas.height);
            const cleanData = cleanImageData.data;
            
            // Color ranges for the ruled lines and background
            const isBackgroundOrLine = (r, g, b) => {
                // Check if it's the white/off-white background
                const isWhitish = r > 250 && g > 250 && b > 248;
                
                // Check if it's a blue ruled line (approximate)
                const isRuledLine = r > 165 && r < 180 && g > 210 && g < 225 && b > 225 && b < 240;
                
                // Check if it's a red margin line (approximate)
                const isMarginLine = r > 250 && g < 10 && b < 10;
                
                return isWhitish || isRuledLine || isMarginLine;
            };
            
            // Copy non-background, non-line pixels to the clean image
            for (let i = 0; i < data.length; i += 4) {
                if (!isBackgroundOrLine(data[i], data[i + 1], data[i + 2]) && data[i + 3] > 0) {
                    cleanData[i] = data[i];       // R
                    cleanData[i + 1] = data[i + 1];   // G
                    cleanData[i + 2] = data[i + 2];   // B
                    cleanData[i + 3] = data[i + 3];   // A
                }
            }
            
            // Put the processed image data onto the clean canvas
            cleanCtx.putImageData(cleanImageData, 0, 0);
            
            return cleanCanvas;
        },
        
        // Save current canvas state to undo stack
        saveState: function() {
            const currentPageIndex = pages.currentPage - 1;
            const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pages.undoStacks[currentPageIndex].push(currentState);
            
            // Limit stack size
            if (pages.undoStacks[currentPageIndex].length > 10) {
                pages.undoStacks[currentPageIndex].shift();
            }
            
            // Save the full canvas with background and lines
            pages.pages[currentPageIndex] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Save just the user's drawings
            pages.userDrawings[currentPageIndex] = this.captureUserDrawings();
            
            // Save the rotation angle
            rotation.pageRotations[currentPageIndex] = rotation.currentRotation;
        },
        
        // Undo last action
        undo: function() {
            const currentPageIndex = pages.currentPage - 1;
            
            if (pages.undoStacks[currentPageIndex].length <= 1) {
                // Clear if only initial state
                this.clearCanvas();
                return;
            }
            
            // Remove current state
            pages.undoStacks[currentPageIndex].pop();
            
            // Restore previous state
            if (pages.undoStacks[currentPageIndex].length > 0) {
                const prevState = pages.undoStacks[currentPageIndex][pages.undoStacks[currentPageIndex].length - 1];
                ctx.putImageData(prevState, 0, 0);
                
                // Update user drawings
                pages.userDrawings[currentPageIndex] = this.captureUserDrawings();
            } else {
                this.clearCanvas();
            }
        },
        
        // Clear canvas
        clearCanvas: function() {
            const currentPageIndex = pages.currentPage - 1;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Always redraw the ruled lines
            this.drawRuledLines();
            
            pages.undoStacks[currentPageIndex] = [];
            pages.userDrawings[currentPageIndex] = null;
            this.saveState(); // Save the clear state
        },
        
        // Adjust mouse/touch coordinates based on rotation
        adjustCoordsForRotation: function(x, y) {
            // If there's no rotation, return coordinates as is
            if (rotation.currentRotation === 0) {
                return { x, y };
            }
            
            // Get the canvas rectangle
            const rect = canvas.getBoundingClientRect();
            
            // Calculate center relative to the canvas element itself, not its bounding rect
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Convert touch coordinates to be relative to the center of the canvas
            const relativeX = x - (rect.width / 2);
            const relativeY = y - (rect.height / 2);
            
            // Convert rotation from degrees to radians
            const angleInRadians = rotation.currentRotation * Math.PI / 180;
            
            // Apply inverse rotation matrix
            const rotatedX = relativeX * Math.cos(angleInRadians) + relativeY * Math.sin(angleInRadians);
            const rotatedY = -relativeX * Math.sin(angleInRadians) + relativeY * Math.cos(angleInRadians);
            
            // Return coordinates relative to canvas origin (0,0)
            return {
                x: rotatedX + centerX,
                y: rotatedY + centerY
            };
        },
        
        // Start drawing
        startDrawing: function(e) {
            // Don't start drawing if we're in rotation mode
            if (rotation.isRotating || (e.touches && e.touches.length >= 2)) {
                return;
            }
            
            canvasState.isDrawing = true;
            const pos = this.getPointerPosition(e);
            canvasState.lastX = pos.x;
            canvasState.lastY = pos.y;
            
            // Save state for undo
            const currentPageIndex = pages.currentPage - 1;
            if (pages.undoStacks[currentPageIndex].length === 0) {
                this.saveState();
            }
        },
        
        // Draw on the canvas
        draw: function(e) {
            if (!canvasState.isDrawing || rotation.isRotating) return;
            e.preventDefault();
            
            const pos = this.getPointerPosition(e);
            let x = pos.x;
            let y = pos.y;
            
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            
            // Drawing based on tool
            if (canvasState.currentTool === 'pencil') {
                // Pencil with texture
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(
                        canvasState.lastX + (Math.random() * 2 - 1) * 0.5,
                        canvasState.lastY + (Math.random() * 2 - 1) * 0.5
                    );
                    ctx.lineTo(
                        x + (Math.random() * 2 - 1) * 0.5,
                        y + (Math.random() * 2 - 1) * 0.5
                    );
                    
                    // Get pressure if available
                    let pressure = e.pressure !== undefined ? e.pressure : 0.7;
                    if (pressure === 0) pressure = 0.3; // Minimum pressure
                    
                    // Adjust width and opacity based on pressure
                    const width = canvasState.currentWidth * pressure;
                    const opacity = Math.min(0.3 + pressure * 0.5, 0.9);
                    
                    ctx.strokeStyle = `rgba(51, 51, 51, ${opacity})`;
                    ctx.lineWidth = width * (0.8 + Math.random() * 0.2);
                    ctx.stroke();
                }
            } else if (canvasState.currentTool === 'brush') {
                // Brush with pressure sensitivity
                let pressure = e.pressure !== undefined ? e.pressure : 0.7;
                if (pressure === 0) pressure = 0.3; // Minimum pressure
                
                // Wider, softer stroke for brush
                ctx.beginPath();
                ctx.moveTo(canvasState.lastX, canvasState.lastY);
                ctx.lineTo(x, y);
                
                ctx.lineWidth = canvasState.currentWidth * 1.5 * pressure;
                ctx.strokeStyle = `rgba(51, 51, 51, ${0.2 + pressure * 0.3})`;
                ctx.stroke();
                
                // Darker center
                ctx.beginPath();
                ctx.moveTo(canvasState.lastX, canvasState.lastY);
                ctx.lineTo(x, y);
                ctx.lineWidth = canvasState.currentWidth * pressure * 0.7;
                ctx.strokeStyle = `rgba(51, 51, 51, ${0.4 + pressure * 0.4})`;
                ctx.stroke();
            } else if (canvasState.currentTool === 'eraser') {
                // Eraser
                ctx.beginPath();
                ctx.moveTo(canvasState.lastX, canvasState.lastY);
                ctx.lineTo(x, y);
                ctx.lineWidth = canvasState.currentWidth * 2;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            }
            
            canvasState.lastX = x;
            canvasState.lastY = y;
        },
        
        // Stop drawing
        stopDrawing: function() {
            if (canvasState.isDrawing) {
                canvasState.isDrawing = false;
                this.saveState();
            }
        },
        
        // Get pointer position
        getPointerPosition: function(e) {
            const rect = canvas.getBoundingClientRect();
            let x, y;
            
            if (e.type.includes('touch')) {
                const touch = e.touches[0] || e.changedTouches[0];
                x = touch.clientX - rect.left;
                y = touch.clientY - rect.top;
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }
            
            // Adjust coordinates for rotation
            if (rotation.currentRotation !== 0) {
                const adjusted = this.adjustCoordsForRotation(x, y);
                x = adjusted.x;
                y = adjusted.y;
            }
            
            return { x, y };
        }
    };
}