/**
 * PeerJS Compatible Server - Vercel Serverless Function
 * 
 * This provides a simple WebRTC signaling server for mobile controller connections
 * Compatible with PeerJS client library
 * Deployed to: https://your-domain.com/api/peerjs/
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const peers = new Map();

// Enable CORS for your game domain
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:9000',
        'https://achtungkurve.com',
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean),
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        peers: peers.size
    });
});

// Generate peer ID
app.get('/id', (req, res) => {
    const key = req.query.key || 'peerjs';
    const token = req.query.token;
    const id = crypto.randomUUID();
    
    console.log(`[PeerJS] Generated peer ID: ${id}`);
    
    // Store peer info
    peers.set(id, {
        id,
        key,
        token,
        connectedAt: new Date(),
        connections: []
    });
    
    res.json(id);
});

// Peer connection signaling (messages between peers)
app.post('/offer', (req, res) => {
    const { to, from, offer } = req.body;
    
    console.log(`[PeerJS] Offer from ${from} to ${to}`);
    
    // In a real implementation, we'd queue this and send it to the receiving peer
    // For now, just acknowledge
    res.json({ ok: true });
});

app.post('/answer', (req, res) => {
    const { to, from, answer } = req.body;
    
    console.log(`[PeerJS] Answer from ${from} to ${to}`);
    
    res.json({ ok: true });
});

app.post('/candidate', (req, res) => {
    const { to, from, candidate } = req.body;
    
    console.log(`[PeerJS] ICE candidate from ${from} to ${to}`);
    
    res.json({ ok: true });
});

// Peer disconnect
app.post('/disconnect', (req, res) => {
    const { id } = req.body;
    
    if (peers.has(id)) {
        peers.delete(id);
        console.log(`[PeerJS] Peer disconnected: ${id}`);
    }
    
    res.json({ ok: true });
});

// List peers (for discovery)
app.get('/peers', (req, res) => {
    const key = req.query.key || 'peerjs';
    const peerList = Array.from(peers.values())
        .filter(p => p.key === key)
        .map(p => p.id);
    
    res.json(peerList);
});

// WebSocket endpoint for messaging (simulated via polling or kept-alive)
app.get('/messages', (req, res) => {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial message that client is connected
    res.write(JSON.stringify({ status: 'connected' }) + '\n');
    
    // Keep connection alive
    const interval = setInterval(() => {
        res.write(JSON.stringify({ ping: true }) + '\n');
    }, 30000); // Send ping every 30 seconds
    
    req.on('close', () => {
        clearInterval(interval);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('[PeerJS Server Error]', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Default response for root
app.get('/', (req, res) => {
    res.json({ 
        message: 'Kurve PeerJS Compatible Server',
        status: 'running',
        peersConnected: peers.size,
        endpoints: {
            health: '/api/peerjs/health',
            peerId: '/api/peerjs/id?key=peerjs',
            peers: '/api/peerjs/peers?key=peerjs',
            documentation: 'https://peerjs.com/docs.html'
        }
    });
});

export default app;
