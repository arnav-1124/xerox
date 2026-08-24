import JSZip from 'jszip';
import { PasswordEntry, Category } from '../types';

export function mergeVaultData(
  localPasswords: PasswordEntry[],
  localCategories: Category[],
  incomingPasswords: PasswordEntry[],
  incomingCategories: Category[]
) {
  const mergedPasswords = [...localPasswords];
  const mergedCategories = [...localCategories];

  let addedPass = 0;
  let updatedPass = 0;
  let addedCat = 0;
  let updatedCat = 0;

  // Merge Categories
  incomingCategories.forEach((incCat) => {
    const existingIndex = mergedCategories.findIndex(
      (c) => c.id === incCat.id || c.name.toLowerCase() === incCat.name.toLowerCase()
    );
    if (existingIndex >= 0) {
      const existing = mergedCategories[existingIndex];
      mergedCategories[existingIndex] = {
        ...existing,
        ...incCat,
      };
      updatedCat++;
    } else {
      mergedCategories.push(incCat);
      addedCat++;
    }
  });

  // Merge Passwords
  incomingPasswords.forEach((incPass) => {
    const existingIndex = mergedPasswords.findIndex((p) => p.id === incPass.id);
    if (existingIndex >= 0) {
      const localPass = mergedPasswords[existingIndex];
      const localTime = localPass.updatedAt || localPass.createdAt || 0;
      const incomingTime = incPass.updatedAt || incPass.createdAt || 0;

      if (incomingTime > localTime) {
        mergedPasswords[existingIndex] = incPass;
        updatedPass++;
      }
    } else {
      mergedPasswords.push(incPass);
      addedPass++;
    }
  });

  return {
    passwords: mergedPasswords,
    categories: mergedCategories,
    summary: { addedPass, updatedPass, addedCat, updatedCat },
  };
}

export async function compressData(data: any): Promise<string> {
  const jsonStr = JSON.stringify(data);
  const zip = new JSZip();
  zip.file('vault_sync.json', jsonStr);
  const content = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
  return content;
}

export async function decompressData(base64Data: string): Promise<any> {
  const zip = await JSZip.loadAsync(base64Data, { base64: true });
  const file = zip.file('vault_sync.json');
  if (!file) throw new Error('Sync file not found in payload');
  const jsonStr = await file.async('string');
  return JSON.parse(jsonStr);
}

// Public STUN servers for NAT Traversal
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class PeerSyncConnection {
  public pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private socket: WebSocket | null = null;

  public onStatusChange?: (status: string) => void;
  public onDataReceived?: (data: any) => void;
  public onError?: (error: string) => void;

  constructor() {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.setupConnectionListeners();
  }

  private setupConnectionListeners() {
    this.pc.onconnectionstatechange = () => {
      this.notifyStatus(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      if (this.pc.iceConnectionState === 'failed') {
        this.notifyError('ICE connection negotiation failed.');
      }
    };
  }

  private notifyStatus(status: string) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  private notifyError(err: string) {
    if (this.onError) {
      this.onError(err);
    }
  }

  // --- MANUAL SIGNALING FLOW (Vanilla ICE) ---

  public async createOffer(): Promise<string> {
    // Create Data Channel
    this.dataChannel = this.pc.createDataChannel('sync-channel', {
      ordered: true,
    });
    this.setupDataChannel(this.dataChannel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete so all candidates are included in the SDP
    await this.waitForIceGathering();

    if (!this.pc.localDescription) {
      throw new Error('Local description is null after gathering.');
    }

    return btoa(JSON.stringify(this.pc.localDescription));
  }

  public async acceptOfferAndCreateAnswer(base64Offer: string): Promise<string> {
    try {
      const offerDesc = JSON.parse(atob(base64Offer));
      await this.pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

      // Handle receiving data channel
      this.pc.ondatachannel = (e) => {
        this.dataChannel = e.channel;
        this.setupDataChannel(this.dataChannel);
      };

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Wait for ICE gathering to complete
      await this.waitForIceGathering();

      if (!this.pc.localDescription) {
        throw new Error('Local description is null after gathering answer.');
      }

      return btoa(JSON.stringify(this.pc.localDescription));
    } catch (e: any) {
      this.notifyError(`Failed to process offer: ${e.message}`);
      throw e;
    }
  }

  public async acceptAnswer(base64Answer: string): Promise<void> {
    try {
      const answerDesc = JSON.parse(atob(base64Answer));
      await this.pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
    } catch (e: any) {
      this.notifyError(`Failed to process answer: ${e.message}`);
      throw e;
    }
  }

  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const stateChange = () => {
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', stateChange);
          resolve();
        }
      };

      this.pc.addEventListener('icegatheringstatechange', stateChange);

      // Timeout fallback (5 seconds)
      setTimeout(() => {
        this.pc.removeEventListener('icegatheringstatechange', stateChange);
        resolve();
      }, 5000);
    });
  }

  // --- AUTOMATIC SIGNALING FLOW (WebSocket Broker) ---

  public connectBroker(roomPin: string, isHost: boolean) {
    this.notifyStatus('connecting-broker');

    // Free public WebSocket room-based signaling server (shares messages in same path)
    const brokerUrl = `wss://spock.peer.net/room/xerox-${roomPin}`;
    
    try {
      this.socket = new WebSocket(brokerUrl);
    } catch (err: any) {
      this.notifyError(`WebSocket init failed: ${err.message}`);
      return;
    }

    this.socket.onopen = async () => {
      this.notifyStatus('joined-room');

      if (isHost) {
        // Setup data channel
        this.dataChannel = this.pc.createDataChannel('sync-channel', { ordered: true });
        this.setupDataChannel(this.dataChannel);

        // Gather ICE candidates and send full offer once completed
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        await this.waitForIceGathering();

        this.sendBrokerMessage({
          type: 'offer',
          sdp: this.pc.localDescription,
        });
      }
    };

    this.socket.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.sender === this.getSocketId()) return; // Ignore self messages if echoed

        if (msg.type === 'offer' && !isHost) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          
          this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel(this.dataChannel);
          };

          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          await this.waitForIceGathering();

          this.sendBrokerMessage({
            type: 'answer',
            sdp: this.pc.localDescription,
          });
        } else if (msg.type === 'answer' && isHost) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        }
      } catch (err: any) {
        console.error('Error handling broker message:', err);
      }
    };

    this.socket.onerror = (e) => {
      this.notifyError('Signaling server connection error.');
    };

    this.socket.onclose = () => {
      if (this.pc.connectionState !== 'connected') {
        this.notifyStatus('broker-disconnected');
      }
    };
  }

  private sendBrokerMessage(msg: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Add a client sender ID to ignore own echoed messages if the broker broadcasts to all
      msg.sender = this.getSocketId();
      this.socket.send(JSON.stringify(msg));
    }
  }

  private socketId: string | null = null;
  private getSocketId(): string {
    if (!this.socketId) {
      this.socketId = Math.random().toString(36).substring(2);
    }
    return this.socketId;
  }

  // --- DATA SEND / RECEIVE METHODS ---

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.notifyStatus('connected');
    };

    channel.onmessage = async (e) => {
      try {
        this.notifyStatus('syncing');
        const decompressed = await decompressData(e.data);
        if (this.onDataReceived) {
          this.onDataReceived(decompressed);
        }
        this.notifyStatus('finished');
      } catch (err: any) {
        this.notifyError(`Failed to process incoming payload: ${err.message}`);
      }
    };

    channel.onclose = () => {
      this.notifyStatus('disconnected');
    };

    channel.onerror = (err) => {
      this.notifyError(`Data channel error: ${err}`);
    };
  }

  public async sendPayload(data: any): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    try {
      this.notifyStatus('syncing');
      const compressed = await compressData(data);
      this.dataChannel.send(compressed);
      this.notifyStatus('finished');
    } catch (e: any) {
      this.notifyError(`Send failed: ${e.message}`);
      throw e;
    }
  }

  public disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.socket) {
      this.socket.close();
    }
    this.pc.close();
  }
}
