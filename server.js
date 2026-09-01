import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';
import multer from 'multer';
import { parsePaymentNotification } from './parsers/smsParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;


// Enable JSON body parsing with large limit for Base64 fallback (if needed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from root and dist directory with no-cache headers
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// MongoDB Configuration
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://kalikapurnabinsanghaclub_db_user:Sb%40210617@knsdc.ewmcdmb.mongodb.net/knsdc?appName=Knsdc";
const client = new MongoClient(mongoUri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('knsdc');
    console.log('[MongoDB] Connected successfully to Atlas cluster!');
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
  }
}
connectDB();

// ==========================================
// WEBSOCKET SERVER — Real-Time Payment Push
// ==========================================
const wss = new WebSocketServer({ server, path: '/ws' });

// Registry: orderId → Set of WebSocket clients waiting for that order
const wsClients = new Map(); // orderId → Set<WebSocket>

wss.on('connection', (ws, req) => {
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const orderId = urlParams.searchParams.get('orderId');

  if (!orderId) {
    ws.close(4000, 'Missing orderId');
    return;
  }

  console.log(`[WS] Client connected for order: ${orderId}`);
  if (!wsClients.has(orderId)) wsClients.set(orderId, new Set());
  wsClients.get(orderId).add(ws);

  ws.on('close', () => {
    const set = wsClients.get(orderId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) wsClients.delete(orderId);
    }
    console.log(`[WS] Client disconnected for order: ${orderId}`);
  });

  ws.on('error', () => {
    const set = wsClients.get(orderId);
    if (set) set.delete(ws);
  });

  // Send connection-established ack
  ws.send(JSON.stringify({ type: 'connected', orderId, message: 'Listening for payment confirmation...' }));
});

// Helper: Broadcast to all clients waiting for a specific orderId
function broadcastPaymentConfirmed(orderId, payload) {
  const clients = wsClients.get(orderId);
  if (clients && clients.size > 0) {
    const msg = JSON.stringify({ type: 'payment_confirmed', orderId, ...payload });
    clients.forEach(ws => {
      if (ws.readyState === 1 /* OPEN */) ws.send(msg);
    });
    console.log(`[WS] Broadcasted payment_confirmed to ${clients.size} client(s) for ${orderId}`);
  }
}

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const STATE_FILE = path.join(__dirname, 'data', 'sync_state.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// In-memory or file-backed fallback state loader
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading state file:', e);
    }
  }
  return {
    activeEventId: "ev-2026-05-09",
    eventName: "Dance Ignition Season 6",
    organizer: "Kalikapur Nabin Sangha",
    participants: [],
    categories: [],
    judges: [],
    subjects: [],
    venues: [],
    judgeAgreements: [],
    events: [],
    switchStates: {},
    foodOrders: [],
    rideBookings: [],
    partnerAssignments: [],
    foodMenu: [
      { id: 'f1', name: 'Burger', price: 99, icon: '🍔' },
      { id: 'f2', name: 'Pizza', price: 199, icon: '🍕' },
      { id: 'f3', name: 'Fries', price: 69, icon: '🍟' },
      { id: 'f4', name: 'Cold Drink', price: 40, icon: '🥤' }
    ]
  };
}

async function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    if (db) {
      if (state.foodMenu) {
        const collection = db.collection('menu_items');
        await collection.deleteMany({});
        if (state.foodMenu.length > 0) {
          await collection.insertMany(state.foodMenu);
        }
        console.log('[MongoDB] Synced menu items to Atlas cluster!');
      }
      if (state.participants) {
        const pCollection = db.collection('participants');
        await pCollection.deleteMany({});
        if (state.participants.length > 0) {
          await pCollection.insertMany(state.participants);
        }
        console.log('[MongoDB] Synced participants & images to Atlas cluster!');
      }
    }
  } catch (e) {
    console.error('Error saving state file:', e);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Render with MongoDB!' });
});

// Image Upload Endpoint (Saves to MongoDB)
app.post('/api/menu/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
  }

  if (!db) {
    return res.status(500).json({ status: 'error', message: 'Database connection not ready.' });
  }

  try {
    const imagesCollection = db.collection('menu_images');
    const doc = {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer, // Buffer is stored directly as Binary in MongoDB
      uploadedAt: new Date()
    };

    const result = await imagesCollection.insertOne(doc);
    const imageUrl = `/api/menu/image/${result.insertedId}`;
    
    res.json({
      status: 'success',
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error('[Upload] Error storing image in MongoDB:', err);
    res.status(500).json({ status: 'error', message: 'Failed to store image in database.' });
  }
});


// Participant Image Upload Endpoint (Saves to MongoDB)
app.post('/api/participant/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
  }

  if (!db) {
    return res.status(500).json({ status: 'error', message: 'Database connection not ready.' });
  }

  try {
    const imagesCollection = db.collection('participant_images');
    const doc = {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedAt: new Date()
    };

    const result = await imagesCollection.insertOne(doc);
    const imageUrl = `/api/participant/image/${result.insertedId}`;
    
    res.json({
      status: 'success',
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error('[Upload] Error storing participant image in MongoDB:', err);
    res.status(500).json({ status: 'error', message: 'Failed to store image in database.' });
  }
});

// Participant Image Serving Endpoint (Reads from MongoDB)
app.get('/api/participant/image/:id', async (req, res) => {
  if (!db) {
    return res.status(500).send('Database connection not ready.');
  }

  try {
    const imagesCollection = db.collection('participant_images');
    const imageId = new ObjectId(req.params.id);
    const imageDoc = await imagesCollection.findOne({ _id: imageId });

    if (!imageDoc) {
      return res.status(404).send('Image not found.');
    }

    res.set('Content-Type', imageDoc.contentType);
    res.send(imageDoc.data.buffer || imageDoc.data);
  } catch (err) {
    console.error('[Image API] Error retrieving participant image:', err);
    res.status(500).send('Error retrieving image from database.');
  }
});

// Image Serving Endpoint (Reads from MongoDB)
app.get('/api/menu/image/:id', async (req, res) => {
  if (!db) {
    return res.status(500).send('Database connection not ready.');
  }

  try {
    const imagesCollection = db.collection('menu_images');
    const imageId = new ObjectId(req.params.id);
    const imageDoc = await imagesCollection.findOne({ _id: imageId });

    if (!imageDoc) {
      return res.status(404).send('Image not found.');
    }

    res.set('Content-Type', imageDoc.contentType);
    res.send(imageDoc.data.buffer || imageDoc.data);
  } catch (err) {
    console.error('[Image API] Error retrieving image:', err);
    res.status(500).send('Error retrieving image from database.');
  }
});

// Sync State API Endpoints
app.get('/api/state', (req, res) => {
  res.json(loadState());
});

app.post('/api/state', (req, res) => {
  const newState = req.body;
  saveState(newState);
  res.json({ status: 'success', message: 'State updated successfully' });
});

// Partner and Bookings Endpoints
app.get('/api/partners', (req, res) => {
  const state = loadState();
  res.json(state.partnerAssignments || []);
});

app.get('/api/bookings', (req, res) => {
  const state = loadState();
  res.json(state.rideBookings || []);
});

app.get('/api/orders', (req, res) => {
  const state = loadState();
  res.json(state.foodOrders || []);
});

// Catch-all route to serve index.html for Single Page Applications (SPA)

// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// MONGODB ATLAS — BIG DATA & RECEIPT PHOTO ATTACHMENTS BACKEND
// ══════════════════════════════════════════════════════════════════

// 1. UPLOAD & STORE LARGE RECEIPT/BILL PHOTO IN MONGODB
app.post('/api/finance/receipt-upload', upload.single('receipt'), async (req, res) => {
  try {
    let receiptBuffer = null;
    let contentType = 'image/jpeg';
    let filename = 'receipt_' + Date.now() + '.jpg';

    if (req.file) {
      receiptBuffer = req.file.buffer;
      contentType = req.file.mimetype || 'image/jpeg';
      filename = req.file.originalname || filename;
    } else if (req.body.imageBase64) {
      const parts = req.body.imageBase64.split(';base64,');
      contentType = parts[0].replace('data:', '') || 'image/jpeg';
      receiptBuffer = Buffer.from(parts[1] || parts[0], 'base64');
      filename = req.body.filename || filename;
    }

    if (!receiptBuffer) {
      return res.status(400).json({ status: 'error', message: 'No receipt file or image provided.' });
    }

    if (db) {
      const col = db.collection('finance_receipt_images');
      const doc = {
        filename,
        contentType,
        data: receiptBuffer,
        size: receiptBuffer.length,
        uploadedAt: new Date()
      };
      const result = await col.insertOne(doc);
      const photoUrl = `/api/finance/receipt-image/${result.insertedId}`;
      console.log(`[MongoDB] Stored receipt image in Atlas: ${result.insertedId} (${receiptBuffer.length} bytes)`);
      return res.json({ status: 'success', photoUrl, imageId: result.insertedId });
    }

    // Fallback: Return inline base64 if MongoDB not connected
    res.json({ status: 'success', photoUrl: req.body.imageBase64 || '' });
  } catch (err) {
    console.error('[MongoDB Receipt Error]:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. RETRIEVE RECEIPT/BILL PHOTO FROM MONGODB
app.get('/api/finance/receipt-image/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).send('Database not connected.');
    const col = db.collection('finance_receipt_images');
    const imageId = new ObjectId(req.params.id);
    const doc = await col.findOne({ _id: imageId });

    if (!doc) return res.status(404).send('Receipt image not found in MongoDB.');

    res.set('Content-Type', doc.contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(doc.data.buffer || doc.data);
  } catch (err) {
    console.error('[MongoDB Image Serve Error]:', err);
    res.status(500).send('Error retrieving receipt image.');
  }
});

// 3. GET TRANSACTIONS FROM MONGODB (WITH RECEIPT LINKS)
app.get('/api/finance/transactions', async (req, res) => {
  try {
    const { type, month, category } = req.query;
    let query = {};
    if (type && type !== 'all') query.type = type;
    if (category) query.category = category;
    if (month) query.date = { $regex: `^${month}` };

    let items = [];
    if (db) {
      const col = db.collection('finance_transactions');
      items = await col.find(query).sort({ date: -1, createdAt: -1 }).toArray();
    } else {
      const state = loadState();
      items = state.financeTransactions || [];
    }

    res.json({ status: 'success', count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. SAVE EARNING / SPENDING IN MONGODB
app.post('/api/finance/transactions', async (req, res) => {
  try {
    const item = req.body;
    if (!item.title || !item.amount) {
      return res.status(400).json({ status: 'error', message: 'Title and amount are required.' });
    }

    const doc = {
      ...item,
      amount: Number(item.amount) || 0,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: new Date()
    };

    if (db) {
      const col = db.collection('finance_transactions');
      await col.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
      console.log(`[MongoDB] Upserted transaction ${doc.id} (${doc.type}: ${doc.title})`);
    }

    // Fallback sync state
    const state = loadState();
    if (!state.financeTransactions) state.financeTransactions = [];
    const idx = state.financeTransactions.findIndex(x => x.id === doc.id);
    if (idx !== -1) state.financeTransactions[idx] = doc;
    else state.financeTransactions.unshift(doc);
    saveState(state);

    res.json({ status: 'success', message: 'Transaction saved in MongoDB', data: doc });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 5. DELETE TRANSACTION FROM MONGODB
app.delete('/api/finance/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      const col = db.collection('finance_transactions');
      await col.deleteOne({ $or: [{ id: id }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] });
    }
    const state = loadState();
    if (state.financeTransactions) {
      state.financeTransactions = state.financeTransactions.filter(x => x.id !== id);
      saveState(state);
    }
    res.json({ status: 'success', message: 'Deleted from MongoDB' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// ZERO-GATEWAY AUTOMATED UPI PAYMENT & DONATION ENGINE
// ==========================================
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'zero_gateway_secret_key_8849';
const UPI_VPA = process.env.UPI_VPA || '7001865288@nyes';
const PAYEE_NAME = process.env.PAYEE_NAME || 'Kalikapur Nabin Sangha Club';

const memoryOrders = new Map();
const processedUtrs = new Set();

// 1. Create Donation Order
app.post('/api/donations/create-order', async (req, res) => {
  try {
    const { amount, donorName, donorPhone, donorEmail, message, eventId, eventName } = req.body;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid contribution amount is required' });
    }

    const orderId = `DON-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderData = {
      orderId,
      amount: numAmount,
      donorName: donorName || 'Well-wisher',
      donorPhone: donorPhone || '',
      donorEmail: donorEmail || '',
      message: message || '',
      eventId: eventId || 'general',
      eventName: eventName || 'Community Support',
      status: 'PENDING',
      utr: null,
      createdAt: new Date(),
      paidAt: null
    };

    memoryOrders.set(orderId, orderData);

    if (db) {
      const col = db.collection('donations');
      await col.insertOne({ ...orderData });
    }

    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${numAmount.toFixed(2)}&tn=${orderId}&cu=INR`;

    res.json({
      success: true,
      order: orderData,
      upiUrl,
      vpa: UPI_VPA,
      payeeName: PAYEE_NAME
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Real-Time Status Check (Frontend Polling)
app.get('/api/donations/check-status', async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    let order = memoryOrders.get(orderId);
    if (!order && db) {
      const col = db.collection('donations');
      order = await col.findOne({ orderId });
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      orderId: order.orderId,
      status: order.status,
      amount: order.amount,
      utr: order.utr,
      paidAt: order.paidAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Automated Webhook Endpoint (From Android Forwarder)
app.post('/api/webhook/payment', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
    }

    const { message, sender, title } = req.body;
    const rawText = `${title || ''} ${message || ''}`.trim();
    console.log(`[Donation Webhook Alert from ${sender || 'App'}]: "${rawText}"`);

    const parsed = parsePaymentNotification(rawText);
    if (!parsed.success) {
      return res.json({ success: false, message: parsed.reason || 'Not a payment confirmation' });
    }

    if (parsed.utr && parsed.utr !== 'N/A' && processedUtrs.has(parsed.utr)) {
      return res.json({ success: true, message: 'Transaction already processed' });
    }

    // — Match Order —
    // Priority 1: Order ID embedded in UPI transaction note (DON-XXXXXX)
    let matchedOrder = null;
    if (parsed.orderId && memoryOrders.has(parsed.orderId)) {
      matchedOrder = memoryOrders.get(parsed.orderId);
    } else if (db && parsed.orderId) {
      matchedOrder = await db.collection('donations').findOne({ orderId: parsed.orderId, status: 'PENDING' });
      if (matchedOrder) memoryOrders.set(matchedOrder.orderId, matchedOrder);
    }

    // Priority 2: Amount match within 45-minute window (oldest PENDING first)
    if (!matchedOrder && parsed.amount) {
      const cutoff = Date.now() - 45 * 60 * 1000;
      let oldest = null;
      for (const [, ord] of memoryOrders.entries()) {
        const created = new Date(ord.createdAt).getTime();
        if (ord.status === 'PENDING' && Math.abs(ord.amount - parsed.amount) < 0.01 && created >= cutoff) {
          if (!oldest || created < new Date(oldest.createdAt).getTime()) oldest = ord;
        }
      }
      matchedOrder = oldest;
    }

    if (!matchedOrder) {
      // Log unmatched payment for manual review
      if (db) {
        await db.collection('unmatched_payments').insertOne({
          amount: parsed.amount, utr: parsed.utr, rawText, receivedAt: new Date()
        });
      }
      console.log(`[Unmatched Donation] Rs.${parsed.amount}, UTR: ${parsed.utr}, Order: ${parsed.orderId}`);
      return res.json({ success: true, message: 'Payment recorded without matching order' });
    }

    matchedOrder.status = 'COMPLETED';
    matchedOrder.utr = parsed.utr || 'VERIFIED';
    matchedOrder.paidAt = new Date();

    if (parsed.utr && parsed.utr !== 'N/A') processedUtrs.add(parsed.utr);

    if (db) {
      await db.collection('donations').updateOne(
        { orderId: matchedOrder.orderId },
        { $set: { status: 'COMPLETED', utr: matchedOrder.utr, paidAt: matchedOrder.paidAt } },
        { upsert: true }
      );

      // Auto-sync into club finance transactions!
      await db.collection('finance_transactions').insertOne({
        id: `TXN-${Date.now()}`,
        title: `Donation: ${matchedOrder.donorName} (${matchedOrder.orderId})`,
        amount: matchedOrder.amount,
        type: 'income',
        category: 'Donations & Sponsorships',
        paymentMethod: 'UPI',
        refNo: matchedOrder.utr,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`[SUCCESS] Donation ${matchedOrder.orderId} verified for Rs.${matchedOrder.amount}!`);

    // 🚀 Push real-time WebSocket event to donor's browser
    broadcastPaymentConfirmed(matchedOrder.orderId, {
      amount: matchedOrder.amount,
      utr: matchedOrder.utr,
      donorName: matchedOrder.donorName,
      eventName: matchedOrder.eventName,
      paidAt: matchedOrder.paidAt
    });

    res.json({ success: true, message: 'Donation completed successfully', orderId: matchedOrder.orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Manual Fallback UTR Submission
app.post('/api/donations/submit-utr', async (req, res) => {
  try {
    const { orderId, utr } = req.body;
    if (!orderId || !utr || !/^\d{12}$/.test(utr.trim())) {
      return res.status(400).json({ error: 'Valid 12-digit UPI UTR required' });
    }

    if (db) {
      await db.collection('donations').updateOne(
        { orderId },
        { $set: { status: 'VERIFYING', utr: utr.trim() } }
      );
    }
    if (memoryOrders.has(orderId)) {
      const order = memoryOrders.get(orderId);
      order.status = 'VERIFYING';
      order.utr = utr.trim();
    }

    res.json({ success: true, message: 'UTR submitted for verification' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET ALL DONATIONS (For Finance & Event Management Portals)
app.get('/api/donations', async (req, res) => {
  try {
    let list = [];
    if (db) {
      const col = db.collection('donations');
      list = await col.find({}).sort({ createdAt: -1 }).toArray();
    } else {
      list = Array.from(memoryOrders.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json({ success: true, donations: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. VERIFY / APPROVE DONATION PAYMENT (From Finance Portal)
app.post('/api/donations/verify', async (req, res) => {
  try {
    const { orderId, utr, status = 'COMPLETED' } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    let order = memoryOrders.get(orderId);
    if (!order && db) {
      order = await db.collection('donations').findOne({ orderId });
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const newStatus = status;
    const finalUtr = utr ? utr.trim() : (order.utr || 'VERIFIED');
    const paidAt = new Date();

    if (memoryOrders.has(orderId)) {
      const mem = memoryOrders.get(orderId);
      mem.status = newStatus;
      mem.utr = finalUtr;
      mem.paidAt = paidAt;
    }

    if (db) {
      await db.collection('donations').updateOne(
        { orderId },
        { $set: { status: newStatus, utr: finalUtr, paidAt } },
        { upsert: true }
      );

      // Sync into club finance transactions
      if (newStatus === 'COMPLETED') {
        await db.collection('finance_transactions').insertOne({
          id: `TXN-${Date.now()}`,
          title: `Donation: ${order.donorName} (${order.eventName || 'Mission'})`,
          amount: Number(order.amount) || 0,
          type: 'income',
          category: 'Donations & Sponsorships',
          paymentMethod: 'UPI',
          refNo: finalUtr,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Broadcast WebSocket confirmation
    broadcastPaymentConfirmed(orderId, {
      amount: order.amount,
      utr: finalUtr,
      donorName: order.donorName,
      eventName: order.eventName,
      paidAt
    });

    res.json({ success: true, message: `Order ${orderId} marked as ${newStatus}`, orderId, status: newStatus, utr: finalUtr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DELETE DONATION RECORD
app.delete('/api/donations/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (db) {
      await db.collection('donations').deleteOne({ orderId });
    }
    if (memoryOrders.has(orderId)) {
      memoryOrders.delete(orderId);
    }
    res.json({ success: true, message: `Deleted donation ${orderId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// 📚 LIBRARY & 🔒 LOCKERS MONGODB COLLECTIONS & REST API ENGINE
// ══════════════════════════════════════════════════════════════

// Default Seed Books
const DEFAULT_LIBRARY_BOOKS = [
  { id: "bk-1", title: "Higher Secondary Mathematics (Part 1 & 2)", author: "S. N. Dey", code: "MTH-101", category: "Mathematics", totalCopies: 4, fee: 0 },
  { id: "bk-2", title: "Quantitative Aptitude for Competitive Examinations", author: "Dr. R. S. Aggarwal", code: "CMP-201", category: "Competitive", totalCopies: 5, fee: 0 },
  { id: "bk-3", title: "WBCS & General Studies Manual", author: "Nitin Singhania", code: "CMP-202", category: "Competitive", totalCopies: 3, fee: 0 },
  { id: "bk-4", title: "Class 10 Physical Science & Environment (WBBSE)", author: "Dr. Bhuniya & Paul", code: "CLS-10", category: "Class Book", totalCopies: 6, fee: 0 },
  { id: "bk-5", title: "Class 12 Physics (NCERT / WBCHSE)", author: "Chhaya Prakashani Editorial", code: "CLS-12", category: "Class Book", totalCopies: 4, fee: 0 },
  { id: "bk-6", title: "Anandamath & Devi Chaudhurani", author: "Bankim Chandra Chattopadhyay", code: "LIT-301", category: "Bengali", totalCopies: 3, fee: 0 },
  { id: "bk-7", title: "Feluda Samagra (Volume 1 & 2)", author: "Satyajit Ray", code: "LIT-302", category: "Literature", totalCopies: 4, fee: 0 },
  { id: "bk-8", title: "A Brief History of Time", author: "Stephen Hawking", code: "SCI-401", category: "Science", totalCopies: 2, fee: 0 }
];

// Auto-seed MongoDB collections on connection
async function seedLibraryAndLockers() {
  if (!db) return;
  try {
    // 1. Seed Library Books if collection is empty
    const bookCount = await db.collection("library_books").countDocuments();
    if (bookCount === 0) {
      await db.collection("library_books").insertMany(DEFAULT_LIBRARY_BOOKS);
      console.log("[MongoDB] Seeded default library books catalog!");
    }
    // 2. Seed Club Lockers if empty
    const lockerCount = await db.collection("club_lockers").countDocuments();
    if (lockerCount === 0) {
      const defaultLockers = [];
      for (let i = 1; i <= 20; i++) {
        const numStr = i < 10 ? `0${i}` : `${i}`;
        defaultLockers.push({
          id: `lkr-${numStr}`,
          name: `Locker #${numStr}`,
          code: `L-${numStr}`,
          category: "Locker",
          defaultFee: 100,
          defaultDeposit: 0
        });
      }
      await db.collection("club_lockers").insertMany(defaultLockers);
      console.log("[MongoDB] Seeded 20 default club locker slots!");
    }
  } catch (err) {
    console.error("[MongoDB Seed Error]:", err.message);
  }
}

// Call seeder after DB connection
setTimeout(seedLibraryAndLockers, 3000);

// ── 1. LIBRARY BOOKS API ──────────────────────────────────────
// GET: All Books in Library Catalog
app.get("/api/library/books", async (req, res) => {
  try {
    if (db) {
      const books = await db.collection("library_books").find({}).sort({ code: 1 }).toArray();
      return res.json({ success: true, books });
    }
    res.json({ success: true, books: DEFAULT_LIBRARY_BOOKS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / PUT: Add or Update Book in Catalog
app.post("/api/library/books", async (req, res) => {
  try {
    const book = req.body;
    book.id = book.id || ("bk-" + Date.now());
    book.updatedAt = new Date();
    if (db) {
      await db.collection("library_books").updateOne(
        { id: book.id },
        { $set: book },
        { upsert: true }
      );
    }
    res.json({ success: true, book });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Remove Book from Catalog
app.delete("/api/library/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection("library_books").deleteOne({ id });
    }
    res.json({ success: true, message: `Deleted book ${id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 2. LIBRARY ISSUES / CIRCULATION API ────────────────────────
// GET: All Book Issues / Returns
app.get("/api/library/issues", async (req, res) => {
  try {
    if (db) {
      const issues = await db.collection("library_issues").find({}).sort({ createdAt: -1 }).toArray();
      return res.json({ success: true, issues });
    }
    res.json({ success: true, issues: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Issue Book to Member
app.post("/api/library/issues", async (req, res) => {
  try {
    const issue = req.body;
    issue.id = issue.id || ("ISS-" + Math.floor(1000 + Math.random() * 9000));
    issue.createdAt = issue.createdAt ? new Date(issue.createdAt) : new Date();
    issue.status = issue.status || "issued";
    if (db) {
      await db.collection("library_issues").insertOne(issue);
      // If borrow fee > 0, auto record in finance transactions
      if (Number(issue.fee) > 0) {
        await db.collection("finance_transactions").insertOne({
          id: "TX-LIB-" + Date.now(),
          title: "Library Borrow Fee: " + (issue.bookTitle || "Book"),
          amount: Number(issue.fee) || 0,
          type: "income",
          category: "Library Fee",
          paymentMethod: "Cash",
          refNo: issue.id,
          date: issue.issueDate || new Date().toISOString().split("T")[0],
          payerOrCustomer: issue.memberName || "Library Reader",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT: Return or Update Issue Record
app.put("/api/library/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    update.updatedAt = new Date();
    if (db) {
      await db.collection("library_issues").updateOne({ id }, { $set: update });
    }
    res.json({ success: true, id, update });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Delete Issue Record
app.delete("/api/library/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection("library_issues").deleteOne({ id });
    }
    res.json({ success: true, message: `Deleted book issue ${id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. MEMBER LOCKERS & ALLOCATION API ────────────────────────
// GET: All Lockers and Allocations
app.get("/api/lockers/bookings", async (req, res) => {
  try {
    if (db) {
      const bookings = await db.collection("locker_bookings").find({}).sort({ createdAt: -1 }).toArray();
      const lockers = await db.collection("club_lockers").find({}).sort({ code: 1 }).toArray();
      return res.json({ success: true, bookings, lockers });
    }
    res.json({ success: true, bookings: [], lockers: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Book/Assign Locker to Member
app.post("/api/lockers/bookings", async (req, res) => {
  try {
    const booking = req.body;
    booking.id = booking.id || ("LKR-" + Math.floor(1000 + Math.random() * 9000));
    booking.createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
    if (db) {
      await db.collection("locker_bookings").insertOne(booking);
      // Auto record rent income in finance transactions
      if (Number(booking.rentAmount) > 0) {
        await db.collection("finance_transactions").insertOne({
          id: "TX-LKR-" + Date.now(),
          title: "Locker Rent: " + (booking.assetName || "Club Locker"),
          amount: Number(booking.rentAmount) || 0,
          type: "income",
          category: "Locker Rent",
          paymentMethod: booking.paymentMethod || "UPI",
          refNo: booking.id,
          date: new Date().toISOString().split("T")[0],
          payerOrCustomer: booking.memberName || "Club Member",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT: Release / Update Locker Booking
app.put("/api/lockers/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    update.updatedAt = new Date();
    if (db) {
      await db.collection("locker_bookings").updateOne({ id }, { $set: update });
    }
    res.json({ success: true, id, update });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Delete Locker Booking
app.delete("/api/lockers/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection("locker_bookings").deleteOne({ id });
    }
    res.json({ success: true, message: `Deleted locker booking ${id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backward Compatibility Endpoint
app.get("/api/assets/bookings", async (req, res) => {
  try {
    if (db) {
      const bookings = await db.collection("locker_bookings").find({}).sort({ createdAt: -1 }).toArray();
      const assets = await db.collection("club_lockers").find({}).toArray();
      return res.json({ success: true, bookings, assets });
    }
    res.json({ success: true, bookings: [], assets: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ══════════════════════════════════════════════════════════════
// 👥 MEMBERS DIRECTORY & 🎛️ PLANS & 📋 CHECKLIST MONGODB CLOUD ENGINE
// ══════════════════════════════════════════════════════════════

const DEFAULT_PLANS = [
  { id: "plan-std", planType: "fixed", type: "fixed", name: "General Member Plan", fee: 200, description: "Standard membership with sports kits & ground access.", benefits: ["🏏 Sports Ground"], lateFeeDays: 5, lateFeeAmount: 0, color: "#3b82f6", active: true, billingCycle: "monthly" },
  { id: "plan-vip", planType: "fixed", type: "fixed", name: "Executive Patron Plan", fee: 500, description: "Full club access with dedicated locker & library borrowing.", benefits: ["🔒 Dedicated Locker", "📚 Library Access", "🏏 Sports Ground", "🎟️ Event Passes"], lateFeeDays: 10, lateFeeAmount: 0, color: "#8b5cf6", active: true, billingCycle: "monthly" },
  { id: "plan-flex", planType: "flexible", type: "flexible", name: "Flexible Supporter Plan", fee: 1000, description: "Customizable contribution up to ₹1,000 per month.", benefits: ["📚 Library Access", "🏏 Sports Ground", "🎟️ Event Passes", "🗳️ Voting Rights"], lateFeeDays: 0, lateFeeAmount: 0, color: "#ec4899", active: true, billingCycle: "monthly" }
];

const DEFAULT_MEMBERS = [
  { id: "mem-1", name: "Sourav Ganguly", phone: "9830012345", email: "sourav@knsdc.org", memberType: "Executive Patron", planId: "plan-vip", planName: "Executive Patron Plan", monthlyFee: 500, joiningDate: "2024-01-15", address: "Kalikapur, Kolkata", bloodGroup: "B+", status: "active" },
  { id: "mem-2", name: "Anirban Bhattacharya", phone: "9831123456", email: "anirban@knsdc.org", memberType: "General Member", planId: "plan-std", planName: "General Member Plan", monthlyFee: 200, joiningDate: "2024-03-01", address: "Santoshpur, Kolkata", bloodGroup: "O+", status: "active" },
  { id: "mem-3", name: "Debojyoti Mukherjee", phone: "9832234567", email: "debojyoti@knsdc.org", memberType: "Flexible Supporter", planId: "plan-flex", planName: "Flexible Supporter Plan", monthlyFee: 500, joiningDate: "2024-05-10", address: "Garia, Kolkata", bloodGroup: "A+", status: "active" }
];

async function seedMembersAndPlans() {
  if (!db) return;
  try {
    const planCount = await db.collection("club_plans").countDocuments();
    if (planCount === 0) {
      await db.collection("club_plans").insertMany(DEFAULT_PLANS);
      console.log("[MongoDB] Seeded default membership plans!");
    }
    const memberCount = await db.collection("club_members").countDocuments();
    if (memberCount === 0) {
      await db.collection("club_members").insertMany(DEFAULT_MEMBERS);
      console.log("[MongoDB] Seeded default club members!");
    }
  } catch (err) {
    console.error("[MongoDB Seed Members/Plans Error]:", err.message);
  }
}
setTimeout(seedMembersAndPlans, 3500);

// ── 1. MEMBERS API ───────────────────────────────────────────
// GET: All Members
app.get("/api/finance/members", async (req, res) => {
  try {
    if (db) {
      const members = await db.collection("club_members").find({}).sort({ name: 1 }).toArray();
      return res.json({ success: true, count: members.length, members });
    }
    res.json({ success: true, count: DEFAULT_MEMBERS.length, members: DEFAULT_MEMBERS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / PUT: Add or Update Member in MongoDB
app.post("/api/finance/members", async (req, res) => {
  try {
    const member = req.body;
    member.id = member.id || ("mem-" + Date.now());
    member.updatedAt = new Date();
    if (db) {
      await db.collection("club_members").updateOne(
        { id: member.id },
        { $set: member },
        { upsert: true }
      );
      console.log(`[MongoDB] Upserted member: ${member.name} (${member.id})`);
    }
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Remove Member from MongoDB
app.delete("/api/finance/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection("club_members").deleteOne({ id });
      console.log(`[MongoDB] Deleted member: ${id}`);
    }
    res.json({ success: true, message: `Deleted member ${id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 2. PLANS API ─────────────────────────────────────────────
// GET: All Plans
app.get("/api/finance/plans", async (req, res) => {
  try {
    if (db) {
      const plans = await db.collection("club_plans").find({}).sort({ fee: 1 }).toArray();
      return res.json({ success: true, count: plans.length, plans });
    }
    res.json({ success: true, count: DEFAULT_PLANS.length, plans: DEFAULT_PLANS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / PUT: Add or Update Plan in MongoDB
app.post("/api/finance/plans", async (req, res) => {
  try {
    const plan = req.body;
    plan.id = plan.id || ("plan-" + Date.now());
    plan.updatedAt = new Date();
    if (db) {
      await db.collection("club_plans").updateOne(
        { id: plan.id },
        { $set: plan },
        { upsert: true }
      );
      console.log(`[MongoDB] Upserted plan: ${plan.name} (${plan.id})`);
    }
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Remove Plan from MongoDB
app.delete("/api/finance/plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection("club_plans").deleteOne({ id });
      console.log(`[MongoDB] Deleted plan: ${id}`);
    }
    res.json({ success: true, message: `Deleted plan ${id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. MONTHLY FEE CHECKLIST PAYMENTS API ─────────────────────
// GET: All Payments for a Month or All-Time
app.get("/api/finance/payments", async (req, res) => {
  try {
    const { month } = req.query;
    let query = {};
    if (month) query.month = month;
    if (db) {
      const payments = await db.collection("fee_payments").find(query).toArray();
      return res.json({ success: true, count: payments.length, payments });
    }
    res.json({ success: true, count: 0, payments: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / PUT: Record Monthly Fee Payment in MongoDB
app.post("/api/finance/payments", async (req, res) => {
  try {
    const p = req.body;
    p.id = p.id || (`pay-${p.memberId}-${p.month || Date.now()}`);
    p.updatedAt = new Date();
    if (db) {
      await db.collection("fee_payments").updateOne(
        { id: p.id },
        { $set: p },
        { upsert: true }
      );
      // If paid, auto record in finance transactions as Income
      if (p.status === "paid" && (Number(p.paidAmount) || Number(p.amount)) > 0) {
        await db.collection("finance_transactions").updateOne(
          { id: `TX-FEE-${p.id}` },
          {
            $set: {
              id: `TX-FEE-${p.id}`,
              title: `Monthly Fee (${p.month}): ${p.memberName || "Club Member"}`,
              amount: Number(p.paidAmount) || Number(p.amount) || 0,
              type: "earning",
              category: "Membership Fee",
              paymentMethod: p.paymentMethod || "UPI",
              refNo: p.invoiceNo || p.id,
              date: p.paidAt ? p.paidAt.split("T")[0] : new Date().toISOString().split("T")[0],
              payerOrCustomer: p.memberName || "Club Member",
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }
    res.json({ success: true, payment: p });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// 8. WebSocket Health Check
app.get('/api/ws-ping', (req, res) => {
  res.json({ status: 'ok', wsClients: wsClients.size, wsPath: '/ws' });
});


app.get(/(.*)/, (req, res) => {
  const reqPath = req.params[0] || '';
  const localFile = path.join(__dirname, reqPath);
  if (reqPath && fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
    return res.sendFile(localFile);
  }
  const distFile = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distFile)) {
    return res.sendFile(distFile);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Use `server.listen` (not `app.listen`) so WebSocket upgrades are handled
server.listen(PORT, () => {
  console.log(`[KNSDC] Server + WebSocket running on port ${PORT}`);
  console.log(`[KNSDC] Webhook endpoint: POST /api/webhook/payment`);
  console.log(`[KNSDC] WebSocket endpoint: ws://localhost:${PORT}/ws?orderId=DON-XXXXXX`);
});
