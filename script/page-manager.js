// Page management functions
function initPageManager(appState, canvasHandler) {
    const { elements, pages, rotation } = appState;
    const { canvas, ctx, pageSelect, prevBtn, nextBtn, moveLeftBtn, moveRightBtn, deleteBtn } = elements;
    
    return {
        // Add a new page
        addPage: function() {
            // Save current page
            const currentPageIndex = pages.currentPage - 1;
            pages.pages[currentPageIndex] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            rotation.pageRotations[currentPageIndex] = rotation.currentRotation;
            
            // Add new page
            pages.totalPages++;
            pages.currentPage = pages.totalPages;
            pages.pages.push(null);
            pages.userDrawings.push(null);
            pages.undoStacks.push([]);
            rotation.pageRotations.push(0); // New page starts with 0 degrees rotation
            
            // Reset rotation for new page
            rotation.currentRotation = 0;
            canvasHandler.applyRotation();
            
            // Clear canvas for new page
            canvasHandler.clearCanvas();
            
            // Update UI
            this.updatePageSelect();
            this.updatePageControls();
            appState.utils.showToast('New page added');
        },
        
        // Switch to page
        switchPage: function(pageNum) {
            if (pageNum < 1 || pageNum > pages.totalPages) return;
            
            // Save current page
            const currentPageIndex = pages.currentPage - 1;
            pages.pages[currentPageIndex] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            rotation.pageRotations[currentPageIndex] = rotation.currentRotation;
            
            // Switch to selected page
            pages.currentPage = pageNum;
            
            // Set rotation for the selected page
            rotation.currentRotation = rotation.pageRotations[pages.currentPage - 1] || 0;
            canvasHandler.applyRotation();
            
            // Redraw canvas - critically important to draw with ruled lines
            canvasHandler.redrawCanvas();
            
            // Update UI
            this.updatePageSelect();
            this.updatePageControls();
        },
        
        // Move current page to a new position
        movePage: function(direction) {
            // Save current page
            const currentPageIndex = pages.currentPage - 1;
            pages.pages[currentPageIndex] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            rotation.pageRotations[currentPageIndex] = rotation.currentRotation;
            
            let newPosition;
            if (direction === 'left' && pages.currentPage > 1) {
                newPosition = pages.currentPage - 1;
            } else if (direction === 'right' && pages.currentPage < pages.totalPages) {
                newPosition = pages.currentPage + 1;
            } else {
                return; // Invalid move
            }
            
            // Get the page being moved
            const movingPage = pages.pages[currentPageIndex];
            const movingDrawings = pages.userDrawings[currentPageIndex];
            const movingUndoStack = pages.undoStacks[currentPageIndex];
            const movingRotation = rotation.pageRotations[currentPageIndex];
            
            // Remove from current position
            pages.pages.splice(currentPageIndex, 1);
            pages.userDrawings.splice(currentPageIndex, 1);
            pages.undoStacks.splice(currentPageIndex, 1);
            rotation.pageRotations.splice(currentPageIndex, 1);
            
            // Insert at new position
            pages.pages.splice(newPosition - 1, 0, movingPage);
            pages.userDrawings.splice(newPosition - 1, 0, movingDrawings);
            pages.undoStacks.splice(newPosition - 1, 0, movingUndoStack);
            rotation.pageRotations.splice(newPosition - 1, 0, movingRotation);
            
            // Update current page reference
            pages.currentPage = newPosition;
            
            // Update UI
            this.updatePageSelect();
            this.updatePageControls();
            appState.utils.showToast(`Page moved to position ${newPosition}`);
        },
        
        // Delete current page
        deletePage: function() {
            if (pages.totalPages <= 1) {
                appState.utils.showToast('Cannot delete the only page');
                return;
            }
            
            // Remove page
            const currentPageIndex = pages.currentPage - 1;
            pages.pages.splice(currentPageIndex, 1);
            pages.userDrawings.splice(currentPageIndex, 1);
            pages.undoStacks.splice(currentPageIndex, 1);
            rotation.pageRotations.splice(currentPageIndex, 1);
            pages.totalPages--;
            
            // Adjust current page if needed
            if (pages.currentPage > pages.totalPages) {
                pages.currentPage = pages.totalPages;
            }
            
            // Set rotation for the current page
            rotation.currentRotation = rotation.pageRotations[pages.currentPage - 1] || 0;
            canvasHandler.applyRotation();
            
            // Redraw canvas
            canvasHandler.redrawCanvas();
            
            // Update UI
            this.updatePageSelect();
            this.updatePageControls();
            appState.utils.showToast('Page deleted');
        },
        
        // Update page dropdown
        updatePageSelect: function() {
            pageSelect.innerHTML = '';
            
            for (let i = 0; i < pages.totalPages; i++) {
                const option = document.createElement('option');
                option.value = i + 1;
                option.textContent = `Page ${i + 1}`;
                
                if (i + 1 === pages.currentPage) {
                    option.selected = true;
                }
                
                pageSelect.appendChild(option);
            }
        },
        
        // Update page navigation controls
        updatePageControls: function() {
            prevBtn.disabled = pages.currentPage <= 1;
            nextBtn.disabled = pages.currentPage >= pages.totalPages;
            moveLeftBtn.disabled = pages.currentPage <= 1;
            moveRightBtn.disabled = pages.currentPage >= pages.totalPages;
            deleteBtn.disabled = pages.totalPages <= 1;
        },
        
        // Generate page preview for a specific page
        generatePagePreview: function(pageIndex) {
            // If there are no user drawings for this page, return null
            if (!pages.userDrawings[pageIndex]) {
                return null;
            }
            
            // Create a temporary canvas for the preview
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Fill with white background
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw just the user's drawings if available
            tempCtx.drawImage(pages.userDrawings[pageIndex], 0, 0);
            
            // Get image as data URL
            return tempCanvas.toDataURL('image/png');
        },
        
        // Get all pages data
        getAllPages: function() {
            // Save current page first to ensure it's up to date
            const currentPageIndex = pages.currentPage - 1;
            pages.pages[currentPageIndex] = ctx.getImageData(0, 0, canvas.width, canvas.height);
            pages.userDrawings[currentPageIndex] = canvasHandler.captureUserDrawings();
            rotation.pageRotations[currentPageIndex] = rotation.currentRotation;
            
            // Return page data
            return {
                totalPages: pages.totalPages,
                currentPage: pages.currentPage,
                userDrawings: pages.userDrawings,
                rotations: rotation.pageRotations
            };
        },
        
        // Get current page info
        getCurrentPageInfo: function() {
            return {
                pageNumber: pages.currentPage,
                totalPages: pages.totalPages,
                rotation: rotation.currentRotation
            };
        }
    };
}