/**
 * Server-Sent Events (SSE) Real-Time Streaming Broker
 * Delivers real-time market updates, event publications, and heartbeats
 * with connection monitoring, automatic retry intervals, and stale-data detection.
 */

import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  connectedAt: Date;
  userId?: string;
}

export class SSEBroker {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageCounter = 0;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', {
        timestamp: new Date().toISOString(),
        active_clients: this.clients.size,
        status: 'LIVE',
      });
    }, 15000);
  }

  public registerClient(id: string, res: Response, userId?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx proxy buffering
    res.flushHeaders?.();

    // Send initial handshake with retry hint (3000ms)
    res.write(`retry: 3000\n`);
    res.write(`id: ${++this.messageCounter}\n`);
    res.write(`event: handshake\n`);
    res.write(`data: ${JSON.stringify({ status: 'CONNECTED', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, { id, res, connectedAt: new Date(), userId });

    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  public broadcast(eventType: string, data: any): void {
    const payload = `id: ${++this.messageCounter}\nevent: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(payload);
      } catch (err) {
        this.clients.delete(id);
      }
    }
  }

  public sendToUser(userId: string, eventType: string, data: any): void {
    const payload = `id: ${++this.messageCounter}\nevent: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      if (client.userId === userId) {
        try {
          client.res.write(payload);
        } catch (err) {
          this.clients.delete(id);
        }
      }
    }
  }

  public getActiveCount(): number {
    return this.clients.size;
  }
}

export const sseBroker = new SSEBroker();
