export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return new Response('File ID is required', { status: 400 });
  }

  const audioViewerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audio Player</title>
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
          --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --container-bg: white;
          --text-color: #2c3e50;
          --text-secondary: #7f8c8d;
          --button-primary: #27ae60;
          --button-primary-hover: #229954;
          --button-secondary: #6c757d;
          --button-secondary-hover: #5a6268;
          --button-danger: #e74c3c;
          --button-danger-hover: #c0392b;
          --button-disabled: #95a5a6;
          --controls-bg: #f8f9fa;
          --seek-btn: #17a2b8;
          --seek-btn-hover: #138496;
          --play-btn: #007bff;
          --mute-btn: #6c757d;
          --seek-bar-bg: #ddd;
          --help-text: #666;
          --shadow: rgba(0,0,0,0.2);
        }

        .dark-mode {
          --bg-gradient: linear-gradient(135deg, #000000 0%, #000000 100%);
          --container-bg: #000000;
          --text-color: #ffffff;
          --text-secondary: #cccccc;
          --button-primary: #000000;
          --button-primary-hover: #cccccc;
          --button-secondary: #000000;
          --button-secondary-hover: #cccccc;
          --button-danger: #000000;
          --button-danger-hover: #cccccc;
          --button-disabled: #666666;
          --controls-bg: #000000;
          --seek-btn: #000000;
          --seek-btn-hover: #cccccc;
          --play-btn: #000000;
          --mute-btn: #000000;
          --seek-bar-bg: #666666;
          --help-text: #cccccc;
          --shadow: rgba(255,255,255,0.1);
        }

        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: var(--bg-gradient); 
            min-height: 100vh; 
        }
        
        .audio-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: var(--container-bg); 
            border-radius: 12px; 
            padding: 30px; 
            box-shadow: 0 10px 30px var(--shadow); 
        }
        
        .audio-header { 
            text-align: center; 
            margin-bottom: 30px; 
            position: relative;
        }
        
        .dark-mode-toggle {
            position: absolute;
            top: 0;
            right: 0;
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
        }

        .dark-mode-toggle:hover {
            background: #2980b9;
        }
        
        .audio-title { 
            font-size: 1.5rem; 
            font-weight: bold; 
            color: var(--text-color); 
            margin-bottom: 10px; 
        }
        
        .audio-subtitle { 
            color: var(--text-secondary); 
            font-size: 1rem; 
        }
        
        .audio-player { 
            width: 100%; 
            margin: 30px 0; 
            height: 60px;
            outline: none;
        }
        
        .controls { 
            display: flex; 
            gap: 15px; 
            margin: 30px 0; 
            justify-content: center; 
        }
        
        .btn { 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: bold; 
            transition: all 0.3s ease; 
        }
        
        .btn-primary { 
            background: var(--button-primary); 
            color: white; 
        }
        
        .btn-primary:hover { 
            background: var(--button-primary-hover); 
            transform: translateY(-2px); 
        }
        
        .btn-primary:disabled { 
            background: var(--button-disabled); 
            cursor: not-allowed; 
            transform: none; 
            opacity: 0.6; 
        }
        
        .btn-secondary { 
            background: var(--button-secondary); 
            color: white; 
        }
        
        .btn-secondary:hover { 
            background: var(--button-secondary-hover); 
            transform: translateY(-2px); 
        }
        
        .btn-danger { 
            background: var(--button-danger); 
            color: white; 
        }
        
        .btn-danger:hover { 
            background: var(--button-danger-hover); 
            transform: translateY(-2px); 
        }
        
        .loading { 
            text-align: center; 
            color: var(--button-danger); 
            font-weight: bold; 
            font-size: 1.1em; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1); 
        }
        
        .dark-mode .loading {
            color: #ffffff;
        }
        
        .error { 
            text-align: center; 
            color: var(--button-danger); 
            font-weight: bold; 
        }
        
        audio::-webkit-media-controls-panel { 
            background-color: var(--controls-bg); 
            border-radius: 8px;
        }
        
        audio::-webkit-media-controls-play-button,
        audio::-webkit-media-controls-timeline,
        audio::-webkit-media-controls-current-time-display,
        audio::-webkit-media-controls-time-remaining-display {
            cursor: pointer;
        }
        
        .custom-controls {
            margin: 20px 0; 
            padding: 15px; 
            background: var(--controls-bg); 
            border-radius: 8px;
        }
        
        .control-row {
            display: flex; 
            align-items: center; 
            gap: 10px; 
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        
        .seek-controls {
            display: flex; 
            justify-content: center; 
            gap: 10px; 
            margin: 15px 0;
        }
        
        .seek-btn {
            padding: 8px 12px; 
            border: none; 
            border-radius: 4px; 
            background: var(--seek-btn); 
            color: white; 
            cursor: pointer;
        }
        
        .seek-btn:hover {
            background: var(--seek-btn-hover);
        }
        
        .play-btn {
            padding: 8px 12px; 
            border: none; 
            border-radius: 4px; 
            background: var(--play-btn); 
            color: white; 
            cursor: pointer; 
            opacity: 1;
        }
        
        .play-btn:disabled {
            background: var(--button-disabled);
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        .mute-btn {
            padding: 8px 12px; 
            border: none; 
            border-radius: 4px; 
            background: var(--mute-btn); 
            color: white; 
            cursor: pointer;
        }
        
        .seek-bar {
            flex: 1; 
            min-width: 200px; 
            height: 6px; 
            background: var(--seek-bar-bg); 
            border-radius: 3px; 
            outline: none;
        }
        
        .time-display {
            font-weight: bold; 
            min-width: 50px;
            color: var(--text-color);
        }
        
        .help-text {
            text-align: center; 
            margin-top: 10px; 
            font-size: 0.9em; 
            color: var(--help-text);
        }

        /* Dark mode overrides - add borders and monotone styling */
        .dark-mode .btn {
            border: 2px solid var(--text-secondary);
        }

        .dark-mode .btn:hover {
            border-color: var(--text-color);
        }

        .dark-mode .btn:disabled {
            border-color: var(--button-disabled);
        }

        .dark-mode .seek-btn,
        .dark-mode .play-btn,
        .dark-mode .mute-btn {
            border: 2px solid var(--text-secondary);
        }

        .dark-mode .seek-btn:hover,
        .dark-mode .play-btn:hover,
        .dark-mode .mute-btn:hover {
            border-color: var(--text-color);
        }

        .dark-mode .play-btn:disabled {
            border-color: var(--button-disabled);
        }

        .dark-mode .play-btn {
            background: var(--button-bg) !important;
            color: var(--text-color) !important;
            border: 2px solid var(--text-secondary) !important;
        }

        .dark-mode .play-btn:hover {
            background: var(--button-hover) !important;
            border-color: var(--text-color) !important;
        }

        .dark-mode .audio-container {
            border: 2px solid var(--text-secondary);
        }

        .dark-mode .custom-controls {
            border: 2px solid var(--text-secondary);
        }

        .dark-mode .dark-mode-toggle {
            background: var(--button-bg) !important;
            color: var(--text-color) !important;
            border: 2px solid var(--text-secondary) !important;
        }

        .dark-mode .dark-mode-toggle:hover {
            background: var(--button-hover) !important;
            border-color: var(--text-color) !important;
        }
    </style>
</head>
<body>
    <div class="audio-container">
        <div class="audio-header">
            <button id="darkModeToggle" class="dark-mode-toggle" onclick="toggleDarkMode()">🌙 Dark</button>
            <div class="audio-title">🎧 Audio Player</div>
            <div class="audio-subtitle">IB Audio File Player</div>
        </div>
        
        <div id="loading" class="loading">Loading MP3...</div>
        <audio id="audioPlayer" class="audio-player" preload="auto" style="display: block;">
            <source src="/api/proxy-audio?fileId=${fileId}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        
        <!-- Custom seek bar for reliable seeking -->
        <div id="customControls" class="custom-controls">
            <div class="control-row">
                <button id="playPauseBtn" onclick="togglePlayPause()" class="play-btn" disabled>▶️</button>
                <span id="currentTime" class="time-display">0:00</span>
                <input type="range" id="seekBar" min="0" max="100" value="0" class="seek-bar" oninput="handleSeekInput(this.value)" onchange="handleSeekChange(this.value)">
                <span id="totalTime" class="time-display">0:00</span>
                <button onclick="toggleMute()" class="mute-btn">🔊</button>
            </div>
            <div class="seek-controls">
                <button onclick="seekBackward(60)" class="seek-btn" title="Skip back 1 minute">⏪ 1m</button>
                <button onclick="seekBackward(15)" class="seek-btn" title="Skip back 15 seconds">⏪ 15s</button>
                <button onclick="seekForward(15)" class="seek-btn" title="Skip forward 15 seconds">15s ⏩</button>
                <button onclick="seekForward(60)" class="seek-btn" title="Skip forward 1 minute">1m ⏩</button>
            </div>
            <div class="help-text">
                Click anywhere on the progress bar to jump to that time
            </div>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="downloadAudio()">📥 Download</button>
            <button class="btn btn-danger" onclick="window.close()">Close</button>
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
                localStorage.setItem('audioViewerDarkMode', 'false');
            } else {
                body.classList.add('dark-mode');
                toggleBtn.innerHTML = '☀️ Light';
                localStorage.setItem('audioViewerDarkMode', 'true');
            }
        }

        // Initialize dark mode from localStorage
        function initializeDarkMode() {
            const savedMode = localStorage.getItem('audioViewerDarkMode');
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

        const audioPlayer = document.getElementById('audioPlayer');
        const loading = document.getElementById('loading');
        
        // Initialize loading state
        loading.style.display = 'block';
        loading.textContent = 'Loading MP3...';
        
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
                            window.history.replaceState(null, null, '/audio-viewer');
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
        
        // Handle audio loading with better seeking support
        audioPlayer.addEventListener('loadstart', function() {
            loading.style.display = 'block';
            loading.textContent = 'Loading MP3...';
            playPauseBtn.disabled = true;
            playPauseBtn.style.background = '#95a5a6';
            playPauseBtn.style.cursor = 'not-allowed';
            playPauseBtn.style.opacity = '0.6';
            console.log('🎧 [Audio Player] Audio loading started - play button disabled');
            
            // Hide URL during loading
            hideURL();
        });
        
        audioPlayer.addEventListener('canplay', function() {
            loading.textContent = 'Audio ready - loading for seeking...';
            playPauseBtn.disabled = true;
            playPauseBtn.style.background = '#95a5a6';
            playPauseBtn.style.cursor = 'not-allowed';
            playPauseBtn.style.opacity = '0.6';
            console.log('🎧 [Audio Player] Audio can play - play button still disabled');
            
            // Hide URL during canplay
            hideURL();
        });
        
        audioPlayer.addEventListener('canplaythrough', function() {
            loading.style.display = 'none';
            audioPlayer.style.display = 'block';
            audioPlayer.controls = false; // Use custom controls instead
            playPauseBtn.disabled = false;
            playPauseBtn.style.background = '#007bff';
            playPauseBtn.style.cursor = 'pointer';
            playPauseBtn.style.opacity = '1';
            console.log('🎧 [Audio Player] Audio fully loaded - play button enabled');
            
            // Hide URL after loading
            hideURL();
        });
        
        audioPlayer.addEventListener('loadedmetadata', function() {
            console.log('Audio metadata loaded, duration:', audioPlayer.duration);
            
            // Hide URL after metadata loads
            hideURL();
        });
        
        audioPlayer.addEventListener('seeked', function() {
            console.log('Seeked to:', audioPlayer.currentTime);
            
            // Hide URL after seeking
            hideURL();
        });
        
        audioPlayer.addEventListener('seeking', function() {
            console.log('Currently seeking to:', audioPlayer.currentTime);
            
            // Hide URL during seeking
            hideURL();
        });
        
        audioPlayer.addEventListener('error', function(e) {
            loading.innerHTML = '<div class="error">Error loading audio file. Please try again.<br><small>Error: ' + e.message + '</small></div>';
            playPauseBtn.disabled = true;
            playPauseBtn.style.background = '#95a5a6';
            playPauseBtn.style.cursor = 'not-allowed';
            playPauseBtn.style.opacity = '0.6';
            console.log('🎧 [Audio Player] Audio error - play button disabled');
            
            // Hide URL even on error
            hideURL();
        });
        
        // Custom controls functionality
        const customControls = document.getElementById('customControls');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const seekBar = document.getElementById('seekBar');
        const currentTimeSpan = document.getElementById('currentTime');
        const totalTimeSpan = document.getElementById('totalTime');
        
        // Initialize play button as disabled
        playPauseBtn.disabled = true;
        playPauseBtn.style.background = '#95a5a6';
        playPauseBtn.style.cursor = 'not-allowed';
        playPauseBtn.style.opacity = '0.6';
        
        // Request cancellation management
        let currentAbortController = null;
        let pendingSeekTime = null;
        let isSeeking = false;
        let seekTimeout = null;
        let lastSeekTime = 0;
        let seekThrottleTimeout = null;
        let isUserInteracting = false;
        let interactionTimeout = null;
        let rapidClickCount = 0;
        let rapidClickTimeout = null;
        
        console.log('🎧 [Audio Player] Request cancellation system initialized');
        
        // Debug function to check audio state
        function debugAudioState() {
            console.log('🔍 [Audio Debug] State:', {
                readyState: audioPlayer.readyState,
                readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][audioPlayer.readyState] || 'UNKNOWN',
                currentTime: audioPlayer.currentTime,
                duration: audioPlayer.duration,
                paused: audioPlayer.paused,
                ended: audioPlayer.ended,
                networkState: audioPlayer.networkState
            });
        }
        
        // Update time display
        function updateTimeDisplay() {
            // Don't update seek bar if user is currently seeking
            if (isSeeking) {
                console.log('⏸️ [Time Display] Skipping update - user is seeking');
                return;
            }
            
            const current = Math.floor(audioPlayer.currentTime);
            const total = Math.floor(audioPlayer.duration);
            currentTimeSpan.textContent = formatTime(current);
            totalTimeSpan.textContent = formatTime(total);
            seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        }
        
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }
        
        // Update controls every second
        audioPlayer.addEventListener('timeupdate', updateTimeDisplay);
        
        // Initialize custom controls when metadata loads
        audioPlayer.addEventListener('loadedmetadata', function() {
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                totalTimeSpan.textContent = formatTime(audioPlayer.duration);
                seekBar.max = 100;
                console.log('Custom controls initialized, duration:', audioPlayer.duration);
            }
        });
        
        function togglePlayPause() {
            // Check if button is disabled
            if (playPauseBtn.disabled) {
                console.log('🎧 [Audio Player] Play button clicked but disabled - audio not ready');
                return;
            }
            
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.textContent = '⏸️';
                console.log('🎧 [Audio Player] Audio started playing');
            } else {
                audioPlayer.pause();
                playPauseBtn.textContent = '▶️';
                console.log('🎧 [Audio Player] Audio paused');
            }
            
            // Hide URL after play/pause
            hideURL();
        }
        
        // Cancel any pending seek operations - ENHANCED VERSION
        function cancelPendingSeek() {
            console.log('🔄 [Seek Cancellation] Starting ENHANCED cancellation process...');
            
            // Cancel abort controller
            if (currentAbortController) {
                console.log('🔄 [Seek Cancellation] Aborting current seek operation');
                currentAbortController.abort();
                currentAbortController = null;
            }
            
            // Clear all timeouts
            if (seekTimeout) {
                console.log('🔄 [Seek Cancellation] Clearing pending seek timeout');
                clearTimeout(seekTimeout);
                seekTimeout = null;
            }
            
            if (seekThrottleTimeout) {
                console.log('🔄 [Seek Cancellation] Clearing throttle timeout');
                clearTimeout(seekThrottleTimeout);
                seekThrottleTimeout = null;
            }
            
            if (interactionTimeout) {
                console.log('🔄 [Seek Cancellation] Clearing interaction timeout');
                clearTimeout(interactionTimeout);
                interactionTimeout = null;
            }
            
            // Reset all seeking states
            isSeeking = false;
            isUserInteracting = false;
            
            // Clear rapid click tracking
            if (rapidClickTimeout) {
                clearTimeout(rapidClickTimeout);
                rapidClickTimeout = null;
            }
            rapidClickCount = 0;
            
            if (pendingSeekTime !== null) {
                console.log('🔄 [Seek Cancellation] Cancelling pending seek to:', pendingSeekTime, 'seconds');
                pendingSeekTime = null;
            }
            
            console.log('🔄 [Seek Cancellation] ENHANCED cancellation process completed');
        }
        
        // Handle seek input with immediate cancellation and rapid click detection
        function handleSeekInput(percentage) {
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                const time = (percentage / 100) * audioPlayer.duration;
                console.log('🎯 [Seek Input] User input:', percentage + '%', '→', time.toFixed(2) + 's');
                
                // Detect rapid clicking
                rapidClickCount++;
                if (rapidClickTimeout) {
                    clearTimeout(rapidClickTimeout);
                }
                rapidClickTimeout = setTimeout(() => {
                    rapidClickCount = 0;
                }, 500);
                
                // IMMEDIATELY cancel any pending seeks
                console.log('🎯 [Seek Input] IMMEDIATELY cancelling all pending seeks');
                cancelPendingSeek();
                
                // Update display immediately for responsive UI
                currentTimeSpan.textContent = formatTime(time);
                
                // Set user interaction state with shorter timeout
                isUserInteracting = true;
                if (interactionTimeout) {
                    clearTimeout(interactionTimeout);
                }
                interactionTimeout = setTimeout(() => {
                    isUserInteracting = false;
                    console.log('🎯 [Seek Input] User interaction ended');
                }, 150); // Further reduced to 150ms
                
                // Set seeking state
                isSeeking = true;
                pendingSeekTime = time;
                console.log('🎯 [Seek Input] Set seeking state, pending time:', time.toFixed(2) + 's');
                
                // Adjust timeout based on rapid clicking
                const seekDelay = rapidClickCount > 3 ? 50 : 100; // Faster for rapid clicks
                
                // Much more aggressive throttling - seek almost immediately after user stops
                if (seekThrottleTimeout) {
                    clearTimeout(seekThrottleTimeout);
                }
                
                seekThrottleTimeout = setTimeout(() => {
                    if (!isUserInteracting && pendingSeekTime === time) {
                        console.log('🎯 [Seek Input] User stopped interacting, performing seek to:', pendingSeekTime);
                        performSeek(pendingSeekTime);
                    } else {
                        console.log('🎯 [Seek Input] User still interacting or seek cancelled, skipping');
                    }
                }, seekDelay); // Dynamic delay based on rapid clicking
                
                // Hide URL during seeking
                hideURL();
            }
        }
        
        // Handle seek change (final seek) - ROBUST AND DIRECT
        function handleSeekChange(percentage) {
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                const time = (percentage / 100) * audioPlayer.duration;
                console.log('🎯 [Seek Change] Final seek:', percentage + '%', '→', time.toFixed(2) + 's');
                
                // End user interaction
                isUserInteracting = false;
                if (interactionTimeout) {
                    clearTimeout(interactionTimeout);
                    interactionTimeout = null;
                }
                
                // Cancel any pending seek
                console.log('🎯 [Seek Change] Cancelling any pending seeks before final seek');
                cancelPendingSeek();
                
                // DIRECT SEEK - bypass all the complex logic for immediate response
                console.log('🎯 [Seek Change] Performing DIRECT seek to:', time.toFixed(2) + 's');
                debugAudioState(); // Debug before seek
                
                // Ensure audio is ready for seeking
                if (audioPlayer.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                    try {
                        // Direct seek without waiting
                        audioPlayer.currentTime = time;
                        console.log('🎯 [Seek Change] Direct seek completed to:', audioPlayer.currentTime.toFixed(2) + 's');
                        debugAudioState(); // Debug after seek
                    } catch (error) {
                        console.error('🎯 [Seek Change] Direct seek failed:', error);
                        debugAudioState(); // Debug on error
                        // Fallback to complex seek
                        performSeek(time);
                    }
                } else {
                    console.log('🎯 [Seek Change] Audio not ready for seeking (readyState:', audioPlayer.readyState + '), forcing load...');
                    // Force audio to load more data
                    audioPlayer.load();
                    // Try again after a short delay
                    setTimeout(() => {
                        if (audioPlayer.readyState >= 2) {
                            try {
                                audioPlayer.currentTime = time;
                                console.log('🎯 [Seek Change] Delayed seek completed to:', audioPlayer.currentTime.toFixed(2) + 's');
                            } catch (error) {
                                console.error('🎯 [Seek Change] Delayed seek failed:', error);
                            }
                        }
                    }, 100);
                }
                
                // Hide URL after seeking
                hideURL();
            } else {
                console.log('🎯 [Seek Change] Cannot seek - no duration available');
                debugAudioState();
            }
        }
        
        // Perform the actual seek operation with aggressive cancellation
        function performSeek(time) {
            if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
            
            // AGGRESSIVE cancellation - cancel everything before starting
            console.log('🚀 [Perform Seek] AGGRESSIVELY cancelling all previous operations');
            cancelPendingSeek();
            
            // Check if this seek is too close to the last one (prevent rapid seeks)
            const timeDiff = Math.abs(time - lastSeekTime);
            if (timeDiff < 1.0) { // Reduced from 2.0 to 1.0 seconds
                console.log('🚀 [Perform Seek] Skipping seek - too close to last seek:', timeDiff.toFixed(2) + 's difference');
                return;
            }
            
            // Check if user is still interacting
            if (isUserInteracting) {
                console.log('🚀 [Perform Seek] Skipping seek - user still interacting');
                return;
            }
            
            // Check if this seek is still the current pending seek
            if (pendingSeekTime !== time) {
                console.log('🚀 [Perform Seek] Skipping seek - not the current pending seek');
                return;
            }
            
            lastSeekTime = time;
            console.log('🚀 [Perform Seek] Starting seek operation to:', time.toFixed(2) + 's');
            
            // Set up seeking event handlers
            const handleSeeking = () => {
                console.log('🚀 [Perform Seek] Audio seeking started - browser is processing seek');
                hideURL();
            };
            
            const handleSeeked = () => {
                console.log('🚀 [Perform Seek] Audio seek completed to:', audioPlayer.currentTime.toFixed(2) + 's');
                isSeeking = false;
                pendingSeekTime = null;
                
                // Clean up event listeners
                audioPlayer.removeEventListener('seeking', handleSeeking);
                audioPlayer.removeEventListener('seeked', handleSeeked);
                
                console.log('🚀 [Perform Seek] Seek operation completed successfully');
                hideURL();
            };
            
            const handleError = () => {
                console.log('🚀 [Perform Seek] Seek operation failed or was cancelled');
                isSeeking = false;
                pendingSeekTime = null;
                
                // Clean up event listeners
                audioPlayer.removeEventListener('seeking', handleSeeking);
                audioPlayer.removeEventListener('seeked', handleSeeked);
                audioPlayer.removeEventListener('error', handleError);
                
                console.log('🚀 [Perform Seek] Seek operation cleanup completed');
                hideURL();
            };
            
            // Add event listeners
            audioPlayer.addEventListener('seeking', handleSeeking);
            audioPlayer.addEventListener('seeked', handleSeeked);
            audioPlayer.addEventListener('error', handleError);
            
            // Perform the seek
            try {
                // Ensure audio is ready for seeking
                if (audioPlayer.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                    console.log('🚀 [Perform Seek] Audio ready for seeking, setting currentTime to:', time.toFixed(2) + 's');
                    audioPlayer.currentTime = time;
                } else {
                    console.log('🚀 [Perform Seek] Audio not ready for seeking (readyState:', audioPlayer.readyState + '), waiting...');
                    // Wait for audio to be ready, then seek
                    const waitForReady = () => {
                        if (audioPlayer.readyState >= 2) {
                            console.log('🚀 [Perform Seek] Audio now ready, performing seek to:', time.toFixed(2) + 's');
                            audioPlayer.currentTime = time;
                        } else {
                            setTimeout(waitForReady, 50);
                        }
                    };
                    waitForReady();
                }
            } catch (error) {
                console.error('🚀 [Perform Seek] Seek error:', error);
                handleError();
            }
            
            // Set up timeout to prevent hanging
            setTimeout(() => {
                if (isSeeking) {
                    console.log('🚀 [Perform Seek] Seek timeout reached, forcing completion');
                    handleSeeked();
                }
            }, 2000); // 2 second timeout
        }
        
        function seekForward(seconds) {
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                const newTime = Math.min(audioPlayer.currentTime + seconds, audioPlayer.duration);
                const percentage = (newTime / audioPlayer.duration) * 100;
                console.log('⏩ [Seek Forward] Skipping forward', seconds, 'seconds');
                handleSeekChange(percentage);
            }
        }
        
        function seekBackward(seconds) {
            if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                const newTime = Math.max(audioPlayer.currentTime - seconds, 0);
                const percentage = (newTime / audioPlayer.duration) * 100;
                console.log('⏪ [Seek Backward] Skipping backward', seconds, 'seconds');
                handleSeekChange(percentage);
            }
        }
        
        function toggleMute() {
            audioPlayer.muted = !audioPlayer.muted;
            const muteBtn = event.target;
            muteBtn.textContent = audioPlayer.muted ? '🔇' : '🔊';
            
            // Hide URL after mute toggle
            hideURL();
        }
        
        // Cleanup when page unloads
        window.addEventListener('beforeunload', function() {
            cancelPendingSeek();
        });
        
        function downloadAudio() {
            const downloadBtn = event.target;
            const originalText = downloadBtn.innerHTML;
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Show loading state
            downloadBtn.innerHTML = '⏳ Downloading...';
            downloadBtn.disabled = true;
            downloadBtn.style.background = isDarkMode ? '#666666' : '#7f8c8d';
            
            // Use our server proxy for download
            const downloadUrl = '/api/proxy-audio?fileId=${fileId}';
            
            // Create a fetch request to get the file size first
            fetch(downloadUrl, { method: 'HEAD' })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Download failed');
                }
                
                // Get file size for progress estimation
                const contentLength = response.headers.get('content-length');
                const fileSize = contentLength ? parseInt(contentLength) : 0;
                
                // Estimate download time based on file size (rough estimate)
                const estimatedTime = Math.max(2000, Math.min(8000, fileSize / 2000)); // 2-8 seconds
                
                // Start the actual download
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'audio_file.mp3';
                link.target = '_blank';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Reset button after estimated download time
                setTimeout(() => {
                  downloadBtn.innerHTML = '✅ Downloaded';
                  downloadBtn.style.background = isDarkMode ? '#000000' : '#27ae60';
                  
                  // Reset to original state after showing success
                  setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;
                    downloadBtn.style.background = ''; // Let CSS handle the normal state
                  }, 1500);
                }, estimatedTime);
              })
              .catch(error => {
                console.error('Download error:', error);
                downloadBtn.innerHTML = '❌ Failed';
                downloadBtn.style.background = isDarkMode ? '#000000' : '#e74c3c';
                
                // Reset to original state after showing error
                setTimeout(() => {
                  downloadBtn.innerHTML = originalText;
                  downloadBtn.disabled = false;
                  downloadBtn.style.background = ''; // Let CSS handle the normal state
                }, 2000);
              });
              
            // Hide URL during download
            hideURL();
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(event) {
            if (event.key === ' ') {
                event.preventDefault();
                togglePlayPause();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                seekBackward(15);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                seekForward(15);
            } else if (event.key === 'm' || event.key === 'M') {
                event.preventDefault();
                toggleMute();
            }
        });
    </script>
</body>
</html>`;

  return new Response(audioViewerHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
}
