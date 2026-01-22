export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return new Response('File ID is required', { status: 400 });
  }

  const pdfViewerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Viewer</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // Immediate URL hiding - runs as soon as possible
        (function() {
            function hideURL() {
                try {
                    window.history.replaceState(null, null, 'about:blank');
                } catch(e) {
                    try {
                        window.history.replaceState(null, null, 'data:text/html,');
                    } catch(e2) {
                        try {
                            window.history.replaceState(null, null, 'javascript:void(0)');
                        } catch(e3) {
                            // Silent fail
                        }
                    }
                }
            }
            
            // Hide URL immediately
            hideURL();
            
            // Hide URL after very short delays
            setTimeout(hideURL, 1);
            setTimeout(hideURL, 5);
            setTimeout(hideURL, 10);
        })();
    </script>
    <style>
        :root {
          --bg-color: #f0f0f0;
          --header-bg: #2F3C4B;
          --text-color: white;
          --button-bg: #3498db;
          --button-hover: #2980b9;
          --button-disabled: #7f8c8d;
          --download-bg: #27ae60;
          --download-hover: #229954;
          --close-bg: #e74c3c;
          --close-hover: #c0392b;
          --content-bg: white;
          --canvas-border: #ccc;
          --nav-hint-color: #000;
          --nav-hint-shadow: rgba(255, 255, 255, 0.8);
          --clickable-hover: rgba(0, 0, 0, 0.05);
        }

        .dark-mode {
          --bg-color: #000000;
          --header-bg: #000000;
          --text-color: #ffffff;
          --button-bg: #000000;
          --button-hover: #cccccc;
          --button-disabled: #666666;
          --download-bg: #000000;
          --download-hover: #cccccc;
          --close-bg: #000000;
          --close-hover: #cccccc;
          --content-bg: #000000;
          --canvas-border: #666666;
          --nav-hint-color: #ffffff;
          --nav-hint-shadow: rgba(0, 0, 0, 0.8);
          --clickable-hover: rgba(255, 255, 255, 0.05);
        }

        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: var(--bg-color);
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }

        .header {
            width: 100vw;
            background-color: var(--header-bg);
            color: var(--text-color);
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            box-sizing: border-box;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
            flex: 1;
        }

        .header-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex: 1;
        }

        .header-right {
            display: flex;
            gap: 10px;
            flex: 1;
            justify-content: flex-end;
        }

        .nav-button {
            background-color: var(--button-bg);
            color: var(--text-color);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }

        .nav-button:hover:not(:disabled) {
            background-color: var(--button-hover);
        }

        .nav-button:disabled {
            background-color: var(--button-disabled);
            cursor: not-allowed;
        }

        button {
            background-color: var(--button-bg);
            color: var(--text-color);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }

        button:hover:not(:disabled) {
            background-color: var(--button-hover);
        }

        button:disabled {
            background-color: var(--button-disabled);
            cursor: not-allowed;
        }

        .download-button {
            background-color: var(--download-bg);
        }

        .download-button:hover:not(:disabled) {
            background-color: var(--download-hover);
        }

        .close-button {
            background-color: var(--close-bg);
        }

        .close-button:hover {
            background-color: var(--close-hover);
        }

        .dark-mode-toggle {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
            margin-left: 10px;
        }

        .dark-mode-toggle:hover {
            background-color: #2980b9;
        }

        /* Dark mode overrides for buttons - add borders and monotone styling */
        .dark-mode .nav-button,
        .dark-mode button {
            border: 2px solid var(--canvas-border);
        }

        .dark-mode .nav-button:hover:not(:disabled),
        .dark-mode button:hover:not(:disabled) {
            border-color: var(--text-color);
        }

        .dark-mode .nav-button:disabled,
        .dark-mode button:disabled {
            border-color: var(--button-disabled);
        }

        .dark-mode .download-button,
        .dark-mode .close-button {
            border: 2px solid var(--canvas-border);
        }

        .dark-mode .download-button:hover:not(:disabled),
        .dark-mode .close-button:hover {
            border-color: var(--text-color);
        }

        .dark-mode .dark-mode-toggle {
            background-color: var(--button-bg) !important;
            color: var(--text-color) !important;
            border: 2px solid var(--canvas-border) !important;
        }

        .dark-mode .dark-mode-toggle:hover {
            background-color: var(--button-hover) !important;
            border-color: var(--text-color) !important;
        }

        .content {
            background-color: var(--content-bg);
            width: 100vw;
            height: calc(100vh - 60px);
            margin-top: 60px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
            padding-top: 40px;
            box-sizing: border-box;
            overflow: auto;
            position: relative;
        }

        .clickable-area {
            position: absolute;
            top: 0;
            height: 100%;
            width: 60px;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
        }

        .clickable-area:hover {
            background-color: var(--clickable-hover);
        }

        .clickable-area.left {
            left: 0;
        }

        .clickable-area.right {
            right: 0;
        }

        .clickable-area.disabled {
            cursor: default;
            pointer-events: none;
        }

        .clickable-area.disabled:hover {
            background-color: transparent;
        }

        .clickable-area .nav-hint {
            opacity: 0.6;
            transition: opacity 0.2s ease;
            font-size: 24px;
            color: var(--nav-hint-color);
            font-weight: bold;
            text-shadow: 0 0 10px var(--nav-hint-shadow);
        }

        .clickable-area:hover .nav-hint {
            opacity: 1;
        }

        .clickable-area.disabled .nav-hint {
            opacity: 0.2;
        }

        #pdfCanvas {
            border: 1px solid var(--canvas-border);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            user-select: none;
            pointer-events: none;
            /* Enhanced security - prevent all interactions */
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
        }

        #loading {
            font-size: 18px;
            color: var(--button-disabled);
            text-align: center;
            padding: 20px;
        }

        .error {
            color: var(--close-bg);
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <button id="prevBtn" class="nav-button" onclick="prevPage()">← Previous</button>
            <button id="nextBtn" class="nav-button" onclick="nextPage()">Next →</button>
            <span id="pageInfo">Page 1 of 1</span>
        </div>
        <div class="header-buttons">
            <button onclick="zoomIn()">Zoom In</button>
            <button onclick="zoomOut()">Zoom Out</button>
            <button id="fitWidthBtn" onclick="fitToWidth()">Fit to Width</button>
            <button id="fitHeightBtn" onclick="fitToHeight()">Fit to Height</button>
        </div>
        <div class="header-right">
            <button id="downloadBtn" class="download-button" onclick="downloadPDF()">↓ Download</button>
            <button class="close-button" onclick="window.close()">Close</button>
            <button id="darkModeToggle" class="dark-mode-toggle" onclick="toggleDarkMode()">🌙 Dark</button>
        </div>
    </div>

    <div class="content">
        <div id="loading">PDF is loading...</div>
        <canvas id="pdfCanvas" style="display: none;"></canvas>
        
        <!-- Clickable navigation areas -->
        <div id="leftClickArea" class="clickable-area left" onclick="prevPage()">
            <div class="nav-hint">←</div>
        </div>
        <div id="rightClickArea" class="clickable-area right" onclick="nextPage()">
            <div class="nav-hint">→</div>
        </div>
    </div>

    <script>
        // Dark mode functionality
        function toggleDarkMode() {
            const body = document.body;
            const toggleBtn = document.getElementById('darkModeToggle');
            
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                toggleBtn.innerHTML = '🌙 Dark';
                localStorage.setItem('pdfViewerDarkMode', 'false');
            } else {
                body.classList.add('dark-mode');
                toggleBtn.innerHTML = '☀️ Light';
                localStorage.setItem('pdfViewerDarkMode', 'true');
            }
        }

        // Initialize dark mode from localStorage
        function initializeDarkMode() {
            const savedMode = localStorage.getItem('pdfViewerDarkMode');
            const toggleBtn = document.getElementById('darkModeToggle');
            
            if (savedMode === 'true') {
                document.body.classList.add('dark-mode');
                toggleBtn.innerHTML = '☀️ Light';
            } else {
                toggleBtn.innerHTML = '🌙 Dark';
            }
        }

        // Initialize dark mode when page loads
        document.addEventListener('DOMContentLoaded', initializeDarkMode);

        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        let pdfDoc = null;
        let pageNum = 1;
        let pageRendering = false;
        let pageNumPending = null;
        let scale = 1.0;
        let originalCanvasWidth = 0;
        let originalCanvasHeight = 0;
        let lastFitType = null;
        const canvas = document.getElementById('pdfCanvas');
        const ctx = canvas.getContext('2d');

        // Load PDF through our server proxy with cache busting
        const pdfUrl = \`/api/proxy-pdf?fileId=${fileId}&t=${Date.now()}\`;
        
        // Hide URL before starting PDF load
        hideURL();
        
        pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
            pdfDoc = pdfDoc_;
            document.getElementById('loading').style.display = 'none';
            canvas.style.display = 'block';
            document.getElementById('pageInfo').textContent = 'Page 1 of ' + pdfDoc.numPages;
            updateButtons();
            renderPage(pageNum);
            
            // Hide URL again after PDF loads
            hideURL();
        }).catch(function(error) {
            console.error('Error loading PDF:', error);
            document.getElementById('loading').innerHTML = '<div class="error">Error loading PDF. Please try again.<br><small>Error: ' + error.message + '</small></div>';
            
            // Hide URL even on error
            hideURL();
        });

        function updateButtons() {
            document.getElementById('prevBtn').disabled = pageNum <= 1;
            document.getElementById('nextBtn').disabled = pageNum >= pdfDoc.numPages;
            
            // Update clickable areas
            const leftClickArea = document.getElementById('leftClickArea');
            const rightClickArea = document.getElementById('rightClickArea');
            
            if (pageNum <= 1) {
                leftClickArea.classList.add('disabled');
            } else {
                leftClickArea.classList.remove('disabled');
            }
            
            if (pageNum >= pdfDoc.numPages) {
                rightClickArea.classList.add('disabled');
            } else {
                rightClickArea.classList.remove('disabled');
            }
            
            // Update fit buttons based on last fit type
            document.getElementById('fitWidthBtn').disabled = lastFitType === 'width';
            document.getElementById('fitHeightBtn').disabled = lastFitType === 'height';
        }

        function renderPage(num) {
            pageRendering = true;
            
            // Hide URL during page rendering
            hideURL();
            
            pdfDoc.getPage(num).then(function(page) {
                const viewport = page.getViewport({scale: scale});
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Store original dimensions on first render
                if (originalCanvasWidth === 0 && originalCanvasHeight === 0) {
                    originalCanvasWidth = canvas.width;
                    originalCanvasHeight = canvas.height;
                }
                
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                renderTask.promise.then(function() {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                    
                    // Hide URL after rendering completes
                    hideURL();
                    
                    // Ensure canvas is visible and properly positioned after rendering
                    setTimeout(function() {
                        const content = document.querySelector('.content');
                        if (content.scrollTop === 0 && canvas.height > content.clientHeight) {
                            // If canvas is larger than container and we're at top, scroll to center the canvas
                            content.scrollTop = (canvas.height - content.clientHeight) / 2;
                        }
                        
                        // Hide URL one more time after positioning
                        hideURL();
                    }, 100);
                });
            });
            document.getElementById('pageInfo').textContent = 'Page ' + num + ' of ' + pdfDoc.numPages;
            updateButtons();
        }

        function queueRenderPage(num) {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        }

        function prevPage() {
            if (pageNum <= 1) return;
            pageNum--;
            queueRenderPage(pageNum);
        }

        function nextPage() {
            if (pageNum >= pdfDoc.numPages) return;
            pageNum++;
            queueRenderPage(pageNum);
        }

        function zoomIn() {
            scale += 0.25;
            lastFitType = null; // Reset fit state so fit buttons become clickable again
            updateButtons(); // Update button states
            renderPage(pageNum);
        }

        function zoomOut() {
            if (scale <= 0.5) return;
            scale -= 0.25;
            lastFitType = null; // Reset fit state so fit buttons become clickable again
            updateButtons(); // Update button states
            renderPage(pageNum);
        }

        function fitToWidth() {
            const containerWidth = document.querySelector('.content').clientWidth - 40; // Account for padding
            scale = containerWidth / originalCanvasWidth;
            lastFitType = 'width';
            updateButtons(); // Update button states
            renderPage(pageNum);
        }

        function fitToHeight() {
            const containerHeight = document.querySelector('.content').clientHeight - 40; // Account for padding
            scale = containerHeight / originalCanvasHeight;
            lastFitType = 'height';
            updateButtons(); // Update button states
            renderPage(pageNum);
        }

        function downloadPDF() {
            const downloadBtn = document.getElementById('downloadBtn');
            const originalText = downloadBtn.innerHTML;
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Show loading state
            downloadBtn.innerHTML = '⏳ Downloading...';
            downloadBtn.disabled = true;
            downloadBtn.style.background = isDarkMode ? '#666666' : '#7f8c8d';

            // Create download link
            const link = document.createElement('a');
            link.href = \`/api/download?fileId=${fileId}\`;
            link.download = 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Reset button after a delay
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
                downloadBtn.style.background = isDarkMode ? '#000000' : '#27ae60';
            }, 2000);
        }

        // Hide URL for security - try different approaches
        function hideURL() {
            try {
                // Method 1: Try history.replaceState with about:blank
                window.history.replaceState(null, null, 'about:blank');
                return true;
            } catch(e) {
                try {
                    // Method 2: Try data URL
                    window.history.replaceState(null, null, 'data:text/html,');
                    return true;
                } catch(e2) {
                    try {
                        // Method 3: Try javascript URL
                        window.history.replaceState(null, null, 'javascript:void(0)');
                        return true;
                    } catch(e3) {
                        try {
                            // Method 4: Try generic path
                            window.history.replaceState(null, null, '/pdf-viewer');
                            return true;
                        } catch(e4) {
                            try {
                                // Method 5: Try empty hash
                                window.history.replaceState(null, null, '#');
                                return true;
                            } catch(e5) {
                                return false;
                            }
                        }
                    }
                }
            }
        }

        // Try to hide URL immediately and repeatedly
        function attemptHideURL() {
            hideURL();
            setTimeout(hideURL, 1);
            setTimeout(hideURL, 5);
            setTimeout(hideURL, 10);
            setTimeout(hideURL, 25);
            setTimeout(hideURL, 50);
            setTimeout(hideURL, 100);
            setTimeout(hideURL, 200);
            setTimeout(hideURL, 500);
        }

        // Hide URL immediately on page load
        attemptHideURL();
        
        // Hide URL when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attemptHideURL);
        } else {
            attemptHideURL();
        }

        // Keyboard navigation
        document.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                event.preventDefault();
                prevPage();
            } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
                event.preventDefault();
                nextPage();
            } else if (event.key === '+' || event.key === '=') {
                event.preventDefault();
                zoomIn();
            } else if (event.key === '-') {
                event.preventDefault();
                zoomOut();
            }
        });
    </script>
</body>
</html>`;

  return new Response(pdfViewerHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
}
