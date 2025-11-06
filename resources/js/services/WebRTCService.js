/**
 * WebRTC Service for Audio and Video Calling
 */
class WebRTCService {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.localAudio = null;
        this.remoteAudio = null;
        this.localVideo = null;
        this.remoteVideo = null;
        this.isCaller = false;
        this.callType = 'audio'; // 'audio' or 'video'
        this.pendingCandidates = []; // Store ICE candidates before peer connection is ready
        this.callbacks = {
            onLocalStream: null,
            onRemoteStream: null,
            onCallEnded: null,
            onError: null,
            onIceCandidate: null, // Callback for ICE candidates
        };

        // ICE servers configuration (optimized for local system)
        // For local development, we can use localhost STUN or no STUN for same-network calls
        // On localhost, WebRTC can work without STUN for direct connections
        this.iceServers = {
            iceServers: [
                // Try public STUN servers (works for local network too)
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // For localhost, empty config might work for direct connection
                // But we'll use STUN as fallback
            ],
            iceCandidatePoolSize: 10, // Pre-gather candidates for faster connection
        };
    }

    /**
     * Set callback handlers
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Initialize local media stream (audio and/or video)
     */
    async initializeLocalStream(callType = 'audio') {
        try {
            this.callType = callType;
            const constraints = {
                audio: true,
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false,
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            if (this.localAudio) {
                this.localAudio.srcObject = this.localStream;
            }
            if (this.localVideo && callType === 'video') {
                this.localVideo.srcObject = this.localStream;
            }

            if (this.callbacks.onLocalStream) {
                this.callbacks.onLocalStream(this.localStream);
            }

            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            const errorMessage = callType === 'video' 
                ? 'Failed to access camera/microphone. Please check permissions.'
                : 'Failed to access microphone. Please check permissions.';
            if (this.callbacks.onError) {
                this.callbacks.onError(errorMessage);
            }
            throw error;
        }
    }

    /**
     * Create peer connection
     */
    createPeerConnection() {
        // Don't create if already exists and is in use
        if (this.peerConnection) {
            const state = this.peerConnection.signalingState;
            // Only reuse if not in a final state
            if (state !== 'closed' && state !== 'failed') {
                console.log('Peer connection already exists, reusing...', state);
                return;
            } else {
                console.log('Peer connection in final state, creating new one...', state);
                // Close old connection
                try {
                    this.peerConnection.close();
                } catch (e) {
                    // Ignore errors
                }
            }
        }
        
        this.peerConnection = new RTCPeerConnection(this.iceServers);
        console.log('Peer connection created');

        // Process any pending ICE candidates
        this.processPendingCandidates();

        // Add local stream tracks to peer connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                console.log('Adding local track:', track.kind, track.id, track.enabled);
                this.peerConnection.addTrack(track, this.localStream);
            });
        } else {
            console.warn('No local stream available when creating peer connection');
        }

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind, event.track.id, event.streams);
            console.log('Track state:', event.track.readyState);
            console.log('Stream tracks:', event.streams[0]?.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled })));
            
            this.remoteStream = event.streams[0];
            
            if (this.remoteAudio && event.streams[0]) {
                const audioTracks = event.streams[0].getAudioTracks();
                console.log('Audio tracks received:', audioTracks.length);
                
                if (audioTracks.length > 0) {
                    this.remoteAudio.srcObject = event.streams[0];
                    // Ensure audio plays with multiple attempts
                    const playAudio = async () => {
                        try {
                            await this.remoteAudio.play();
                            console.log('Remote audio playing successfully');
                            // Increase volume to ensure it's audible
                            this.remoteAudio.volume = 1.0;
                        } catch (err) {
                            console.error('Error playing remote audio:', err);
                            // Try again after user interaction
                            setTimeout(() => {
                                this.remoteAudio.play().catch(e => {
                                    console.error('Retry play failed:', e);
                                });
                            }, 1000);
                        }
                    };
                    playAudio();
                }
            }
            
            if (this.remoteVideo && this.callType === 'video' && event.streams[0]) {
                const videoTracks = event.streams[0].getVideoTracks();
                console.log('Video tracks received:', videoTracks.length);
                
                if (videoTracks.length > 0) {
                    this.remoteVideo.srcObject = event.streams[0];
                    this.remoteVideo.play().catch(err => {
                        console.error('Error playing remote video:', err);
                    });
                }
            }
            
            if (this.callbacks.onRemoteStream) {
                this.callbacks.onRemoteStream(event.streams[0]);
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // ICE candidate will be sent via signaling (API)
                console.log('ICE candidate generated:', event.candidate);
                // Notify callback to send candidate to peer
                if (this.callbacks.onIceCandidate) {
                    this.callbacks.onIceCandidate(event.candidate);
                }
            } else {
                console.log('ICE gathering complete');
            }
        };

        // Handle ICE connection state changes
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.peerConnection.iceConnectionState);
            if (this.peerConnection.iceConnectionState === 'failed') {
                console.error('ICE connection failed');
            } else if (this.peerConnection.iceConnectionState === 'connected' || 
                       this.peerConnection.iceConnectionState === 'completed') {
                console.log('ICE connection established!');
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Peer connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                console.log('Peer connection established!');
            } else if (this.peerConnection.connectionState === 'failed' || 
                       this.peerConnection.connectionState === 'disconnected') {
                console.error('Peer connection failed or disconnected');
                // Don't auto-end, let user handle it
            }
        };
    }

    /**
     * Start call as caller
     */
    async startCallAsCaller(callType = 'audio') {
        this.isCaller = true;
        this.callType = callType;
        
        await this.initializeLocalStream(callType);
        this.createPeerConnection();

        // Create offer with proper configuration
        const offerOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === 'video',
        };
        
        const offer = await this.peerConnection.createOffer(offerOptions);
        await this.peerConnection.setLocalDescription(offer);
        console.log('Offer created and local description set');
        console.log('Signaling state after setting local offer:', this.peerConnection.signalingState);

        return offer;
    }

    /**
     * Receive call as receiver
     */
    async receiveCall(offer, callType = 'audio') {
        this.isCaller = false;
        this.callType = callType;
        
        // Ensure local stream is initialized
        if (!this.localStream) {
            await this.initializeLocalStream(callType);
        }
        
        // Ensure peer connection is created
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        // Check current state before setting remote description
        const currentState = this.peerConnection.signalingState;
        console.log('Current signaling state before setting remote offer:', currentState);
        
        // Set remote description (offer from caller)
        // State should be "stable" before setting remote offer
        if (currentState === 'stable') {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Remote description (offer) set successfully');
            console.log('Signaling state after setting remote offer:', this.peerConnection.signalingState);
        } else {
            console.warn('Unexpected state when setting remote offer:', currentState);
            // Try to set anyway
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Remote description (offer) set despite unexpected state');
        }

        // Create answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        console.log('Answer created and local description set');
        console.log('Signaling state after setting local answer:', this.peerConnection.signalingState);

        return answer;
    }

    /**
     * Handle answer from receiver
     */
    async handleAnswer(answer) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        
        // Check current state
        const currentState = this.peerConnection.signalingState;
        console.log('Current signaling state before setting answer:', currentState);
        console.log('Local description exists:', !!this.peerConnection.localDescription);
        console.log('Remote description exists:', !!this.peerConnection.remoteDescription);
        
        // Only set remote description if we're in the correct state
        // We should be in "have-local-offer" state after setting local offer
        if (currentState === 'have-local-offer') {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Remote description (answer) set successfully');
            console.log('Signaling state after setting answer:', this.peerConnection.signalingState);
        } else if (currentState === 'stable') {
            // If stable, the peer connection might have been reset or offer wasn't set properly
            console.warn('Peer connection is in stable state, checking local description...');
            
            // Check if we have a local description (offer)
            if (!this.peerConnection.localDescription) {
                console.error('Local description (offer) not found in stable state');
                throw new Error('Cannot set remote answer: local description (offer) not set. The offer may have been lost.');
            } else {
                // We have a local description but state is stable - this is unusual
                // The state might have been reset. Since we can't re-set the same description,
                // and creating a new offer would invalidate the answer, we'll just try to set
                // the answer anyway. Some browsers might accept it.
                console.warn('State is stable but local description exists. Attempting to set answer directly...');
                
                try {
                    // Try to set the answer - sometimes browsers are lenient with state
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('Remote description (answer) set successfully despite stable state (browser was lenient)');
                } catch (error) {
                    console.error('Failed to set answer in stable state:', error);
                    // If that fails, the only option is to recreate the connection
                    // But we can't do that here because we'd lose the answer
                    // The caller should handle this by recreating the entire call flow
                    throw new Error(`Cannot set remote answer: ${error.message}. Peer connection state is ${currentState}. The connection may need to be recreated.`);
                }
            }
        } else {
            console.error('Cannot set remote answer: invalid signaling state', currentState);
            throw new Error(`Cannot set remote answer: peer connection is in ${currentState} state. Expected 'have-local-offer'.`);
        }
    }

    /**
     * Set audio/video elements
     */
    setAudioElements(localAudio, remoteAudio) {
        this.localAudio = localAudio;
        this.remoteAudio = remoteAudio;
        
        if (this.localStream && this.localAudio) {
            this.localAudio.srcObject = this.localStream;
            this.localAudio.volume = 0; // Mute local audio to prevent echo
        }
        
        if (this.remoteStream && this.remoteAudio) {
            this.remoteAudio.srcObject = this.remoteStream;
            this.remoteAudio.volume = 1.0; // Full volume for remote audio
            // Try to play immediately
            this.remoteAudio.play().catch(err => {
                console.error('Error playing remote audio on set:', err);
            });
        }
    }

    /**
     * Set video elements
     */
    setVideoElements(localVideo, remoteVideo) {
        this.localVideo = localVideo;
        this.remoteVideo = remoteVideo;
        
        if (this.localStream && this.localVideo && this.callType === 'video') {
            this.localVideo.srcObject = this.localStream;
        }
        
        if (this.remoteStream && this.remoteVideo && this.callType === 'video') {
            this.remoteVideo.srcObject = this.remoteStream;
        }
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Toggle video
     */
    toggleVideo() {
        if (this.localStream && this.callType === 'video') {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Check if muted
     */
    isMuted() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            return audioTrack ? !audioTrack.enabled : true;
        }
        return true;
    }

    /**
     * Check if video is off
     */
    isVideoOff() {
        if (this.localStream && this.callType === 'video') {
            const videoTrack = this.localStream.getVideoTracks()[0];
            return videoTrack ? !videoTrack.enabled : true;
        }
        return true;
    }

    /**
     * End call and cleanup
     */
    endCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Clear audio/video elements
        if (this.localAudio) {
            this.localAudio.srcObject = null;
        }
        if (this.remoteAudio) {
            this.remoteAudio.srcObject = null;
        }
        if (this.localVideo) {
            this.localVideo.srcObject = null;
        }
        if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
        }

        if (this.callbacks.onCallEnded) {
            this.callbacks.onCallEnded();
        }
    }

    /**
     * Get local stream
     */
    getLocalStream() {
        return this.localStream;
    }

    /**
     * Get remote stream
     */
    getRemoteStream() {
        return this.remoteStream;
    }

    /**
     * Add ICE candidate from remote peer
     */
    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            console.warn('Peer connection not available, storing candidate for later');
            // Store candidate to add later if peer connection is created
            if (!this.pendingCandidates) {
                this.pendingCandidates = [];
            }
            this.pendingCandidates.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('ICE candidate added successfully');
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
            // Store for retry if peer connection isn't ready
            if (!this.pendingCandidates) {
                this.pendingCandidates = [];
            }
            this.pendingCandidates.push(candidate);
        }
    }

    /**
     * Process any pending ICE candidates
     */
    async processPendingCandidates() {
        if (!this.pendingCandidates || this.pendingCandidates.length === 0) {
            return;
        }

        if (!this.peerConnection) {
            return;
        }

        console.log(`Processing ${this.pendingCandidates.length} pending ICE candidates`);
        const candidates = [...this.pendingCandidates];
        this.pendingCandidates = [];

        for (const candidate of candidates) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('Pending ICE candidate added successfully');
            } catch (error) {
                console.error('Error adding pending ICE candidate:', error);
            }
        }
    }
}

export default WebRTCService;

