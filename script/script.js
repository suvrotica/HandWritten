// Wait for all components to be loaded before initializing the app
document.addEventListener('allComponentsLoaded', function () {
    // Now initialize the app
    initializeApp();
});

function initializeApp() {
    // DOM Elements
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const strokeWidthInput = document.getElementById('stroke-width');
    const widthDisplay = document.getElementById('width-display');
    const pencilTool = document.getElementById('pencil-tool');
    const brushTool = document.getElementById('brush-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const clearBtn = document.getElementById('clear-btn');
    const undoBtn = document.getElementById('undo-btn');
    const addPageBtn = document.getElementById('add-page-btn');
    const publishBtn = document.getElementById('publish-btn');
    const pageSelect = document.getElementById('page-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const moveLeftBtn = document.getElementById('move-left-btn');
    const moveRightBtn = document.getElementById('move-right-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const blogPreview = document.getElementById('blog-preview');
    const blogTitle = document.querySelector('.blog-title');
    const toast = document.getElementById('toast');
    const canvasContainer = document.querySelector('.canvas-container');

    // Variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'pencil';
    let currentWidth = strokeWidthInput.value;
    let currentPage = 1;
    let totalPages = 1;
    let pages = [null]; // Store canvas image data for each page
    let undoStacks = [[]]; // Store undo history for each page
    let userDrawings = [null]; // Store only user's drawings without background or lines

    // A4 Paper Variables (always enabled now)
    const LINE_SPACING = 30; // Pixels between ruled lines
    const MARGIN_LEFT = 60; // Left margin in pixels
    const MARGIN_RIGHT = 40; // Right margin in pixels
    const MARGIN_TOP = 40; // Top margin in pixels
    const MARGIN_BOTTOM = 40; // Bottom margin in pixels
    const LINE_COLOR = 'rgba(173, 216, 230, 0.5)'; // Light blue with opacity
    const MARGIN_LINE_COLOR = 'rgba(255, 0, 0, 0.2)'; // Light red for margin indicator

    // Initialize
    function init() {
        // Always use A4 mode
        canvasContainer.classList.add('a4-mode');
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        updatePageSelect();
        updatePageControls();
    }

    // Set canvas size based on A4 dimensions
    function resizeCanvas() {
        const container = canvas.parentElement;
        
        // Always prioritize using full width for A4
        canvas.width = container.clientWidth;
        // Calculate height based on A4 aspect ratio (1:1.414)
        canvas.height = canvas.width * 1.414;
        
        // Scroll to top to ensure paper top is visible
        container.scrollTop = 0;
        
        redrawCanvas();
    }

    // Redraw canvas with current page content and ruled lines
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Always draw ruled lines first
        drawRuledLines();
        
        // Draw page content
        if (userDrawings[currentPage - 1]) {
            // Draw just the user's drawings on top of ruled lines
            ctx.drawImage(userDrawings[currentPage - 1], 0, 0);
        }
    }

    // Draw ruled lines and margins
    function drawRuledLines() {
        // Fill with very light background color to simulate paper
        ctx.fillStyle = 'rgba(252, 252, 250, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw horizontal ruled lines
        ctx.beginPath();
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 1;
        
        // Start from the top margin and draw lines with even spacing
        for (let y = MARGIN_TOP; y < canvas.height - MARGIN_BOTTOM; y += LINE_SPACING) {
            ctx.moveTo(MARGIN_LEFT, y);
            ctx.lineTo(canvas.width - MARGIN_RIGHT, y);
        }
        ctx.stroke();
        
        // Draw margin line
        ctx.beginPath();
        ctx.strokeStyle = MARGIN_LINE_COLOR;
        ctx.lineWidth = 1;
        
        // Left margin vertical line
        ctx.moveTo(MARGIN_LEFT, MARGIN_TOP);
        ctx.lineTo(MARGIN_LEFT, canvas.height - MARGIN_BOTTOM);
        
        // Top margin horizontal line
        ctx.moveTo(MARGIN_LEFT, MARGIN_TOP);
        ctx.lineTo(canvas.width - MARGIN_RIGHT, MARGIN_TOP);
        
        // Bottom margin horizontal line
        ctx.moveTo(MARGIN_LEFT, canvas.height - MARGIN_BOTTOM);
        ctx.lineTo(canvas.width - MARGIN_RIGHT, canvas.height - MARGIN_BOTTOM);
        
        ctx.stroke();
    }

    // Capture user drawings only
    function captureUserDrawings() {
        // If there are no drawings yet
        if (!pages[currentPage - 1]) {
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
        
        // Fill with plain white background
        cleanCtx.fillStyle = 'white';
        cleanCtx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
        
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
            if (!isBackgroundOrLine(data[i], data[i+1], data[i+2]) && data[i+3] > 0) {
                cleanData[i] = data[i];       // R
                cleanData[i+1] = data[i+1];   // G
                cleanData[i+2] = data[i+2];   // B
                cleanData[i+3] = data[i+3];   // A
            }
        }
        
        // Put the processed image data onto the clean canvas
        cleanCtx.putImageData(cleanImageData, 0, 0);
        
        return cleanCanvas;
    }

    // Save current canvas state to undo stack
    function saveState() {
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStacks[currentPage - 1].push(currentState);

        // Limit stack size
        if (undoStacks[currentPage - 1].length > 10) {
            undoStacks[currentPage - 1].shift();
        }
        
        // Save the full canvas with background and lines
        pages[currentPage - 1] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Save just the user's drawings
        userDrawings[currentPage - 1] = captureUserDrawings();
    }

    // Undo last action
    function undo() {
        if (undoStacks[currentPage - 1].length <= 1) {
            // Clear if only initial state
            clearCanvas();
            return;
        }

        // Remove current state
        undoStacks[currentPage - 1].pop();

        // Restore previous state
        if (undoStacks[currentPage - 1].length > 0) {
            const prevState = undoStacks[currentPage - 1][undoStacks[currentPage - 1].length - 1];
            ctx.putImageData(prevState, 0, 0);
            
            // Update user drawings
            userDrawings[currentPage - 1] = captureUserDrawings();
        } else {
            clearCanvas();
        }
    }

    // Clear canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Always redraw the ruled lines
        drawRuledLines();
        
        undoStacks[currentPage - 1] = [];
        userDrawings[currentPage - 1] = null;
        saveState(); // Save the clear state
    }

    // Add a new page
    function addPage() {
        // Save current page
        pages[currentPage - 1] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        userDrawings[currentPage - 1] = captureUserDrawings();

        // Add new page
        totalPages++;
        currentPage = totalPages;
        pages.push(null);
        userDrawings.push(null);
        undoStacks.push([]);

        // Clear canvas for new page
        clearCanvas();
        
        // Update UI
        updatePageSelect();
        updatePageControls();
        showToast('New page added');
    }

    // Switch to page
    function switchPage(pageNum) {
        if (pageNum < 1 || pageNum > totalPages) return;

        // Save current page
        pages[currentPage - 1] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        userDrawings[currentPage - 1] = captureUserDrawings();

        // Switch to selected page
        currentPage = pageNum;

        // Redraw canvas
        redrawCanvas();

        // Update UI
        updatePageSelect();
        updatePageControls();
    }

    // Move current page to a new position
    function movePage(direction) {
        // Save current page
        pages[currentPage - 1] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        userDrawings[currentPage - 1] = captureUserDrawings();

        let newPosition;
        if (direction === 'left' && currentPage > 1) {
            newPosition = currentPage - 1;
        } else if (direction === 'right' && currentPage < totalPages) {
            newPosition = currentPage + 1;
        } else {
            return; // Invalid move
        }

        // Get the page being moved
        const movingPage = pages[currentPage - 1];
        const movingDrawings = userDrawings[currentPage - 1];
        const movingUndoStack = undoStacks[currentPage - 1];

        // Remove from current position
        pages.splice(currentPage - 1, 1);
        userDrawings.splice(currentPage - 1, 1);
        undoStacks.splice(currentPage - 1, 1);

        // Insert at new position
        pages.splice(newPosition - 1, 0, movingPage);
        userDrawings.splice(newPosition - 1, 0, movingDrawings);
        undoStacks.splice(newPosition - 1, 0, movingUndoStack);

        // Update current page reference
        currentPage = newPosition;

        // Update UI
        updatePageSelect();
        updatePageControls();
        showToast(`Page moved to position ${newPosition}`);
    }

    // Delete current page
    function deletePage() {
        if (totalPages <= 1) {
            showToast('Cannot delete the only page');
            return;
        }

        // Remove page
        pages.splice(currentPage - 1, 1);
        userDrawings.splice(currentPage - 1, 1);
        undoStacks.splice(currentPage - 1, 1);
        totalPages--;

        // Adjust current page if needed
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        // Redraw canvas
        redrawCanvas();

        // Update UI
        updatePageSelect();
        updatePageControls();
        showToast('Page deleted');
    }

    // Update page dropdown
    function updatePageSelect() {
        pageSelect.innerHTML = '';

        for (let i = 0; i < totalPages; i++) {
            const option = document.createElement('option');
            option.value = i + 1;
            option.textContent = `Page ${i + 1}`;

            if (i + 1 === currentPage) {
                option.selected = true;
            }

            pageSelect.appendChild(option);
        }
    }

    // Update page navigation controls
    function updatePageControls() {
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        moveLeftBtn.disabled = currentPage <= 1;
        moveRightBtn.disabled = currentPage >= totalPages;
        deleteBtn.disabled = totalPages <= 1;
    }

    // Show toast notification
    function showToast(message) {
        toast.textContent = message;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    }

    // Generate blog preview using only the user drawings (no ruled lines)
    function generatePreview() {
        // Save current page first
        pages[currentPage - 1] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        userDrawings[currentPage - 1] = captureUserDrawings();

        let blogHTML = '';

        for (let i = 0; i < totalPages; i++) {
            const pageNum = i + 1;
            
            // Create a temporary canvas for the clean version
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Fill with white background
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw just the user's drawings if available
            if (userDrawings[i]) {
                tempCtx.drawImage(userDrawings[i], 0, 0);
            }

            // Get image as data URL
            const imageUrl = tempCanvas.toDataURL('image/png');

            // Add image to the preview
            blogHTML += `
                <img src="${imageUrl}" alt="Handwritten content page ${pageNum}">
            `;
        }

        // Update the preview
        blogPreview.innerHTML = blogHTML;
    }

    // Publish blog
    function publishBlog() {
        generatePreview();
        const title = blogTitle.value || 'Untitled Blog';
        showToast(`Handwritten blog "${title}" published! (Simulated)`);
    }

    // Start drawing
    function startDrawing(e) {
        isDrawing = true;
        const pos = getPointerPosition(e);
        lastX = pos.x;
        lastY = pos.y;

        // Save state for undo
        if (undoStacks[currentPage - 1].length === 0) {
            saveState();
        }
    }

    // Draw on the canvas
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();

        const pos = getPointerPosition(e);
        const x = pos.x;
        const y = pos.y;

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Drawing based on tool
        if (currentTool === 'pencil') {
            // Pencil with texture
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(
                    lastX + (Math.random() * 2 - 1) * 0.5,
                    lastY + (Math.random() * 2 - 1) * 0.5
                );
                ctx.lineTo(
                    x + (Math.random() * 2 - 1) * 0.5,
                    y + (Math.random() * 2 - 1) * 0.5
                );

                // Get pressure if available
                let pressure = e.pressure !== undefined ? e.pressure : 0.7;
                if (pressure === 0) pressure = 0.3; // Minimum pressure

                // Adjust width and opacity based on pressure
                const width = currentWidth * pressure;
                const opacity = Math.min(0.3 + pressure * 0.5, 0.9);

                ctx.strokeStyle = `rgba(51, 51, 51, ${opacity})`;
                ctx.lineWidth = width * (0.8 + Math.random() * 0.2);
                ctx.stroke();
            }
        } else if (currentTool === 'brush') {
            // Brush with pressure sensitivity
            let pressure = e.pressure !== undefined ? e.pressure : 0.7;
            if (pressure === 0) pressure = 0.3; // Minimum pressure

            // Wider, softer stroke for brush
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);

            ctx.lineWidth = currentWidth * 1.5 * pressure;
            ctx.strokeStyle = `rgba(51, 51, 51, ${0.2 + pressure * 0.3})`;
            ctx.stroke();

            // Darker center
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.lineWidth = currentWidth * pressure * 0.7;
            ctx.strokeStyle = `rgba(51, 51, 51, ${0.4 + pressure * 0.4})`;
            ctx.stroke();
        } else if (currentTool === 'eraser') {
            // Eraser
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.lineWidth = currentWidth * 2;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }

        lastX = x;
        lastY = y;
    }

    // Stop drawing
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            saveState();
        }
    }

    // Get pointer position
    function getPointerPosition(e) {
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

        return { x, y };
    }

    // Event Listeners
    strokeWidthInput.addEventListener('input', function () {
        currentWidth = this.value;
        widthDisplay.textContent = `${this.value}px`;
    });

    pencilTool.addEventListener('click', function () {
        currentTool = 'pencil';
        pencilTool.classList.add('active');
        brushTool.classList.remove('active');
        eraserTool.classList.remove('active');
        canvas.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="22" y2="6"></line><path d="M7.5 20.5L19 9l-4-4L3.5 16.5 2 22z"></path></svg>\') 0 24, crosshair';
    });

    brushTool.addEventListener('click', function () {
        currentTool = 'brush';
        brushTool.classList.add('active');
        pencilTool.classList.remove('active');
        eraserTool.classList.remove('active');
        canvas.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9.5V5h-4.5"></path><path d="M5 19.5l-.5-.5L19 4.5l.5.5L5 19.5z"></path><path d="M5 15v4h4"></path></svg>\') 0 24, crosshair';
    });

    eraserTool.addEventListener('click', function () {
        currentTool = 'eraser';
        eraserTool.classList.add('active');
        pencilTool.classList.remove('active');
        brushTool.classList.remove('active');
        canvas.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path></svg>\') 0 24, cell';
    });

    clearBtn.addEventListener('click', clearCanvas);
    undoBtn.addEventListener('click', undo);
    addPageBtn.addEventListener('click', addPage);
    publishBtn.addEventListener('click', publishBlog);

    pageSelect.addEventListener('change', function () {
        switchPage(parseInt(this.value));
    });

    prevBtn.addEventListener('click', function () {
        if (currentPage > 1) {
            switchPage(currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', function () {
        if (currentPage < totalPages) {
            switchPage(currentPage + 1);
        } else {
            addPage();
        }
    });

    moveLeftBtn.addEventListener('click', function () {
        movePage('left');
    });

    moveRightBtn.addEventListener('click', function () {
        movePage('right');
    });

    deleteBtn.addEventListener('click', deletePage);

    // Setup pointer events for drawing
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointerout', stopDrawing);

    // Initialize
    init();
    saveState(); // Save initial state
}