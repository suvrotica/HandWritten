// UI controller for handling events and UI interactions
function initUIController(appState, canvasHandler, rotationHandler, pageManager, exportManager) {
    const { elements, canvas: canvasState } = appState;
    const { 
        canvas, strokeWidthInput, widthDisplay, pencilTool, brushTool, 
        eraserTool, clearBtn, undoBtn, addPageBtn, saveSvgBtn, publishBtn,
        pageSelect, prevBtn, nextBtn, moveLeftBtn, moveRightBtn, deleteBtn
    } = elements;
    
    // Setup all event listeners
    function init() {
        // Tool selection
        pencilTool.addEventListener('click', function() {
            canvasState.currentTool = 'pencil';
            updateToolUI('pencil');
            updateCursor('pencil');
        });
        
        brushTool.addEventListener('click', function() {
            canvasState.currentTool = 'brush';
            updateToolUI('brush');
            updateCursor('brush');
        });
        
        eraserTool.addEventListener('click', function() {
            canvasState.currentTool = 'eraser';
            updateToolUI('eraser');
            updateCursor('eraser');
        });
        
        // Stroke width control
        strokeWidthInput.addEventListener('input', function() {
            canvasState.currentWidth = this.value;
            widthDisplay.textContent = `${this.value}px`;
        });
        
        // Canvas actions
        clearBtn.addEventListener('click', canvasHandler.clearCanvas.bind(canvasHandler));
        undoBtn.addEventListener('click', canvasHandler.undo.bind(canvasHandler));
        
        // Page management
        addPageBtn.addEventListener('click', pageManager.addPage.bind(pageManager));
        pageSelect.addEventListener('change', function() {
            pageManager.switchPage(parseInt(this.value));
        });
        
        prevBtn.addEventListener('click', function() {
            if (appState.pages.currentPage > 1) {
                pageManager.switchPage(appState.pages.currentPage - 1);
            }
        });
        
        nextBtn.addEventListener('click', function() {
            if (appState.pages.currentPage < appState.pages.totalPages) {
                pageManager.switchPage(appState.pages.currentPage + 1);
            } else {
                pageManager.addPage();
            }
        });
        
        moveLeftBtn.addEventListener('click', function() {
            pageManager.movePage('left');
        });
        
        moveRightBtn.addEventListener('click', function() {
            pageManager.movePage('right');
        });
        
        deleteBtn.addEventListener('click', pageManager.deletePage.bind(pageManager));
        
        // Export actions - IMPORTANT FIXES
        saveSvgBtn.addEventListener('click', function() {
            // First explicitly save the current drawing state
            const currentPageIndex = appState.pages.currentPage - 1;
            appState.pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            
            // Then generate the SVG
            exportManager.saveCombinedSvg();
            
            // Ensure lines are redrawn in the editor
            setTimeout(() => {
                canvasHandler.redrawCanvas();
            }, 100);
        });
        
        publishBtn.addEventListener('click', function() {
            // First explicitly save the current drawing state
            const currentPageIndex = appState.pages.currentPage - 1;
            appState.pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            
            // Then generate preview and publish
            exportManager.generatePreview();
            exportManager.publishBlog();
            
            // Ensure lines are redrawn in the editor
            setTimeout(() => {
                canvasHandler.redrawCanvas();
            }, 100);
        });
        
        // Setup canvas drawing events
        canvas.style.touchAction = 'none';
        canvas.addEventListener('pointerdown', canvasHandler.startDrawing.bind(canvasHandler));
        canvas.addEventListener('pointermove', canvasHandler.draw.bind(canvasHandler));
        canvas.addEventListener('pointerup', canvasHandler.stopDrawing.bind(canvasHandler));
        canvas.addEventListener('pointerout', canvasHandler.stopDrawing.bind(canvasHandler));
        
        // Set initial tool
        updateToolUI('pencil');
        updateCursor('pencil');
    }
    
    // Update tool UI to show active tool
    function updateToolUI(tool) {
        pencilTool.classList.toggle('active', tool === 'pencil');
        brushTool.classList.toggle('active', tool === 'brush');
        eraserTool.classList.toggle('active', tool === 'eraser');
    }
    
    // Update cursor based on selected tool
    function updateCursor(tool) {
        if (tool === 'pencil') {
            canvas.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="22" y2="6"></line><path d="M7.5 20.5L19 9l-4-4L3.5 16.5 2 22z"></path></svg>\') 0 24, crosshair';
        } else if (tool === 'brush') {
            canvas.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9.5V5h-4.5"></path><path d="M5 19.5l-.5-.5L19 4.5l.5.5L5 19.5z"></path><path d="M5 15v4h4"></path></svg>\') 0 24, crosshair';
        } else if (tool === 'eraser') {
            canvas.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path></svg>\') 0 24, cell';
        }
    }
    
    // Initialize UI module
    init();
    
    // Return public methods
    return {
        updateToolUI,
        updateCursor
    };
}