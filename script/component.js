// Component loader
document.addEventListener('DOMContentLoaded', function() {
    // List of components to load
    const components = [
        { id: 'header-container', file: '/components/header.html' },
        { id: 'btn-row-container', file: '/components/btn-row.html' },
        { id: 'toolbar-container', file: '/components/toolbar.html' },
        { id: 'canvas-container', file: '/components/canvas.html' },
        { id: 'page-controls-container', file: '/components/page-controls.html' },
        { id: 'preview-container', file: '/components/preview.html' }
    ];

    // Load each component
    let loadedCount = 0;
    components.forEach(component => {
        loadComponent(component.id, component.file, function() {
            loadedCount++;
            if (loadedCount === components.length) {
                // All components are loaded, trigger the init event
                document.dispatchEvent(new CustomEvent('allComponentsLoaded'));
            }
        });
    });

    // Function to load a component
    function loadComponent(containerId, filePath, callback) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                if (typeof callback === 'function') {
                    callback();
                }
            })
            .catch(error => {
                console.error(`Error loading component "${filePath}":`, error);
                // Still call the callback to avoid blocking the app initialization
                if (typeof callback === 'function') {
                    callback();
                }
            });
    }
});