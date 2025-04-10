// Export and publishing functions
function initExportManager(appState, canvasHandler) {
    const { elements, pages } = appState;
    const { canvas, blogTitle, blogPreview } = elements;
    
    return {
        // Generate blog preview using only the user drawings (no ruled lines)
        generatePreview: function() {
            // First, ensure the current page is captured
            const currentPageIndex = pages.currentPage - 1;
            pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            
            // Get all pages data including the newly captured current page
            const pageData = appState.pageManager.getAllPages();
            
            let blogHTML = '';
            let hasContent = false;
            
            // Generate HTML for each page with content
            for (let i = 0; i < pageData.totalPages; i++) {
                if (pageData.userDrawings[i]) {
                    // Get image URL for this page
                    const imageUrl = appState.pageManager.generatePagePreview(i);
                    
                    if (imageUrl) {
                        hasContent = true;
                        blogHTML += `
                            <img src="${imageUrl}" alt="Handwritten content page ${i+1}">
                        `;
                    }
                }
            }
            
            // If no content was found, show default message
            if (!hasContent) {
                blogHTML = '<p>Your handwritten blog will be published as-is, preserving your natural writing style.</p>';
            }
            
            // Update the preview
            blogPreview.innerHTML = blogHTML;
            
            // Restore ruled lines in the editor after preview generation
            setTimeout(() => {
                canvasHandler.redrawCanvas();
            }, 50);
        },
        
        // Save all pages as a combined SVG file
        saveCombinedSvg: function() {
            // First, ensure the current page is captured
            const currentPageIndex = pages.currentPage - 1;
            pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            
            // Get all pages data
            const pageData = appState.pageManager.getAllPages();
            
            // Get the title for the filename
            const title = blogTitle.value || 'Untitled Blog';
            const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
            
            // Set SVG dimensions - make it long enough to fit all pages vertically
            const svgWidth = canvas.width;
            const pageHeight = canvas.height;
            const svgHeight = pageHeight * pageData.totalPages;
            
            // Create SVG header
            let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${svgWidth}" 
     height="${svgHeight}" 
     viewBox="0 0 ${svgWidth} ${svgHeight}">
  <title>${title}</title>
  <!-- Background -->
  <rect width="100%" height="100%" fill="white"/>`;
            
            // Add each page's content to the SVG
            for (let i = 0; i < pageData.totalPages; i++) {
                // Create a group for this page
                svgContent += `
  <g id="page-${i+1}" transform="translate(0, ${i * pageHeight})">`;
                
                // If we have user drawings for this page
                if (pageData.userDrawings[i]) {
                    // Create a temporary canvas to extract pixel data
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Draw user drawings to temp canvas
                    tempCtx.drawImage(pageData.userDrawings[i], 0, 0);
                    
                    // Get image data
                    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                    const data = imageData.data;
                    
                    // Convert pixel data to SVG paths
                    // Use a simplified algorithm to create paths from black pixels
                    
                    // Create a path for each stroke
                    let paths = [];
                    const visited = new Set();
                    
                    // Find starting points (black pixels)
                    for (let y = 0; y < tempCanvas.height; y++) {
                        for (let x = 0; x < tempCanvas.width; x++) {
                            const idx = (y * tempCanvas.width + x) * 4;
                            const pixelKey = `${x},${y}`;
                            
                            // If this is a black pixel and hasn't been visited
                            if (!visited.has(pixelKey) && 
                                data[idx] < 200 && data[idx+1] < 200 && data[idx+2] < 200 && data[idx+3] > 0) {
                                
                                // Mark as visited
                                visited.add(pixelKey);
                                
                                // Start a new path
                                let path = `M${x},${y}`;
                                
                                // Track pixel values for stroke color
                                const r = data[idx];
                                const g = data[idx+1];
                                const b = data[idx+2];
                                const a = data[idx+3] / 255;
                                
                                // Simple line algorithm - just find adjacent black pixels
                                let currentX = x;
                                let currentY = y;
                                
                                // Look in 8 directions for connected pixels
                                const directions = [
                                    [0, -1], [1, -1], [1, 0], [1, 1],
                                    [0, 1], [-1, 1], [-1, 0], [-1, -1]
                                ];
                                
                                // Find adjacent points (simplified approach)
                                let foundAdjacent = true;
                                let maxPoints = 1000; // Limit to prevent infinite loops
                                
                                while (foundAdjacent && maxPoints > 0) {
                                    foundAdjacent = false;
                                    maxPoints--;
                                    
                                    // Try each direction
                                    for (const [dx, dy] of directions) {
                                        const nextX = currentX + dx;
                                        const nextY = currentY + dy;
                                        const nextKey = `${nextX},${nextY}`;
                                        
                                        // Check if in bounds
                                        if (nextX < 0 || nextX >= tempCanvas.width || 
                                            nextY < 0 || nextY >= tempCanvas.height) {
                                            continue;
                                        }
                                        
                                        // Check if already visited
                                        if (visited.has(nextKey)) {
                                            continue;
                                        }
                                        
                                        // Check if black pixel
                                        const nextIdx = (nextY * tempCanvas.width + nextX) * 4;
                                        if (data[nextIdx] < 200 && data[nextIdx+1] < 200 && 
                                            data[nextIdx+2] < 200 && data[nextIdx+3] > 0) {
                                            
                                            // Add to path
                                            path += ` L${nextX},${nextY}`;
                                            
                                            // Update current position
                                            currentX = nextX;
                                            currentY = nextY;
                                            
                                            // Mark as visited
                                            visited.add(nextKey);
                                            
                                            // We found an adjacent pixel
                                            foundAdjacent = true;
                                            
                                            // Only use the first match to create continuous lines
                                            break;
                                        }
                                    }
                                }
                                
                                // Add the path with appropriate color
                                paths.push({
                                    d: path,
                                    stroke: `rgba(${r},${g},${b},${a})`
                                });
                            }
                        }
                    }
                    
                    // Add paths to SVG
                    for (const path of paths) {
                        svgContent += `
    <path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
                    }
                }
                
                // Close the group for this page
                svgContent += `
  </g>`;
            }
            
            // Close the SVG
            svgContent += `
</svg>`;
            
            // Create a download link for the SVG
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show success message and restore ruled lines
            appState.utils.showToast(`SVG saved as "${filename}"`);
            
            // Ensure editor canvas still shows ruled lines
            setTimeout(() => {
                canvasHandler.redrawCanvas();
            }, 50);
        },
        
        // Publish blog as HTML
        publishBlog: function() {
            // First generate the preview to ensure everything is saved
            this.generatePreview();
            
            const title = blogTitle.value || 'Untitled Blog';
            const pageData = appState.pageManager.getAllPages();
            
            // Generate HTML content with all pages
            let blogHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            color: #4a90e2;
        }
        .date {
            color: #777;
            font-style: italic;
        }
        .page {
            margin-bottom: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        img {
            display: block;
            width: 100%;
            height: auto;
            background: white;
        }
        footer {
            text-align: center;
            margin-top: 40px;
            color: #777;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <header>
        <h1>${title}</h1>
        <p class="date">Published on ${new Date().toLocaleDateString()}</p>
    </header>`;
    
            // Add each page to the HTML
            let hasContent = false;
            for (let i = 0; i < pageData.totalPages; i++) {
                // Get image URL for this page
                const imageUrl = appState.pageManager.generatePagePreview(i);
                
                if (imageUrl) {
                    hasContent = true;
                    // Add to HTML
                    blogHTML += `
    <div class="page">
        <img src="${imageUrl}" alt="Page ${i+1}">
    </div>`;
                }
            }
            
            // If no content, add a message
            if (!hasContent) {
                blogHTML += `
    <div class="page">
        <p style="text-align: center; padding: 50px;">This blog has no content yet.</p>
    </div>`;
            }
            
            // Close HTML
            blogHTML += `
    <footer>
        Created with Handwriting Blog Editor
    </footer>
</body>
</html>`;
            
            // Create a timestamp for the filename
            const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
            const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.html`;
            
            // Create a download link for the HTML file
            const blob = new Blob([blogHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show success message
            appState.utils.showToast(`Blog "${title}" published!`);
            
            // Ensure editor canvas still shows ruled lines
            setTimeout(() => {
                canvasHandler.redrawCanvas();
            }, 50);
        }
    };
}