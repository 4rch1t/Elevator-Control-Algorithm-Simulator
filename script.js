// Elevator Control Simulator
class ElevatorSimulator {
    constructor() {
        // Configuration
        this.currentFloor = 1;
        this.totalFloors = 10;
        this.speed = 500; // milliseconds per floor
        this.algorithm = 'fifo';
        
        // State
        this.requests = [];
        this.isRunning = false;
        this.isPaused = false;
        this.direction = 'IDLE';
        this.targetFloor = null;
        this.moveInterval = null;
        
        // UI Elements
        this.elevatorShaft = document.getElementById('elevatorShaft');
        this.elevatorCar = document.getElementById('elevatorCar');
        this.floorButtons = document.getElementById('floorButtons');
        this.currentFloorDisplay = document.getElementById('currentFloorDisplay');
        this.carFloorDisplay = document.getElementById('carFloorDisplay');
        this.carDirection = document.getElementById('carDirection');
        this.statusText = document.getElementById('statusText');
        this.statusDot = document.getElementById('statusDot');
        this.requestLog = document.getElementById('requestLog');
        this.requestCount = document.getElementById('requestCount');
        
        // Control Elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.algorithmSelect = document.getElementById('algorithmSelect');
        this.floorCountInput = document.getElementById('floorCountInput');
        this.speedInput = document.getElementById('speedInput');
        this.applyBasicBtn = document.getElementById('applyBasicBtn');
        this.applyAdvancedBtn = document.getElementById('applyAdvancedBtn');
        
        this.init();
    }
    
    init() {
        this.renderFloors();
        this.renderFloorButtons();
        this.setupEventListeners();
        this.updateUI();
    }
    
    renderFloors() {
        this.elevatorShaft.innerHTML = '';
        const floorHeight = 60;
        
        // Render floors 1 to 10 (with column-reverse, F1 will be at bottom, F10 at top)
        for (let i = 1; i <= this.totalFloors; i++) {
            const floorLevel = document.createElement('div');
            floorLevel.className = 'floor-level';
            floorLevel.id = `floor-${i}`;
            floorLevel.style.height = `${floorHeight}px`;
            
            const floorNumber = document.createElement('div');
            floorNumber.className = 'floor-number';
            floorNumber.textContent = `F${i}`;
            
            const floorIndicator = document.createElement('div');
            floorIndicator.className = 'floor-indicator';
            floorIndicator.id = `indicator-${i}`;
            
            floorLevel.appendChild(floorNumber);
            floorLevel.appendChild(floorIndicator);
            this.elevatorShaft.appendChild(floorLevel);
        }
        
        // Set elevator car initial position
        this.updateElevatorPosition();
    }
    
    renderFloorButtons() {
        this.floorButtons.innerHTML = '';
        
        for (let i = 1; i <= this.totalFloors; i++) {
            const btn = document.createElement('button');
            btn.className = 'floor-btn';
            btn.id = `btn-floor-${i}`;
            btn.textContent = `F${i}`;
            btn.addEventListener('click', () => this.addRequest(i));
            this.floorButtons.appendChild(btn);
        }
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.algorithmSelect.addEventListener('change', (e) => {
            this.algorithm = e.target.value;
        });
        this.applyBasicBtn.addEventListener('click', () => this.applyBasicSettings());
        this.applyAdvancedBtn.addEventListener('click', () => this.applyAdvancedSettings());
    }
    
    updateElevatorPosition() {
        const floorHeight = 60;
        const bottomPosition = (this.currentFloor - 1) * floorHeight;
        this.elevatorCar.style.bottom = `${bottomPosition}px`;
    }
    
    updateUI() {
        // Update current floor displays
        this.currentFloorDisplay.textContent = this.currentFloor;
        this.carFloorDisplay.textContent = this.currentFloor;
        this.carDirection.textContent = this.direction;
        
        // Update status
        if (this.isPaused) {
            this.statusText.textContent = 'PAUSED';
            this.statusDot.classList.remove('active');
        } else if (this.isRunning) {
            this.statusText.textContent = this.direction === 'IDLE' ? 'PROCESSING' : this.direction;
            this.statusDot.classList.add('active');
        } else {
            this.statusText.textContent = 'STOPPED';
            this.statusDot.classList.remove('active');
        }
        
        // Update request count
        this.requestCount.textContent = this.requests.length;
        
        // Update floor indicators
        for (let i = 1; i <= this.totalFloors; i++) {
            const indicator = document.getElementById(`indicator-${i}`);
            const btn = document.getElementById(`btn-floor-${i}`);
            const hasRequest = this.requests.some(r => r.floor === i);
            
            if (indicator) {
                indicator.classList.toggle('active', hasRequest);
            }
            if (btn) {
                btn.classList.toggle('active', hasRequest);
            }
        }
    }
    
    addRequest(floor) {
        if (floor < 1 || floor > this.totalFloors) return;
        if (this.requests.some(r => r.floor === floor)) return; // Already requested
        
        const request = {
            floor: floor,
            timestamp: new Date()
        };
        
        this.requests.push(request);
        this.logRequest(`Floor ${floor} requested`, request.timestamp);
        this.updateUI();
        
        // Auto-start if not running
        if (!this.isRunning && !this.isPaused) {
            this.start();
        }
    }
    
    logRequest(message, timestamp) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const dot = document.createElement('div');
        dot.className = 'log-dot';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'log-message';
        messageDiv.textContent = message;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'log-timestamp';
        timeDiv.textContent = timestamp.toLocaleTimeString();
        
        entry.appendChild(dot);
        entry.appendChild(messageDiv);
        entry.appendChild(timeDiv);
        
        this.requestLog.insertBefore(entry, this.requestLog.firstChild);
    }
    
    getNextFloor() {
        if (this.requests.length === 0) return null;
        
        switch (this.algorithm) {
            case 'fifo':
                return this.getNextFloorFIFO();
            case 'scan':
                return this.getNextFloorSCAN();
            case 'direction-based':
                return this.getNextFloorDirectionBased();
            default:
                return this.getNextFloorFIFO();
        }
    }
    
    getNextFloorFIFO() {
        // First In First Out - process requests in order received
        if (this.requests.length === 0) return null;
        return this.requests[0].floor;
    }
    
    getNextFloorSCAN() {
        // SCAN Algorithm - move in one direction until no more requests, then reverse
        if (this.requests.length === 0) return null;
        
        // If elevator is idle, determine direction based on nearest request
        if (this.direction === 'IDLE') {
            const nearestRequest = this.requests.reduce((nearest, req) => {
                const nearestDist = Math.abs(nearest.floor - this.currentFloor);
                const reqDist = Math.abs(req.floor - this.currentFloor);
                return reqDist < nearestDist ? req : nearest;
            });
            
            this.direction = nearestRequest.floor > this.currentFloor ? 'UP' : 'DOWN';
        }
        
        // Find requests in current direction
        let requestsInDirection = [];
        if (this.direction === 'UP') {
            requestsInDirection = this.requests.filter(r => r.floor > this.currentFloor)
                .sort((a, b) => a.floor - b.floor);
        } else {
            requestsInDirection = this.requests.filter(r => r.floor < this.currentFloor)
                .sort((a, b) => b.floor - a.floor);
        }
        
        // If requests exist in current direction, return the next one
        if (requestsInDirection.length > 0) {
            return requestsInDirection[0].floor;
        }
        
        // No requests in current direction - reverse and find closest in opposite direction
        this.direction = this.direction === 'UP' ? 'DOWN' : 'UP';
        
        if (this.direction === 'UP') {
            const upwardRequests = this.requests.filter(r => r.floor > this.currentFloor)
                .sort((a, b) => a.floor - b.floor);
            if (upwardRequests.length > 0) return upwardRequests[0].floor;
        } else {
            const downwardRequests = this.requests.filter(r => r.floor < this.currentFloor)
                .sort((a, b) => b.floor - a.floor);
            if (downwardRequests.length > 0) return downwardRequests[0].floor;
        }
        
        // Fallback to nearest request
        const nearest = this.requests.reduce((nearest, req) => {
            const nearestDist = Math.abs(nearest.floor - this.currentFloor);
            const reqDist = Math.abs(req.floor - this.currentFloor);
            return reqDist < nearestDist ? req : nearest;
        });
        
        return nearest.floor;
    }
    
    getNextFloorDirectionBased() {
        // Direction-Based - continue in same direction if requests ahead, else reverse
        if (this.requests.length === 0) return null;
        
        // If idle, move to nearest request
        if (this.direction === 'IDLE') {
            const nearestRequest = this.requests.reduce((nearest, req) => {
                const nearestDist = Math.abs(nearest.floor - this.currentFloor);
                const reqDist = Math.abs(req.floor - this.currentFloor);
                return reqDist < nearestDist ? req : nearest;
            });
            
            this.direction = nearestRequest.floor > this.currentFloor ? 'UP' : 'DOWN';
            return nearestRequest.floor;
        }
        
        // Check for requests ahead in current direction
        let requestsAhead = [];
        if (this.direction === 'UP') {
            requestsAhead = this.requests.filter(r => r.floor > this.currentFloor)
                .sort((a, b) => a.floor - b.floor);
        } else {
            requestsAhead = this.requests.filter(r => r.floor < this.currentFloor)
                .sort((a, b) => b.floor - a.floor);
        }
        
        // If requests exist ahead, continue in same direction
        if (requestsAhead.length > 0) {
            return requestsAhead[0].floor;
        }
        
        // No requests ahead - reverse direction
        this.direction = this.direction === 'UP' ? 'DOWN' : 'UP';
        
        // Find closest request in new direction
        if (this.direction === 'UP') {
            const upwardRequests = this.requests.filter(r => r.floor > this.currentFloor)
                .sort((a, b) => a.floor - b.floor);
            if (upwardRequests.length > 0) return upwardRequests[0].floor;
        } else {
            const downwardRequests = this.requests.filter(r => r.floor < this.currentFloor)
                .sort((a, b) => b.floor - a.floor);
            if (downwardRequests.length > 0) return downwardRequests[0].floor;
        }
        
        // If no requests in new direction, go to any remaining request
        if (this.requests.length > 0) {
            const nearest = this.requests.reduce((nearest, req) => {
                const nearestDist = Math.abs(nearest.floor - this.currentFloor);
                const reqDist = Math.abs(req.floor - this.currentFloor);
                return reqDist < nearestDist ? req : nearest;
            });
            this.direction = nearest.floor > this.currentFloor ? 'UP' : 'DOWN';
            return nearest.floor;
        }
        
        return null;
    }
    
    moveElevator() {
        if (this.isPaused) return;
        
        // Check if we've reached the target floor
        if (this.targetFloor === null || this.currentFloor === this.targetFloor) {
            // Remove completed request
            if (this.targetFloor !== null) {
                this.requests = this.requests.filter(r => r.floor !== this.targetFloor);
                this.logRequest(`Floor ${this.targetFloor} reached`, new Date());
                this.targetFloor = null;
            }
            
            // Get next target
            const nextFloor = this.getNextFloor();
            
            if (nextFloor === null) {
                // No more requests
                this.direction = 'IDLE';
                this.isRunning = false;
                this.updateUI();
                return;
            }
            
            this.targetFloor = nextFloor;
            
            // Set direction
            if (this.targetFloor > this.currentFloor) {
                this.direction = 'UP';
            } else if (this.targetFloor < this.currentFloor) {
                this.direction = 'DOWN';
            } else {
                this.direction = 'IDLE';
            }
            
            this.updateUI();
        }
        
        // Move towards target
        if (this.targetFloor !== null) {
            if (this.currentFloor < this.targetFloor) {
                this.currentFloor++;
            } else if (this.currentFloor > this.targetFloor) {
                this.currentFloor--;
            }
            
            this.updateElevatorPosition();
            this.updateUI();
        }
    }
    
    start() {
        if (this.isRunning && !this.isPaused) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.updateUI();
        
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
        }
        
        this.moveInterval = setInterval(() => {
            this.moveElevator();
        }, this.speed);
    }
    
    pause() {
        this.isPaused = true;
        this.updateUI();
        
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentFloor = 1;
        this.requests = [];
        this.targetFloor = null;
        this.direction = 'IDLE';
        
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        
        this.updateElevatorPosition();
        this.updateUI();
        this.requestLog.innerHTML = '';
    }
    
    applyBasicSettings() {
        this.totalFloors = 10;
        this.speed = 500;
        this.floorCountInput.value = 10;
        this.speedInput.value = 500;
        this.reset();
        this.renderFloors();
        this.renderFloorButtons();
    }
    
    applyAdvancedSettings() {
        const newFloorCount = parseInt(this.floorCountInput.value);
        const newSpeed = parseInt(this.speedInput.value);
        
        if (newFloorCount >= 3 && newFloorCount <= 20) {
            this.totalFloors = newFloorCount;
        }
        
        if (newSpeed >= 100 && newSpeed <= 2000) {
            this.speed = newSpeed;
            
            // Update interval if running
            if (this.moveInterval) {
                clearInterval(this.moveInterval);
                this.moveInterval = setInterval(() => {
                    this.moveElevator();
                }, this.speed);
            }
        }
        
        // Adjust current floor if needed
        if (this.currentFloor > this.totalFloors) {
            this.currentFloor = this.totalFloors;
        }
        
        // Remove requests for floors that no longer exist
        this.requests = this.requests.filter(r => r.floor <= this.totalFloors);
        
        this.renderFloors();
        this.renderFloorButtons();
        this.updateUI();
    }
}

// Initialize simulator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ElevatorSimulator();
});

