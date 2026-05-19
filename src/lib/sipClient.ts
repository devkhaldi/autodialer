import { UserAgent, Inviter, SessionState, Registerer, RegistererState } from 'sip.js';

let userAgent: UserAgent | null = null;
let currentSession: Inviter | null = null;
let registerer: Registerer | null = null;
let remoteAudio: HTMLAudioElement | null = null;

// Ensure we have an audio element for remote media
function getAudioElement(): HTMLAudioElement {
  if (!remoteAudio) {
    remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    // Some browsers require the element in the DOM
    remoteAudio.style.display = 'none';
    if (typeof document !== 'undefined') {
      document.body.appendChild(remoteAudio);
    }
  }
  return remoteAudio;
}

export const initSipClient = async (sipLogin: string, sipPassword: string): Promise<void> => {
  if (userAgent && userAgent.state !== 'Stopped') {
    try {
      if (registerer) {
        await registerer.unregister().catch(() => {});
        registerer = null;
      }
      await userAgent.stop();
    } catch (e) {
      console.warn('[SIP] Force stop failed:', e);
    }
  }

  // Detect server: PBX extensions (e.g. 123456-100) use pbx.zadarma.com
  const server = sipLogin.includes('-') ? 'pbx.zadarma.com' : 'sip.zadarma.com';
  const uri = UserAgent.makeURI(`sip:${sipLogin}@${server}`);
  if (!uri) throw new Error("Invalid SIP URI");

  console.log(`[SIP] Initializing with login: ${sipLogin} to ${server}`);

  // Try multiple WebSocket endpoints (some ISPs block certain ports)
  const relayServers = [
    'wss://webrtc-socket.zadarma.com:443/ws',
    'wss://webrtc.zadarma.com:8089/ws',
    'wss://webrtc.zadarma.com:443/ws'
  ];

  const tryConnect = async (index: number): Promise<void> => {
    if (index >= relayServers.length) {
      console.warn("[SIP] All Zadarma relays failed. Use Callback Mode.");
      return Promise.reject("All relays failed");
    }

    console.log(`[SIP] Attempting connection to relay: ${relayServers[index]}`);

    userAgent = new UserAgent({
      uri,
      transportOptions: {
        server: relayServers[index],
        connectionRecoveryInterval: 2,
        traceSip: false, // Disable noisy trace in production
      },
      authorizationUsername: sipLogin,
      authorizationPassword: sipPassword,
      userAgentString: 'Zadarma-Workstation-v2',
    });

    userAgent.delegate = {
      onConnect: () => console.log(`[SIP] Transport connected to ${relayServers[index]}`),
      onDisconnect: (error) => {
        const code = (error as any)?.code;
        console.warn(`[SIP] Disconnected from ${relayServers[index]}: code=${code}`);
      },
    };

    try {
      await userAgent.start();
      console.log(`[SIP] UserAgent started via ${relayServers[index]}`);

      // Register with the SIP server
      registerer = new Registerer(userAgent);

      // Listen for registration state changes to detect auth failures
      registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Registered:
            console.log('[SIP] ✓ Registered successfully');
            break;
          case RegistererState.Unregistered:
            console.log('[SIP] Unregistered');
            break;
          case RegistererState.Terminated:
            console.warn('[SIP] Registration terminated (possible auth failure)');
            break;
        }
      });

      await registerer.register();
      console.log(`[SIP] Registration request sent`);
    } catch (err) {
      console.warn(`[SIP] Relay ${index + 1}/${relayServers.length} failed:`, (err as Error).message);
      
      // Exponential backoff between retries
      if (index < relayServers.length - 1) {
        const delay = Math.min(1000 * Math.pow(2, index), 4000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return tryConnect(index + 1);
    }
  };

  return tryConnect(0);
};

export const startCall = async (phoneNumber: string, onDisconnect: () => void): Promise<void> => {
  if (!userAgent) throw new Error("SIP Client not initialized");
  
  // Format phone number, strip non-digits
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const server = userAgent?.configuration.uri.host || 'sip.zadarma.com';
  const target = UserAgent.makeURI(`sip:${cleanNumber}@${server}`);
  if (!target) throw new Error("Invalid phone number");

  currentSession = new Inviter(userAgent, target);

  currentSession.stateChange.addListener((state: SessionState) => {
    console.log(`[SIP] Call state: ${state}`);
    
    if (state === SessionState.Established) {
      // Attach remote audio stream
      const sessionDescriptionHandler = currentSession?.sessionDescriptionHandler;
      if (sessionDescriptionHandler) {
        const peerConnection = (sessionDescriptionHandler as any).peerConnection as RTCPeerConnection | undefined;
        if (peerConnection) {
          const remoteStream = new MediaStream();
          peerConnection.getReceivers().forEach((receiver) => {
            if (receiver.track) {
              remoteStream.addTrack(receiver.track);
            }
          });
          const audio = getAudioElement();
          audio.srcObject = remoteStream;
          audio.play().catch(e => console.warn('[SIP] Audio play failed:', e));
        }
      }
    }
    
    if (state === SessionState.Terminated) {
      // Clean up audio
      if (remoteAudio) {
        remoteAudio.srcObject = null;
      }
      onDisconnect();
      currentSession = null;
    }
  });

  await currentSession.invite({
    sessionDescriptionHandlerOptions: {
      constraints: { audio: true, video: false }
    }
  });
};

export const hangupCall = async (): Promise<void> => {
  if (currentSession) {
    try {
      if (currentSession.state === SessionState.Initial || currentSession.state === SessionState.Establishing) {
        await currentSession.cancel();
      } else if (currentSession.state === SessionState.Established) {
        await currentSession.bye();
      }
    } catch (e) {
      console.warn('[SIP] Hangup error (non-fatal):', e);
    }
    currentSession = null;
  }
  // Clean up audio
  if (remoteAudio) {
    remoteAudio.srcObject = null;
  }
};

export const stopSipClient = async (): Promise<void> => {
  if (registerer) {
    try {
      await registerer.unregister();
    } catch (e) { /* ignore */ }
    registerer = null;
  }
  if (userAgent) {
    try {
      await userAgent.stop();
    } catch (e) { /* ignore */ }
    userAgent = null;
    console.log('[SIP] Client stopped');
  }
  // Clean up audio element
  if (remoteAudio) {
    remoteAudio.srcObject = null;
    remoteAudio.remove();
    remoteAudio = null;
  }
};
