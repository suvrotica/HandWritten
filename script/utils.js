// Utility functions
function initUtils(appState) {
    const { elements } = appState;
    const { toast } = elements;
    
    return {
        // Show toast notification
        showToast: function(message) {
            toast.textContent = message;
            toast.style.display = 'block';
            
            setTimeout(() => {
                toast.style.display = 'none';
            }, 2000);
        },
        
        // Format filename for download
        formatFilename: function(title, extension) {
            const formattedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
            return `${formattedTitle}-${timestamp}.${extension}`;
        },
        
        // Create download link
        createDownloadLink: function(content, type, filename) {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        // Deep clone object
        deepClone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        
        // Check if device is mobile/tablet
        isMobileDevice: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // Check if device supports touch
        isTouchDevice: function() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },
        
        // Generate random ID
        generateId: function(prefix = 'id') {
            return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
        },
        
        // Debounce function to limit how often a function can be called
        debounce: function(func, wait) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        },
        
        // Throttle function to limit how often a function can be called
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };
}