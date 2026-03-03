// server.js - Single file for SSE testing
const express = require('express');
const app = express();
const port = 3000;

// Middleware to serve static files (optional)
app.use(express.static('public'));

// Main route that returns HTML with the SSE client
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en-US">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSE Test - Server Sent Events</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            
            .status-card {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
            }
            
            .connected {
                background-color: #4CAF50;
                box-shadow: 0 0 10px #4CAF50;
            }
            
            .disconnected {
                background-color: #f44336;
                box-shadow: 0 0 10px #f44336;
            }
            
            .events-panel {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
                font-family: monospace;
            }
            
            .event-item {
                background: rgba(255, 255, 255, 0.1);
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
                border-left: 4px solid #4CAF50;
                animation: slideIn 0.3s ease;
            }
            
            .event-meta {
                font-size: 0.8em;
                color: #ccc;
                margin-bottom: 5px;
            }
            
            .event-data {
                font-weight: bold;
            }
            
            .event-type {
                display: inline-block;
                background: #4CAF50;
                color: white;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 0.7em;
                margin-left: 10px;
            }
            
            .controls {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            button {
                background: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            button.connect {
                background: #4CAF50;
                color: white;
            }
            
            button.disconnect {
                background: #f44336;
                color: white;
            }
            
            button.clear {
                background: #FFC107;
                color: black;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .stats {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
                padding: 15px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-value {
                font-size: 1.5em;
                font-weight: bold;
            }
            
            .stat-label {
                font-size: 0.8em;
                opacity: 0.8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📡 SSE Test - Server Sent Events</h1>
            
            <div class="status-card">
                <span class="status-indicator disconnected" id="statusIndicator"></span>
                <span id="statusText">Disconnected</span>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value" id="eventCount">0</div>
                    <div class="stat-label">Events Received</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="lastEvent">-</div>
                    <div class="stat-label">Last Event</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="connectionTime">0s</div>
                    <div class="stat-label">Connected Time</div>
                </div>
            </div>
            
            <div class="events-panel" id="events">
                <div style="text-align: center; opacity: 0.5; padding: 20px;">
                    Click "Connect" to start receiving events...
                </div>
            </div>
            
            <div class="controls">
                <button class="connect" onclick="connectSSE()">🔌 Connect</button>
                <button class="disconnect" onclick="disconnectSSE()">⏏️ Disconnect</button>
                <button class="clear" onclick="clearEvents()">🗑️ Clear Events</button>
            </div>
        </div>
        
        <script>
            let eventSource = null;
            let eventCount = 0;
            let connectionTimer = null;
            let secondsConnected = 0;
            
            // Function to connect SSE
            function connectSSE() {
                if (eventSource) {
                    disconnectSSE();
                }
                
                // Create a new SSE connection for the /events route
                eventSource = new EventSource('/events');
                
                // Update UI
                document.getElementById('statusIndicator').className = 'status-indicator connected';
                document.getElementById('statusText').textContent = 'Connected';
                
                // Start timer
                secondsConnected = 0;
                if (connectionTimer) clearInterval(connectionTimer);
                connectionTimer = setInterval(() => {
                    secondsConnected++;
                    document.getElementById('connectionTime').textContent = secondsConnected + 's';
                }, 1000);
                
                // Generic event (for all event types)
                eventSource.onmessage = function(event) {
                    try {
                        const data = JSON.parse(event.data);
                        addEventToPanel('message', data, 'normal');
                    } catch (e) {
                        addEventToPanel('raw', event.data, 'info');
                    }
                };
                
                // Specific event: notification
                eventSource.addEventListener('notification', function(event) {
                    const data = JSON.parse(event.data);
                    addEventToPanel('notification', data, 'notification');
                });
                
                // Specific event: alert
                eventSource.addEventListener('alert', function(event) {
                    const data = JSON.parse(event.data);
                    addEventToPanel('alert', data, 'alert');
                });
                
                // Specific event: update
                eventSource.addEventListener('update', function(event) {
                    const data = JSON.parse(event.data);
                    addEventToPanel('update', data, 'update');
                });
                
                // Open connection event
                eventSource.onopen = function() {
                    addEventToPanel('system', 'SSE connection established', 'success');
                };
                
                // Error event
                eventSource.onerror = function(error) {
                    console.error('SSE error:', error);
                    addEventToPanel('error', 'SSE connection error', 'error');
                    
                    if (eventSource.readyState === EventSource.CLOSED) {
                        disconnectSSE();
                    }
                };
            }
            
            // Function to disconnect
            function disconnectSSE() {
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
                
                document.getElementById('statusIndicator').className = 'status-indicator disconnected';
                document.getElementById('statusText').textContent = 'Disconnected';
                
                if (connectionTimer) {
                    clearInterval(connectionTimer);
                    connectionTimer = null;
                }
                
                addEventToPanel('system', 'SSE connection closed', 'warning');
            }
            
            // Function to add events to the panel
            function addEventToPanel(type, data, className = '') {
                const eventsDiv = document.getElementById('events');
                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';
                
                const timestamp = new Date().toLocaleTimeString('en-US');
                
                let dataHtml = '';
                if (typeof data === 'object') {
                    dataHtml = JSON.stringify(data, null, 2);
                } else {
                    dataHtml = data;
                }
                
                eventItem.innerHTML = \`
                    <div class="event-meta">
                        <span>🕐 \${timestamp}</span>
                        <span class="event-type">\${type}</span>
                    </div>
                    <div class="event-data">\${dataHtml}</div>
                \`;
                
                eventsDiv.insertBefore(eventItem, eventsDiv.firstChild);
                
                // Update counter
                eventCount++;
                document.getElementById('eventCount').textContent = eventCount;
                document.getElementById('lastEvent').textContent = timestamp;
                
                // Limit number of events in the panel
                while (eventsDiv.children.length > 50) {
                    eventsDiv.removeChild(eventsDiv.lastChild);
                }
            }
            
            // Function to clear events
            function clearEvents() {
                document.getElementById('events').innerHTML = '';
                eventCount = 0;
                document.getElementById('eventCount').textContent = '0';
            }
            
            // Check browser support
            if (typeof EventSource === 'undefined') {
                document.querySelector('.events-panel').innerHTML = 
                    '<div style="color: #f44336; text-align: center;">⚠️ Your browser does not support Server-Sent Events (SSE)</div>';
            }
        </script>
    </body>
    </html>
    `);
});

// SSE route - separated from the main HTML
app.get('/events', (req, res) => {
    console.log('New SSE connection established');
    
    // Configure headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial message
    res.write('event: system\n');
    res.write('data: Connection established with the server\n\n');

    // Heartbeat every 15 seconds
    const heartbeat = setInterval(() => {
        res.write('event: ping\n');
        res.write('data: heartbeat\n\n');
    }, 15000);

    // Periodic notifications
    const notificationInterval = setInterval(() => {
        const notification = {
            id: Date.now(),
            title: 'New Notification',
            message: `Notification #${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            level: Math.random() > 0.7 ? 'important' : 'normal'
        };
        
        res.write('event: notification\n');
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }, 5000);

    // Occasional alerts
    const alertInterval = setInterval(() => {
        if (Math.random() > 0.7) {
            const alert = {
                id: Date.now(),
                severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                message: 'System alert',
                details: `Code: AL-${Math.floor(Math.random() * 1000)}`
            };
            
            res.write('event: alert\n');
            res.write(`data: ${JSON.stringify(alert)}\n\n`);
        }
    }, 8000);

    // Status updates
    const updateInterval = setInterval(() => {
        const update = {
            type: 'status',
            cpu: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 100),
            connections: Math.floor(Math.random() * 50),
            timestamp: new Date().toISOString()
        };
        
        res.write('event: update\n');
        res.write(`data: ${JSON.stringify(update)}\n\n`);
    }, 3000);

    // General messages
    const messageInterval = setInterval(() => {
        const message = {
            type: 'general',
            content: 'Server message',
            value: Math.random().toFixed(4),
            timestamp: new Date().toISOString()
        };
        
        res.write(`data: ${JSON.stringify(message)}\n\n`);
    }, 2000);

    // Clear intervals when the connection closes
    req.on('close', () => {
        console.log('SSE connection closed');
        clearInterval(heartbeat);
        clearInterval(notificationInterval);
        clearInterval(alertInterval);
        clearInterval(updateInterval);
        clearInterval(messageInterval);
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 SSE test server running at http://localhost:${port}`);
    console.log(`📡 SSE route: http://localhost:${port}/events`);
    console.log(`🖥️  Web interface: http://localhost:${port}`);
});