// Main application entry point
// Wait for all components to be loaded before initializing the app
document.addEventListener('allComponentsLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Initialize application state
    const appState = {
        // DOM Elements
        elements: {
            canvas: document.getElementById('drawing-canvas'),
            ctx: document.getElementById('drawing-canvas').getContext('2d'),
            strokeWidthInput: document.getElementById('stroke-width'),
            widthDisplay: document.getElementById('width-display'),
            pencilTool: document.getElementById('pencil-tool'),
            brushTool: document.getElementById('brush-tool'),
            eraserTool: document.getElementById('eraser-tool'),
            clearBtn: document.getElementById('clear-btn'),
            undoBtn: document.getElementById('undo-btn'),
            addPageBtn: document.getElementById('add-page-btn'),
            saveSvgBtn: document.getElementById('save-svg-btn'),
            publishBtn: document.getElementById('publish-btn'),
            pageSelect: document.getElementById('page-select'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            moveLeftBtn: document.getElementById('move-left-btn'),
            moveRightBtn: document.getElementById('move-right-btn'),
            deleteBtn: document.getElementById('delete-btn'),
            blogPreview: document.getElementById('blog-preview'),
            blogTitle: document.querySelector('.blog-title'),
            toast: document.getElementById('toast'),
            canvasContainer: document.querySelector('.canvas-container'),
            canvasWrapper: document.getElementById('canvas-wrapper'),
            rotationIndicator: document.getElementById('rotation-indicator'),
            resetRotationBtn: document.getElementById('reset-rotation-btn')
        },
        
        // Canvas state
        canvas: {
            isDrawing: false,
            lastX: 0,
            lastY: 0,
            currentTool: 'pencil',
            currentWidth: document.getElementById('stroke-width').value
        },
        
        // Page state
        pages: {
            currentPage: 1,
            totalPages: 1,
            pages: [null], // Store canvas image data for each page
            undoStacks: [[]], // Store undo history for each page
            userDrawings: [null], // Store only user's drawings without background or lines
        },
        
        // Rotation state
        rotation: {
            currentRotation: 0,
            isRotating: false,
            startAngle: 0,
            initialDistance: 0,
            activeTouchIds: [],
            pageRotations: [0] // Store rotation angle for each page
        },
        
        // Paper settings
        paper: {
            LINE_SPACING: 30, // Pixels between ruled lines
            MARGIN_LEFT: 60, // Left margin in pixels
            MARGIN_RIGHT: 40, // Right margin in pixels
            MARGIN_TOP: 40, // Top margin in pixels
            MARGIN_BOTTOM: 40, // Bottom margin in pixels
            LINE_COLOR: 'rgba(173, 216, 230, 0.5)', // Light blue with opacity
            MARGIN_LINE_COLOR: 'rgba(255, 0, 0, 0.2)' // Light red for margin indicator
        }
    };
    
    // Initialize modules
    const canvasHandler = initCanvasHandler(appState);
    const rotationHandler = initRotationHandler(appState, canvasHandler);
    const pageManager = initPageManager(appState, canvasHandler);
    const exportManager = initExportManager(appState, canvasHandler);
    const uiController = initUIController(appState, canvasHandler, rotationHandler, pageManager, exportManager);
    
    // Setup initial state
    canvasHandler.resizeCanvas();
    window.addEventListener('resize', canvasHandler.resizeCanvas);
    pageManager.updatePageSelect();
    pageManager.updatePageControls();
    
    // Save initial state
    canvasHandler.saveState();
}