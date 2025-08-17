// VOIP Handler Module with Click-to-Call Integration
class VoipHandler {
    constructor() {
        this.isServiceActive = false;
        this.activeCalls = new Map();
        this.callHistory = [];
        this.ttsEnabled = true;
        this.twilioConfig = {
            accountSid: null, // Set in settings
            authToken: null,  // Set in settings
            phoneNumber: '+13609721924' // SoftAIDev business number
        };
        this.clickToCallEnabled = true;
        this.callTemplates = {
            greeting: "Hello, thank you for calling SoftAIDev customer support. This is the Virtual Assistant, how may I assist you today?",
            understanding: "Thank you for sharing that with me. I understand you're experiencing [issue description]. Let me look into this for you.",
            investigating: "Could you please provide [specific information needed]? One moment while I look into this.",
            solution: "I have found the information you requested. [Provide solution or information]. Is there anything else I can help you with?",
            escalation: "I'd like to connect you with one of our technical specialists who can better assist you with this issue. Please hold while I transfer your call.",
            closing: "Thank you for contacting SoftAIDev. Have a great day!"
        };
        this.voiceSettings = {
            voice: 'default',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8
        };
        this.init();
    }

    init() {
        // Add sample call history
        this.addSampleCallHistory();
        this.updateCallDisplay();
        this.updateCallStatus();
        
        // Check for Web Speech API support
        this.checkTTSSupport();
        
        // Initialize click-to-call widget
        this.initClickToCallWidget();
        
        // Simulate incoming calls when service is active
        setInterval(() => {
            if (this.isServiceActive && Math.random() < 0.03) { // 3% chance every interval
                this.simulateIncomingCall();
            }
        }, 30000); // Check every 30 seconds
    }

    checkTTSSupport() {
        if ('speechSynthesis' in window) {
            this.ttsSupported = true;
            console.log('Text-to-Speech supported');
        } else {
            this.ttsSupported = false;
            console.warn('Text-to-Speech not supported in this browser');
        }
    }

    addSampleCallHistory() {
        const sampleCalls = [
            {
                id: 'call_001',
                phoneNumber: '+1-555-0123',
                startTime: new Date(Date.now() - 3600000), // 1 hour ago
                endTime: new Date(Date.now() - 3375000), // 56.25 minutes ago
                duration: '3:45',
                type: 'incoming',
                status: 'completed',
                summary: 'Customer inquiry about cloud solutions pricing'
            },
            {
                id: 'call_002',
                phoneNumber: '+1-555-0456',
                startTime: new Date(Date.now() - 7200000), // 2 hours ago
                endTime: new Date(Date.now() - 6900000), // 1h 55m ago
                duration: '5:00',
                type: 'incoming',
                status: 'completed',
                summary: 'Technical support for web application issues'
            }
        ];
        
        this.callHistory = sampleCalls;
    }

    simulateIncomingCall() {
        const phoneNumbers = [
            '+1-555-0789',
            '+1-555-0321',
            '+1-555-0654',
            '+1-555-0987'
        ];

        const callId = 'call_' + Date.now();
        const phoneNumber = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
        
        const incomingCall = {
            id: callId,
            phoneNumber: phoneNumber,
            startTime: new Date(),
            type: 'incoming',
            status: 'ringing'
        };

        this.activeCalls.set(callId, incomingCall);
        this.updateCallDisplay();
        this.showIncomingCallNotification(incomingCall);
        
        // Auto-answer after 3 seconds for demo
        setTimeout(() => {
            this.answerCall(callId);
        }, 3000);
    }

    showIncomingCallNotification(call) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 3px solid #4caf50;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 4000;
            text-align: center;
            animation: pulse 1s infinite;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 1rem;">📞 Incoming Call</div>
            <div style="font-size: 1.2rem; margin-bottom: 1.5rem;">${call.phoneNumber}</div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="voipHandler.answerCall('${call.id}'); this.closest('div').remove();" 
                        style="background: #4caf50; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                    Answer
                </button>
                <button onclick="voipHandler.declineCall('${call.id}'); this.closest('div').remove();" 
                        style="background: #f44336; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                    Decline
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    answerCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        call.status = 'active';
        call.startTime = new Date();
        
        this.updateCallDisplay();
        this.showCallInterface(call);
        
        // Speak greeting
        this.speak(this.callTemplates.greeting);
        
        this.addActivity('call', `Answered call from ${call.phoneNumber}`);
    }

    declineCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        call.status = 'declined';
        call.endTime = new Date();
        
        // Move to history
        this.callHistory.unshift({
            ...call,
            duration: '0:00',
            summary: 'Call declined'
        });
        
        this.activeCalls.delete(callId);
        this.updateCallDisplay();
        
        this.addActivity('call', `Declined call from ${call.phoneNumber}`);
    }

    showCallInterface(call) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📞 Active Call - ${call.phoneNumber}</h3>
                    <span id="call-timer">00:00</span>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <div style="margin-bottom: 2rem;">
                        <div style="font-size: 1.2rem; margin-bottom: 1rem;">Call Status: <strong>Active</strong></div>
                        <div style="font-size: 1rem; color: #666;">Use the buttons below to respond to the caller</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <button onclick="voipHandler.useCallTemplate('greeting')" class="btn-secondary">Greeting</button>
                        <button onclick="voipHandler.useCallTemplate('understanding')" class="btn-secondary">Understanding</button>
                        <button onclick="voipHandler.useCallTemplate('investigating')" class="btn-secondary">Investigating</button>
                        <button onclick="voipHandler.useCallTemplate('solution')" class="btn-secondary">Solution</button>
                        <button onclick="voipHandler.useCallTemplate('escalation')" class="btn-secondary">Escalate</button>
                        <button onclick="voipHandler.useCallTemplate('closing')" class="btn-secondary">Closing</button>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <textarea id="custom-response" placeholder="Type custom response..." 
                                style="width: 100%; height: 100px; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                        <button onclick="voipHandler.speakCustom()" class="btn-primary" style="margin-top: 0.5rem;">Speak Custom Response</button>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button onclick="voipHandler.holdCall('${call.id}')" class="btn-secondary">Hold</button>
                        <button onclick="voipHandler.muteCall('${call.id}')" class="btn-secondary">Mute</button>
                        <button onclick="voipHandler.endCall('${call.id}'); this.closest('.modal').remove();" 
                                class="btn-call" style="background: #f44336;">End Call</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start call timer
        this.startCallTimer(call.id);
    }

    startCallTimer(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        const timerElement = document.getElementById('call-timer');
        if (!timerElement) return;

        const startTime = call.startTime.getTime();
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        
        // Store interval for cleanup
        call.timerInterval = interval;
    }

    useCallTemplate(templateKey) {
        const template = this.callTemplates[templateKey];
        if (template) {
            this.speak(template);
            this.addActivity('call', `Used ${templateKey} template`);
        }
    }

    speakCustom() {
        const textarea = document.getElementById('custom-response');
        if (textarea && textarea.value.trim()) {
            this.speak(textarea.value.trim());
            textarea.value = '';
            this.addActivity('call', 'Spoke custom response');
        }
    }

    speak(text) {
        if (!this.ttsSupported || !this.ttsEnabled) {
            console.log('TTS not available, would speak:', text);
            this.showNotification('TTS: ' + text.substring(0, 50) + '...', 'info');
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voiceSettings.speed;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;

        // Set voice if available
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices.find(voice => voice.name.includes('Female')) || voices[0];
        }

        utterance.onstart = () => {
            console.log('Speaking:', text);
        };

        utterance.onend = () => {
            console.log('Finished speaking');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };

        speechSynthesis.speak(utterance);
    }

    holdCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        call.status = call.status === 'hold' ? 'active' : 'hold';
        
        if (call.status === 'hold') {
            this.speak("Please hold while I look into this for you.");
        }
        
        this.updateCallDisplay();
        this.addActivity('call', `${call.status === 'hold' ? 'Put call on hold' : 'Resumed call'}`);
    }

    muteCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        call.muted = !call.muted;
        this.addActivity('call', `${call.muted ? 'Muted' : 'Unmuted'} call`);
    }

    endCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        call.status = 'completed';
        call.endTime = new Date();
        
        // Calculate duration
        const duration = call.endTime - call.startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        call.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Clear timer
        if (call.timerInterval) {
            clearInterval(call.timerInterval);
        }

        // Move to history
        this.callHistory.unshift({
            ...call,
            summary: 'Customer service call completed'
        });

        this.activeCalls.delete(callId);
        this.updateCallDisplay();
        
        this.addActivity('call', `Ended call with ${call.phoneNumber} - Duration: ${call.duration}`);
    }

    toggleVoipService() {
        this.isServiceActive = !this.isServiceActive;
        this.updateCallStatus();
        
        const button = document.querySelector('.call-controls .btn-call');
        const toggleText = document.getElementById('voip-toggle-text');
        
        if (this.isServiceActive) {
            toggleText.textContent = 'Stop VOIP Service';
            button.style.background = '#f44336';
            this.showNotification('VOIP service started', 'success');
        } else {
            toggleText.textContent = 'Start VOIP Service';
            button.style.background = '#4caf50';
            this.showNotification('VOIP service stopped', 'info');
        }
        
        this.addActivity('call', `VOIP service ${this.isServiceActive ? 'started' : 'stopped'}`);
    }

    testTTS() {
        const testMessage = "Hello, this is a test of the SoftAIDev virtual assistant text-to-speech system. The system is working correctly.";
        this.speak(testMessage);
        this.addActivity('call', 'Tested TTS system');
    }

    updateCallDisplay() {
        // Update active calls
        const activeCallsContainer = document.getElementById('active-calls');
        if (activeCallsContainer) {
            if (this.activeCalls.size === 0) {
                activeCallsContainer.innerHTML = `
                    <div class="call-item">
                        <div class="call-info">
                            <strong>No active calls</strong>
                        </div>
                    </div>
                `;
            } else {
                activeCallsContainer.innerHTML = '';
                this.activeCalls.forEach(call => {
                    const callDiv = document.createElement('div');
                    callDiv.className = 'call-item';
                    callDiv.innerHTML = `
                        <div class="call-info">
                            <strong>${call.phoneNumber}</strong>
                            <span style="color: ${call.status === 'active' ? '#4caf50' : '#ff9800'};">
                                ${call.status.toUpperCase()}
                            </span>
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <button class="btn-small" onclick="voipHandler.showCallInterface(voipHandler.activeCalls.get('${call.id}'))">
                                Manage Call
                            </button>
                        </div>
                    `;
                    activeCallsContainer.appendChild(callDiv);
                });
            }
        }

        // Update call history
        const callHistoryContainer = document.getElementById('call-history');
        if (callHistoryContainer) {
            const callLog = callHistoryContainer.querySelector('.call-log');
            callLog.innerHTML = '';
            
            this.callHistory.slice(0, 5).forEach(call => {
                const callEntry = document.createElement('div');
                callEntry.className = 'call-entry';
                callEntry.innerHTML = `
                    <span>${call.phoneNumber}</span>
                    <span>${this.formatTime(call.startTime)}</span>
                    <span class="call-duration">${call.duration}</span>
                `;
                callLog.appendChild(callEntry);
            });
        }
    }

    updateCallStatus() {
        const statusElement = document.getElementById('call-status');
        if (statusElement) {
            statusElement.textContent = this.isServiceActive ? 'Active' : 'Inactive';
            statusElement.style.background = this.isServiceActive ? '#4caf50' : '#666';
        }
    }

    formatTime(timestamp) {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Click-to-Call Widget Implementation
    initClickToCallWidget() {
        // Only add to visitor-facing pages, not admin interface
        if (window.location.pathname.includes('virtual-assistant')) {
            return;
        }

        const callWidget = document.createElement('div');
        callWidget.id = 'click-to-call-widget';
        callWidget.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #4caf50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 999;
            transition: all 0.3s ease;
            animation: pulse 2s infinite;
        `;
        
        callWidget.innerHTML = '📞';
        callWidget.title = 'Call SoftAIDev: ' + this.twilioConfig.phoneNumber;
        callWidget.onclick = () => this.initiateCall();
        
        // Add hover effects
        callWidget.onmouseenter = () => {
            callWidget.style.transform = 'scale(1.1)';
            callWidget.style.background = '#45a049';
        };
        
        callWidget.onmouseleave = () => {
            callWidget.style.transform = 'scale(1)';
            callWidget.style.background = '#4caf50';
        };
        
        document.body.appendChild(callWidget);
    }

    initiateCall() {
        // Show call options modal
        this.showCallOptionsModal();
    }

    showCallOptionsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📞 Contact SoftAIDev</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <div style="margin-bottom: 2rem;">
                        <h4>Choose how you'd like to connect:</h4>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 300px; margin: 0 auto;">
                        <button onclick="voipHandler.directCall()" class="btn-call" style="padding: 1rem; font-size: 1.1rem;">
                            📱 Call Now: ${this.twilioConfig.phoneNumber}
                        </button>
                        
                        <button onclick="voipHandler.requestCallback()" class="btn-primary" style="padding: 1rem;">
                            📞 Request Callback
                        </button>
                        
                        <button onclick="voipHandler.scheduleCall()" class="btn-secondary" style="padding: 1rem;">
                            📅 Schedule Call
                        </button>
                        
                        <button onclick="voipHandler.startWebCall()" class="btn-secondary" style="padding: 1rem;">
                            🌐 Web Call (Beta)
                        </button>
                    </div>
                    
                    <div style="margin-top: 2rem; font-size: 0.9rem; color: #666;">
                        <p><strong>Business Hours:</strong> Mon-Fri 9AM-6PM PST</p>
                        <p><strong>Email:</strong> customersupport@softaidev.com</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    directCall() {
        // Direct phone dialing
        window.location.href = `tel:${this.twilioConfig.phoneNumber}`;
        this.addActivity('call', `Initiated direct call to ${this.twilioConfig.phoneNumber}`);
        
        // Close modal
        document.querySelector('.modal').remove();
    }

    requestCallback() {
        // Show callback request form
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📞 Request Callback</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 2rem;">
                    <form onsubmit="voipHandler.submitCallbackRequest(event)">
                        <div style="margin-bottom: 1rem;">
                            <label><strong>Your Name:</strong></label>
                            <input type="text" id="callback-name" required style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label><strong>Phone Number:</strong></label>
                            <input type="tel" id="callback-phone" required style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label><strong>Best Time to Call:</strong></label>
                            <select id="callback-time" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
                                <option value="asap">As soon as possible</option>
                                <option value="morning">Morning (9AM-12PM)</option>
                                <option value="afternoon">Afternoon (12PM-5PM)</option>
                                <option value="evening">Evening (5PM-8PM)</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label><strong>Reason for Call:</strong></label>
                            <textarea id="callback-reason" rows="3" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;" placeholder="Brief description of what you'd like to discuss..."></textarea>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <button type="submit" class="btn-primary">Submit Request</button>
                            <button type="button" onclick="this.closest('.modal').remove()" class="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Close previous modal
        document.querySelectorAll('.modal').forEach(m => m.remove());
        document.body.appendChild(modal);
    }

    submitCallbackRequest(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('callback-name').value,
            phone: document.getElementById('callback-phone').value,
            time: document.getElementById('callback-time').value,
            reason: document.getElementById('callback-reason').value,
            timestamp: new Date().toISOString()
        };
        
        // Store callback request (in real implementation, send to server)
        this.storeCallbackRequest(formData);
        
        // Show confirmation
        this.showNotification('Callback request submitted! We\'ll call you within 2 hours during business hours.', 'success');
        
        // Close modal
        document.querySelector('.modal').remove();
        
        this.addActivity('call', `Callback requested by ${formData.name} - ${formData.phone}`);
    }

    scheduleCall() {
        // Show scheduling interface
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📅 Schedule Call</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <p>Schedule a consultation call with our team.</p>
                    <div style="margin: 2rem 0;">
                        <a href="https://calendly.com/softaidev" target="_blank" class="btn-primary" style="display: inline-block; padding: 1rem 2rem; text-decoration: none;">
                            📅 Open Scheduling Calendar
                        </a>
                    </div>
                    <p style="font-size: 0.9rem; color: #666;">
                        Or call us directly at ${this.twilioConfig.phoneNumber}
                    </p>
                </div>
            </div>
        `;
        
        // Close previous modal
        document.querySelectorAll('.modal').forEach(m => m.remove());
        document.body.appendChild(modal);
    }

    startWebCall() {
        // WebRTC implementation (basic version)
        this.showNotification('Web calling feature coming soon! Please use direct call for now.', 'info');
        
        // Close modal
        document.querySelector('.modal').remove();
        
        // For now, fallback to direct call
        setTimeout(() => {
            this.directCall();
        }, 2000);
    }

    storeCallbackRequest(formData) {
        // Store in localStorage for demo (in production, send to server/CRM)
        let callbacks = JSON.parse(localStorage.getItem('callbackRequests') || '[]');
        callbacks.unshift(formData);
        
        // Keep only last 50 requests
        if (callbacks.length > 50) {
            callbacks = callbacks.slice(0, 50);
        }
        
        localStorage.setItem('callbackRequests', JSON.stringify(callbacks));
        
        // Add to call history for admin view
        this.callHistory.unshift({
            id: 'callback_' + Date.now(),
            phoneNumber: formData.phone,
            startTime: new Date(),
            type: 'callback_request',
            status: 'pending',
            summary: `Callback request: ${formData.reason}`,
            customerName: formData.name
        });
        
        this.updateCallDisplay();
    }

    // Twilio Integration Methods
    initTwilioService() {
        if (!this.twilioConfig.accountSid || !this.twilioConfig.authToken) {
            console.warn('Twilio credentials not configured');
            return false;
        }
        
        // Initialize Twilio client (requires Twilio SDK)
        try {
            // This would require Twilio SDK to be loaded
            // const client = new Twilio.Device();
            // client.setup(token);
            console.log('Twilio service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Twilio:', error);
            return false;
        }
    }

    configureTwilio(accountSid, authToken) {
        this.twilioConfig.accountSid = accountSid;
        this.twilioConfig.authToken = authToken;
        
        // Save to settings
        if (typeof virtualAssistant !== 'undefined') {
            virtualAssistant.settings.twilioAccountSid = accountSid;
            virtualAssistant.settings.twilioAuthToken = authToken;
            virtualAssistant.saveSettings();
        }
        
        this.addActivity('system', 'Twilio configuration updated');
    }

    showCallbackRequests() {
        const callbacks = JSON.parse(localStorage.getItem('callbackRequests') || '[]');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📞 Callback Requests</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                    ${callbacks.length === 0 ? 
                        '<p style="text-align: center; color: #666;">No callback requests yet.</p>' :
                        callbacks.map(callback => `
                            <div style="border: 1px solid #eee; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fafafa;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${callback.name}</strong>
                                    <span style="color: #666; font-size: 0.9rem;">${new Date(callback.timestamp).toLocaleString()}</span>
                                </div>
                                <div style="margin-bottom: 0.5rem;">
                                    <strong>Phone:</strong> <a href="tel:${callback.phone}" style="color: #1a237e;">${callback.phone}</a>
                                </div>
                                <div style="margin-bottom: 0.5rem;">
                                    <strong>Best Time:</strong> ${callback.time}
                                </div>
                                <div style="margin-bottom: 0.5rem;">
                                    <strong>Reason:</strong> ${callback.reason}
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button onclick="window.location.href='tel:${callback.phone}'" class="btn-small" style="background: #4caf50; color: white;">Call Now</button>
                                    <button onclick="voipHandler.markCallbackComplete('${callback.timestamp}')" class="btn-small">Mark Complete</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    markCallbackComplete(timestamp) {
        let callbacks = JSON.parse(localStorage.getItem('callbackRequests') || '[]');
        callbacks = callbacks.filter(cb => cb.timestamp !== timestamp);
        localStorage.setItem('callbackRequests', JSON.stringify(callbacks));
        
        // Refresh the modal
        document.querySelector('.modal').remove();
        this.showCallbackRequests();
        
        this.addActivity('call', 'Callback request marked as complete');
    }

    addActivity(type, description) {
        if (typeof window.addActivity === 'function') {
            window.addActivity(type, description);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'info' ? '#2196f3' : '#ff9800'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 3000;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Global functions for HTML onclick handlers
function toggleVoipService() {
    voipHandler.toggleVoipService();
}

function testTTS() {
    voipHandler.testTTS();
}

function showCallbackRequests() {
    voipHandler.showCallbackRequests();
}

// Initialize VOIP handler when DOM is loaded
let voipHandler;
document.addEventListener('DOMContentLoaded', function() {
    voipHandler = new VoipHandler();
});
