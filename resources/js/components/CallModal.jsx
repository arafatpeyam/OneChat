import { useState, useEffect, useRef } from 'react';
import axios from '@/bootstrap';
import WebRTCService from '@/services/WebRTCService';

export default function CallModal({ call, currentUser, onEndCall, onAcceptCall, onRejectCall }) {
    const [callStatus, setCallStatus] = useState(call?.status || 'ringing');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState(null);

    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const ringAudioRef = useRef(null);
    const webrtcServiceRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const sdpPollingIntervalRef = useRef(null);

    const isCaller = call?.caller?.id === currentUser?.id;
    const otherUser = isCaller ? call?.receiver : call?.caller;
    const isVideoCall = call?.type === 'video';

    // Initialize WebRTC service once
    useEffect(() => {
        if (!call || webrtcServiceRef.current) return;

        webrtcServiceRef.current = new WebRTCService();
        webrtcServiceRef.current.setCallbacks({
            onLocalStream: (stream) => {
                console.log('Local stream available');
            },
            onRemoteStream: (stream) => {
                console.log('Remote stream available');
                setCallStatus('connected');
            },
            onCallEnded: () => {
                handleEndCall();
            },
            onError: (errorMessage) => {
                setError(errorMessage);
            },
            onIceCandidate: async (candidate) => {
                // Send ICE candidate to peer via API
                if (call?.id) {
                    try {
                        await axios.post(`/api/calls/${call.id}/ice-candidate`, {
                            candidate: candidate.toJSON(),
                        });
                        console.log('ICE candidate sent to peer');
                    } catch (error) {
                        console.error('Error sending ICE candidate:', error);
                    }
                }
            },
        });

        webrtcServiceRef.current.setAudioElements(localAudioRef.current, remoteAudioRef.current);
        if (isVideoCall) {
            webrtcServiceRef.current.setVideoElements(localVideoRef.current, remoteVideoRef.current);
        }
        
        // Ensure remote audio volume is set
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
        }
    }, [call?.id, isVideoCall]);

    // Handle call status changes and ring sound
    useEffect(() => {
        if (!call || !webrtcServiceRef.current) return;

        setCallStatus(call.status || 'ringing');

        // Play ring sound when call is ringing
        if (call.status === 'ringing') {
            playRingSound();
        } else {
            stopRingSound();
        }

        // Only auto-start if caller and call is ringing
        // Check if we already have an offer to prevent duplicate calls
        if (call.status === 'ringing' && isCaller) {
            const pc = webrtcServiceRef.current?.peerConnection;
            const hasOffer = pc?.localDescription && pc.localDescription.type === 'offer';
            
            if (!hasOffer) {
                console.log('Starting call, no existing offer found');
                handleStartCall();
            } else {
                console.log('Call already started, offer exists, skipping handleStartCall');
            }
        } else if (call.status === 'connected') {
            // Resume existing call
            handleResumeCall();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [call?.status, call?.id, call?.type, isCaller]);

    // Poll for call status updates
    useEffect(() => {
        if (!call) return;

        if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(() => {
                checkCallStatus();
            }, 1500);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [call?.id]);

    // Start duration timer if connected
    useEffect(() => {
        if (callStatus === 'connected' && call?.answered_at && !durationIntervalRef.current) {
            const startTime = call.answered_at ? new Date(call.answered_at) : new Date();
            durationIntervalRef.current = setInterval(() => {
                const now = new Date();
                const duration = Math.floor((now - startTime) / 1000);
                setCallDuration(duration);
            }, 1000);
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
        };
    }, [callStatus, call?.answered_at]);

    // Monitor remote stream and ensure audio element is connected
    useEffect(() => {
        if (!webrtcServiceRef.current || !remoteAudioRef.current) return;

        const checkRemoteStream = () => {
            const remoteStream = webrtcServiceRef.current?.getRemoteStream();
            if (remoteStream && remoteAudioRef.current) {
                const audioTracks = remoteStream.getAudioTracks();
                if (audioTracks.length > 0 && remoteAudioRef.current.srcObject !== remoteStream) {
                    console.log('Setting remote audio srcObject from monitoring effect');
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.volume = 1.0;
                    remoteAudioRef.current.play().catch(err => {
                        console.error('Error playing remote audio in monitoring:', err);
                    });
                }
            }
        };

        // Check immediately
        checkRemoteStream();

        // Check periodically
        const interval = setInterval(checkRemoteStream, 1000);

        return () => clearInterval(interval);
    }, [call?.id, callStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const playRingSound = () => {
        // Stop any existing ring first
        stopRingSound();
        
        // Generate ring tone using Web Audio API for local system compatibility
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                throw new Error('Web Audio API not supported');
            }
            
            const audioContext = new AudioContext();
            ringAudioRef.current.audioContext = audioContext;
            
            const playRingTone = () => {
                if (!ringAudioRef.current.audioContext) return;
                
                const ctx = ringAudioRef.current.audioContext;
                const oscillator1 = ctx.createOscillator();
                const oscillator2 = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                // Create dual-tone ring (telephone ring sound)
                oscillator1.type = 'sine';
                oscillator1.frequency.value = 440; // A4 note
                
                oscillator2.type = 'sine';
                oscillator2.frequency.value = 480; // Slightly higher for dual-tone
                
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                
                oscillator1.connect(gainNode);
                oscillator2.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                oscillator1.start(ctx.currentTime);
                oscillator2.start(ctx.currentTime);
                oscillator1.stop(ctx.currentTime + 0.4);
                oscillator2.stop(ctx.currentTime + 0.4);
            };
            
            // Play ring tone immediately
            playRingTone();
            
            // Then play every 2 seconds (ring pattern: 0.4s on, 1.6s off)
            ringAudioRef.current.interval = setInterval(() => {
                if (ringAudioRef.current.audioContext) {
                    playRingTone();
                }
            }, 2000);
        } catch (error) {
            console.error('Error generating ring sound:', error);
            // Fallback to audio element if Web Audio API fails
            if (ringAudioRef.current) {
                ringAudioRef.current.loop = true;
                ringAudioRef.current.volume = 0.5;
                ringAudioRef.current.play().catch(err => {
                    console.error('Error playing ring sound:', err);
                });
            }
        }
    };

    const stopRingSound = () => {
        // Stop Web Audio API ring
        if (ringAudioRef.current?.interval) {
            clearInterval(ringAudioRef.current.interval);
            ringAudioRef.current.interval = null;
        }
        if (ringAudioRef.current?.audioContext) {
            try {
                ringAudioRef.current.audioContext.close();
            } catch (e) {
                // Context might already be closed
            }
            ringAudioRef.current.audioContext = null;
        }
        // Stop audio element fallback
        if (ringAudioRef.current) {
            ringAudioRef.current.pause();
            ringAudioRef.current.currentTime = 0;
        }
    };

    const handleStartCall = async () => {
        try {
            const callType = call?.type || 'audio';
            
            // Ensure we have a fresh peer connection
            if (!webrtcServiceRef.current) {
                console.error('WebRTC service not initialized');
                return;
            }
            
            const offer = await webrtcServiceRef.current.startCallAsCaller(callType);
            
            // Verify offer was created and local description is set
            const pc = webrtcServiceRef.current.peerConnection;
            if (!pc || !pc.localDescription) {
                console.error('Failed to create offer or set local description');
                throw new Error('Failed to create WebRTC offer');
            }
            
            console.log('Offer created successfully, signaling state:', pc.signalingState);
            console.log('Local description type:', pc.localDescription.type);
            
            // Store offer SDP in database
            try {
                await axios.post(`/api/calls/${call.id}/offer`, {
                    offer: JSON.stringify(offer),
                });
                console.log('Offer stored in database');
            } catch (error) {
                console.error('Error storing offer:', error);
            }

            // Start polling for answer and ICE candidates
            if (!sdpPollingIntervalRef.current) {
                let answerProcessed = false; // Flag to prevent processing answer multiple times
                let processedCandidateIds = new Set(); // Track processed ICE candidates
                
                sdpPollingIntervalRef.current = setInterval(async () => {
                    // Don't poll if call is null (modal closing)
                    if (!call || !webrtcServiceRef.current) {
                        if (sdpPollingIntervalRef.current) {
                            clearInterval(sdpPollingIntervalRef.current);
                            sdpPollingIntervalRef.current = null;
                        }
                        return;
                    }
                    
                    try {
                        const response = await axios.get('/api/calls/active', {
                            timeout: 3000, // 3 second timeout to prevent hanging
                        });
                        if (response.data.success && response.data.call) {
                            // Poll for ICE candidates
                            try {
                                const iceResponse = await axios.get(`/api/calls/${call.id}/ice-candidates`, {
                                    timeout: 2000, // 2 second timeout
                                });
                                if (iceResponse.data.success && iceResponse.data.candidates) {
                                    for (const item of iceResponse.data.candidates) {
                                        const candidateId = `${item.candidate.candidate}-${item.candidate.sdpMLineIndex}`;
                                        if (!processedCandidateIds.has(candidateId)) {
                                            await webrtcServiceRef.current.addIceCandidate(item.candidate);
                                            processedCandidateIds.add(candidateId);
                                            console.log('ICE candidate added from peer');
                                        }
                                    }
                                }
                            } catch (iceError) {
                                // Ignore ICE candidate errors, continue polling
                                if (iceError.code !== 'ECONNABORTED') {
                                    console.log('No ICE candidates yet or error:', iceError);
                                }
                            }
                        }
                        
                        if (response.data.success && response.data.call && response.data.call.answer_sdp && !answerProcessed) {
                            const answerData = JSON.parse(response.data.call.answer_sdp);
                            console.log('Received answer, setting remote description...', answerData);
                            
                            // Check peer connection state before processing
                            const pc = webrtcServiceRef.current?.peerConnection;
                            if (!pc) {
                                console.error('Peer connection not available');
                                return;
                            }
                            
                            console.log('Peer connection signaling state:', pc.signalingState);
                            console.log('Local description:', pc.localDescription);
                            console.log('Remote description:', pc.remoteDescription);
                            
                            // Only process if we have a local description (offer) and are in correct state
                            if (!pc.localDescription) {
                                console.warn('Local description not set yet, waiting...');
                                return;
                            }
                            
                            // Check if we're in the correct state to receive answer
                            if (pc.signalingState !== 'have-local-offer') {
                                console.warn(`Not in correct state to receive answer. Current state: ${pc.signalingState}, expected: have-local-offer`);
                                console.log('Local description:', pc.localDescription);
                                console.log('Remote description:', pc.remoteDescription);
                                
                                // If state is stable but we have local description, something went wrong
                                // Try to restore the offer from database
                                if (pc.signalingState === 'stable') {
                                    if (pc.localDescription) {
                                        // We have local description but state is wrong - this shouldn't happen
                                        // But we'll try to proceed anyway
                                        console.warn('State is stable but local description exists, attempting to set answer anyway');
                                    } else {
                                        // Local description lost - restore from database
                                        console.log('Local description lost, restoring from database...');
                                        try {
                                            const activeCallResponse = await axios.get('/api/calls/active');
                                            if (activeCallResponse.data.success && activeCallResponse.data.call?.offer_sdp) {
                                                const storedOffer = JSON.parse(activeCallResponse.data.call.offer_sdp);
                                                await pc.setLocalDescription(storedOffer);
                                                console.log('Offer restored from database, new state:', pc.signalingState);
                                            } else {
                                                console.error('No offer found in database');
                                                return; // Wait for next poll
                                            }
                                        } catch (err) {
                                            console.error('Failed to restore offer from database:', err);
                                            return; // Wait for next poll
                                        }
                                    }
                                } else {
                                    console.warn(`Unexpected state: ${pc.signalingState}, waiting...`);
                                    return; // Wait for next poll
                                }
                            }
                            
                            try {
                                await webrtcServiceRef.current.handleAnswer(answerData);
                                console.log('Answer processed, connection should be establishing...');
                                
                                // Process any pending ICE candidates
                                await webrtcServiceRef.current.processPendingCandidates();
                                
                                answerProcessed = true;
                                
                                // Verify remote audio element is set up
                                if (remoteAudioRef.current && webrtcServiceRef.current.remoteStream) {
                                    remoteAudioRef.current.srcObject = webrtcServiceRef.current.remoteStream;
                                    remoteAudioRef.current.volume = 1.0;
                                    remoteAudioRef.current.play().catch(err => {
                                        console.error('Error playing remote audio after answer:', err);
                                    });
                                }
                                
                                stopRingSound(); // Stop ring when answered
                                // Continue polling for ICE candidates - don't stop the interval
                            } catch (error) {
                                console.error('Error handling answer:', error);
                                // If error is about state, wait a bit and try again
                                if (error.message.includes('state') || error.message.includes('State')) {
                                    console.log('State error, will retry on next poll');
                                    // Don't mark as processed, allow retry
                                } else {
                                    answerProcessed = true; // Mark as processed to prevent infinite retries
                                }
                            }
                        }
                    } catch (error) {
                        // Don't spam console with timeout errors
                        if (error.code !== 'ECONNABORTED') {
                            console.error('Error polling for answer:', error);
                        }
                    }
                }, 1000); // Poll every 1 second (reduced from 500ms to prevent overload)
            }
        } catch (error) {
            console.error('Error starting call:', error);
            stopRingSound();
            const errorMessage = isVideoCall
                ? 'Failed to start call. Please check camera/microphone permissions.'
                : 'Failed to start call. Please check microphone permissions.';
            setError(errorMessage);
        }
    };

    const handleAcceptCall = async () => {
        try {
            stopRingSound(); // Stop ring when accepting
            const response = await axios.post(`/api/calls/${call.id}/accept`);
            if (response.data.success) {
                setCallStatus('connected');
                setError(null);
                
                // Initialize media for receiver
                if (webrtcServiceRef.current) {
                    try {
                        const callType = call?.type || 'audio';
                        
                        // First initialize local stream
                        await webrtcServiceRef.current.initializeLocalStream(callType);
                        
                        // Poll for offer SDP and create answer, also poll for ICE candidates
                        let offerProcessed = false;
                        let processedCandidateIds = new Set();
                        
                        const pollForOffer = async () => {
                            // Don't poll if call is null (modal closing)
                            if (!call || !webrtcServiceRef.current) {
                                return;
                            }
                            
                            try {
                                const activeResponse = await axios.get('/api/calls/active', {
                                    timeout: 3000, // 3 second timeout
                                });
                                if (activeResponse.data.success && activeResponse.data.call) {
                                    // Poll for ICE candidates
                                    try {
                                        const iceResponse = await axios.get(`/api/calls/${call.id}/ice-candidates`, {
                                            timeout: 2000, // 2 second timeout
                                        });
                                        if (iceResponse.data.success && iceResponse.data.candidates) {
                                            for (const item of iceResponse.data.candidates) {
                                                const candidateId = `${item.candidate.candidate}-${item.candidate.sdpMLineIndex}`;
                                                if (!processedCandidateIds.has(candidateId)) {
                                                    await webrtcServiceRef.current.addIceCandidate(item.candidate);
                                                    processedCandidateIds.add(candidateId);
                                                    console.log('ICE candidate added from peer');
                                                }
                                            }
                                        }
                                    } catch (iceError) {
                                        // Ignore ICE candidate errors, continue polling
                                        if (iceError.code !== 'ECONNABORTED') {
                                            console.log('No ICE candidates yet or error:', iceError);
                                        }
                                    }
                                    
                                    // Process offer if not already processed
                                    if (activeResponse.data.call.offer_sdp && !offerProcessed) {
                                        const offerData = JSON.parse(activeResponse.data.call.offer_sdp);
                                        console.log('Received offer, creating answer...', offerData);
                                        
                                        // Receive call and create answer (this will create peer connection if needed)
                                        const answer = await webrtcServiceRef.current.receiveCall(offerData, callType);
                                        console.log('Answer created:', answer);
                                        
                                        // Store answer SDP in database
                                        await axios.post(`/api/calls/${call.id}/answer`, {
                                            answer: JSON.stringify(answer),
                                        });
                                        console.log('Answer stored in database');
                                        
                                        // Process any pending ICE candidates
                                        await webrtcServiceRef.current.processPendingCandidates();
                                        
                                        // Verify remote audio element is set up
                                        if (remoteAudioRef.current && webrtcServiceRef.current.remoteStream) {
                                            remoteAudioRef.current.srcObject = webrtcServiceRef.current.remoteStream;
                                            remoteAudioRef.current.volume = 1.0;
                                            remoteAudioRef.current.play().catch(err => {
                                                console.error('Error playing remote audio after answer:', err);
                                            });
                                        }
                                        
                                        offerProcessed = true;
                                        // Don't stop polling - continue polling for ICE candidates
                                    }
                                }
                            } catch (error) {
                                console.error('Error polling for offer:', error);
                            }
                        };
                        
                        // Start polling for offer
                        if (!sdpPollingIntervalRef.current) {
                            sdpPollingIntervalRef.current = setInterval(pollForOffer, 1000); // Poll every 1 second (reduced from 500ms to prevent overload)
                            // Also try immediately
                            pollForOffer();
                        }
                    } catch (error) {
                        console.error('Error initializing media:', error);
                        const errorMessage = isVideoCall
                            ? 'Failed to access camera/microphone. Please check permissions.'
                            : 'Failed to access microphone. Please check permissions.';
                        setError(errorMessage);
                    }
                }
                
                const startTime = new Date();
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                }
                durationIntervalRef.current = setInterval(() => {
                    const now = new Date();
                    const duration = Math.floor((now - startTime) / 1000);
                    setCallDuration(duration);
                }, 1000);
            }
        } catch (error) {
            console.error('Error accepting call:', error);
            const errorMessage = error.response?.data?.error || 'Failed to accept call.';
            setError(errorMessage);
        }
    };

    const handleResumeCall = async () => {
        try {
            const callType = call?.type || 'audio';
            await webrtcServiceRef.current.initializeLocalStream(callType);
            webrtcServiceRef.current.createPeerConnection();
            const startTime = call.answered_at ? new Date(call.answered_at) : new Date();
            durationIntervalRef.current = setInterval(() => {
                const now = new Date();
                const duration = Math.floor((now - startTime) / 1000);
                setCallDuration(duration);
            }, 1000);
        } catch (error) {
            console.error('Error resuming call:', error);
        }
    };

    const handleEndCall = async () => {
        try {
            stopRingSound(); // Stop ring when ending call
            if (call?.id) {
                await axios.post(`/api/calls/${call.id}/end`);
            }
        } catch (error) {
            console.error('Error ending call:', error);
        } finally {
            cleanup();
            if (onEndCall) {
                onEndCall();
            }
        }
    };

    const handleRejectCall = async () => {
        try {
            stopRingSound(); // Stop ring when rejecting call
            if (call?.id) {
                await axios.post(`/api/calls/${call.id}/end`);
            }
        } catch (error) {
            console.error('Error rejecting call:', error);
        } finally {
            cleanup();
            if (onRejectCall) {
                onRejectCall();
            }
        }
    };

    const toggleMute = () => {
        if (webrtcServiceRef.current) {
            const muted = webrtcServiceRef.current.toggleMute();
            setIsMuted(!muted);
        }
    };

    const toggleVideo = () => {
        if (webrtcServiceRef.current && isVideoCall) {
            const videoOff = webrtcServiceRef.current.toggleVideo();
            setIsVideoOff(!videoOff);
        }
    };

    const checkCallStatus = async () => {
        try {
            const response = await axios.get('/api/calls/active');
            if (response.data.success && response.data.call) {
                const newStatus = response.data.call.status;
                setCallStatus(newStatus);
                
                // If status changed to connected, start duration timer
                if (newStatus === 'connected' && !durationIntervalRef.current) {
                    const startTime = response.data.call.answered_at 
                        ? new Date(response.data.call.answered_at) 
                        : new Date();
                    durationIntervalRef.current = setInterval(() => {
                        const now = new Date();
                        const duration = Math.floor((now - startTime) / 1000);
                        setCallDuration(duration);
                    }, 1000);
                }
                
                // If status changed from connected/ringing to ended/rejected, end call
                if (newStatus === 'ended' || newStatus === 'rejected' || newStatus === 'missed') {
                    handleEndCall();
                }
            } else {
                // No active call - might have ended
                if (callStatus === 'ringing' || callStatus === 'connected') {
                    handleEndCall();
                }
            }
        } catch (error) {
            console.error('Error checking call status:', error);
        }
    };

    const cleanup = () => {
        stopRingSound(); // Stop ring sound on cleanup
        if (webrtcServiceRef.current) {
            webrtcServiceRef.current.endCall();
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        if (sdpPollingIntervalRef.current) {
            clearInterval(sdpPollingIntervalRef.current);
            sdpPollingIntervalRef.current = null;
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!call) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            {/* Hidden audio elements */}
            <audio ref={localAudioRef} autoPlay muted playsInline />
            <audio ref={remoteAudioRef} autoPlay playsInline volume={1.0} />
            {/* Ring sound - using data URI for local system compatibility */}
            <audio ref={ringAudioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98N+dThEMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606eyoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDfnU4RDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC" type="audio/wav" />
            </audio>

            {isVideoCall ? (
                // Video Call UI - Full Screen
                <div className="relative w-full h-full flex flex-col">
                    {/* Remote Video - Full Screen */}
                    <div className="flex-1 relative bg-black">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {!remoteVideoRef.current?.srcObject && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
                                <div className="text-center">
                                    <div className="mb-6">
                                        {otherUser?.image ? (
                                            <img
                                                src={otherUser.image.startsWith('http') ? otherUser.image : `/storage/${otherUser.image}`}
                                                alt={otherUser.name}
                                                className="w-32 h-32 rounded-full mx-auto border-4 border-white/30 shadow-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full mx-auto border-4 border-white/30 shadow-xl bg-white/20 flex items-center justify-center">
                                                <span className="text-4xl font-bold text-white">
                                                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{otherUser?.name || 'User'}</h3>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Local Video - Picture in Picture */}
                    <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-4 border-white/30 shadow-2xl bg-black">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {!localVideoRef.current?.srcObject && (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-xl font-bold text-white">
                                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Call Info Overlay */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
                        <p className="text-white font-semibold">
                            {callStatus === 'connected' && formatDuration(callDuration)}
                            {callStatus === 'ringing' && (isCaller ? 'Calling...' : 'Incoming call')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Call Controls - Bottom */}
                    {callStatus === 'connected' && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={toggleMute}
                                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors shadow-lg hover:shadow-xl ${
                                        isMuted
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                                    }`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isMuted ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        )}
                                    </svg>
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors shadow-lg hover:shadow-xl ${
                                        isVideoOff
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                                    }`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isVideoOff ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        )}
                                    </svg>
                                </button>
                                <button
                                    onClick={handleEndCall}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Incoming Call Controls */}
                    {callStatus === 'ringing' && !isCaller && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleRejectCall}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleAcceptCall}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Caller Controls - Show end button when calling */}
                    {callStatus === 'ringing' && isCaller && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleEndCall}
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Audio Call UI - Compact Modal
                <div className="relative w-full max-w-md mx-4">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* User Info */}
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center">
                            <div className="mb-6">
                                {otherUser?.image ? (
                                    <img
                                        src={otherUser.image.startsWith('http') ? otherUser.image : `/storage/${otherUser.image}`}
                                        alt={otherUser.name}
                                        className="w-32 h-32 rounded-full mx-auto border-4 border-white/30 shadow-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full mx-auto border-4 border-white/30 shadow-xl bg-white/20 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{otherUser?.name || 'User'}</h3>
                            <p className="text-white/80">
                                {callStatus === 'ringing' && isCaller && 'Calling...'}
                                {callStatus === 'ringing' && !isCaller && 'Incoming call'}
                                {callStatus === 'connected' && formatDuration(callDuration)}
                            </p>
                        </div>

                    {/* Error Message */}
                    {error && (
                        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Call Controls */}
                    <div className="p-6">
                        {callStatus === 'ringing' && !isCaller && (
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleRejectCall}
                                    className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleAcceptCall}
                                    className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {(callStatus === 'ringing' && isCaller) || callStatus === 'connected' ? (
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={toggleMute}
                                    className={`flex items-center justify-center w-16 h-16 rounded-full transition-colors shadow-lg hover:shadow-xl ${
                                        isMuted
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isMuted ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        )}
                                    </svg>
                                </button>
                                <button
                                    onClick={handleEndCall}
                                    className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

