import { UserAgent, Inviter, SessionState, Registerer } from 'sip.js';

let userAgent: UserAgent | null = null;
let currentSession: Inviter | null = null;

export const initSipClient = async (sipLogin: string, sipPassword: string): Promise<void> => {
  if (userAgent && userAgent.state !== 'Stopped') {
    try {
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

  // Try multiple servers if one fails (Standard, UK, US relay)
  const relayServers = [
    'wss://webrtc-socket.zadarma.com:443/ws',
    'wss://webrtc.zadarma.com:8089/ws',
    'wss://webrtc.zadarma.com:443/ws'
  ];

  const tryConnect = async (index: number): Promise<void> => {
    if (index >= relayServers.length) throw new Error("All Zadarma relays failed. Please check your ISP firewall.");
    
    console.log(`[SIP] Attempting connection to relay: ${relayServers[index]}`);

    userAgent = new UserAgent({
      uri,
      transportOptions: {
        server: relayServers[index],
        connectionRecoveryInterval: 2,
        traceSip: true,
      },
      authorizationUsername: sipLogin,
      authorizationPassword: sipPassword,
      userAgentString: 'Zadarma-Workstation-v1',
    });

    userAgent.delegate = {
      onConnect: () => console.log(`[SIP] Connected to ${relayServers[index]}`),
      onDisconnect: (error) => console.log(`[SIP] Disconnected from ${relayServers[index]}:`, (error as any)?.code),
    };

    try {
      await userAgent.start();
      console.log(`[SIP] Connected via ${relayServers[index]}`);
      
      const registerer = new Registerer(userAgent);
      await registerer.register();
    } catch (err) {
      // Only log if it's the last attempt or for serious debug
      if (index === relayServers.length - 1) {
        console.error(`[SIP] All relays failed. Connectivity restricted.`);
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
    if (state === SessionState.Terminated) {
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
    if (currentSession.state === SessionState.Initial || currentSession.state === SessionState.Establishing) {
      await currentSession.cancel();
    } else if (currentSession.state === SessionState.Established) {
      await currentSession.bye();
    }
    currentSession = null;
  }
};

export const stopSipClient = async (): Promise<void> => {
  if (userAgent) {
    try {
      await userAgent.stop();
    } catch (e) {}
    userAgent = null;
    console.log('[SIP] Client Force Stopped');
  }
};
