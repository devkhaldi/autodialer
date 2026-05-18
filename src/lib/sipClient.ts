import { UserAgent, Inviter, SessionState } from 'sip.js';

let userAgent: UserAgent | null = null;
let currentSession: Inviter | null = null;

export const initSipClient = async (sipLogin: string, sipPassword: string): Promise<void> => {
  if (userAgent) {
    await userAgent.stop();
  }

  const server = 'sip.zadarma.com';
  const uri = UserAgent.makeURI(`sip:${sipLogin}@${server}`);
  if (!uri) throw new Error("Invalid SIP URI");

  userAgent = new UserAgent({
    uri,
    transportOptions: {
      server: 'wss://webrtc.zadarma.com:8089/ws',
    },
    authorizationUsername: sipLogin,
    authorizationPassword: sipPassword,
    sessionDescriptionHandlerFactoryOptions: {
      peerConnectionOptions: {
        rtcConfiguration: {
          iceServers: [{ urls: 'stun:stun.zadarma.com:3478' }]
        }
      }
    }
  });

  return new Promise((resolve, reject) => {
    userAgent?.start()
      .then(() => resolve())
      .catch((err) => reject(err));
  });
};

export const startCall = async (phoneNumber: string, onDisconnect: () => void): Promise<void> => {
  if (!userAgent) throw new Error("SIP Client not initialized");
  
  // Format phone number, strip non-digits
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const target = UserAgent.makeURI(`sip:${cleanNumber}@sip.zadarma.com`);
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
