import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing with large limit for Base64 fallback (if needed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the Vite build directory (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

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
// MONGODB BACKEND API — EARNINGS & SPENDING (FINANCE PORTAL)
// ══════════════════════════════════════════════════════════════════

// 1. GET ALL TRANSACTIONS (EARNINGS & SPENDINGS)
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
    }

    // Fallback if empty: seed initial records
    if (items.length === 0 && (!type || type === 'all')) {
      const state = loadState();
      items = state.financeTransactions || [];
    }

    res.json({ status: 'success', count: items.length, data: items });
  } catch (err) {
    console.error('[MongoDB] Error fetching finance transactions:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. POST LOG NEW EARNING
app.post('/api/finance/earnings', async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, date, payerOrCustomer, referenceNo, description } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ status: 'error', message: 'Title and amount are required.' });
    }

    const newEarning = {
      id: req.body.id || ('earn-' + Date.now()),
      type: 'earning',
      title: title.trim(),
      amount: Number(amount) || 0,
      category: category || 'other',
      paymentMethod: paymentMethod || 'cash',
      date: date || new Date().toISOString().split('T')[0],
      payerOrCustomer: payerOrCustomer ? payerOrCustomer.trim() : '',
      referenceNo: referenceNo ? referenceNo.trim() : ('REC-' + Date.now().toString().slice(-6)),
      description: description ? description.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (db) {
      const col = db.collection('finance_transactions');
      await col.insertOne(newEarning);
      console.log(`[MongoDB] Logged new earning: "${newEarning.title}" (+₹${newEarning.amount})`);
    }

    // Also update sync state fallback
    const state = loadState();
    if (!state.financeTransactions) state.financeTransactions = [];
    state.financeTransactions.unshift(newEarning);
    saveState(state);

    res.json({ status: 'success', message: 'Earning logged successfully in MongoDB', data: newEarning });
  } catch (err) {
    console.error('[MongoDB] Error saving earning:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. POST LOG NEW SPENDING / EXPENSE
app.post('/api/finance/spendings', async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, date, vendorOrRecipient, referenceNo, description, receiptPhoto } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ status: 'error', message: 'Title and amount are required.' });
    }

    const newSpending = {
      id: req.body.id || ('spend-' + Date.now()),
      type: 'spending',
      title: title.trim(),
      amount: Number(amount) || 0,
      category: category || 'other_expense',
      paymentMethod: paymentMethod || 'cash',
      date: date || new Date().toISOString().split('T')[0],
      vendorOrRecipient: vendorOrRecipient ? vendorOrRecipient.trim() : '',
      referenceNo: referenceNo ? referenceNo.trim() : ('EXP-' + Date.now().toString().slice(-6)),
      description: description ? description.trim() : '',
      receiptPhoto: receiptPhoto || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (db) {
      const col = db.collection('finance_transactions');
      await col.insertOne(newSpending);
      console.log(`[MongoDB] Logged new spending: "${newSpending.title}" (-₹${newSpending.amount})`);
    }

    // Also update sync state fallback
    const state = loadState();
    if (!state.financeTransactions) state.financeTransactions = [];
    state.financeTransactions.unshift(newSpending);
    saveState(state);

    res.json({ status: 'success', message: 'Spending logged successfully in MongoDB', data: newSpending });
  } catch (err) {
    console.error('[MongoDB] Error saving spending:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. DELETE TRANSACTION (EARNING OR SPENDING)
app.delete('/api/finance/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (db) {
      const col = db.collection('finance_transactions');
      await col.deleteOne({ $or: [{ id: id }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] });
      console.log(`[MongoDB] Deleted transaction: ${id}`);
    }

    // Also remove from fallback state
    const state = loadState();
    if (state.financeTransactions) {
      state.financeTransactions = state.financeTransactions.filter(t => t.id !== id);
      saveState(state);
    }

    res.json({ status: 'success', message: `Transaction ${id} deleted successfully.` });
  } catch (err) {
    console.error('[MongoDB] Error deleting transaction:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 5. GET FINANCIAL SUMMARY (TOTAL INFLOW, OUTFLOW, NET TREASURY BALANCE)
app.get('/api/finance/summary', async (req, res) => {
  try {
    const { month } = req.query;
    let query = {};
    if (month) query.date = { $regex: `^${month}` };

    let transactions = [];
    if (db) {
      const col = db.collection('finance_transactions');
      transactions = await col.find(query).toArray();
    } else {
      const state = loadState();
      transactions = state.financeTransactions || [];
    }

    const totalEarnings = transactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalSpendings = transactions
      .filter(t => t.type === 'spending')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netBalance = totalEarnings - totalSpendings;

    res.json({
      status: 'success',
      month: month || 'all-time',
      summary: {
        totalEarnings,
        totalSpendings,
        netBalance,
        transactionCount: transactions.length
      }
    });
  } catch (err) {
    console.error('[MongoDB] Error computing summary:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 6. MEMBERSHIP PLANS SYNC IN MONGODB
app.get('/api/finance/plans', async (req, res) => {
  try {
    let plans = [];
    if (db) {
      plans = await db.collection('finance_plans').find({}).toArray();
    }
    res.json({ status: 'success', data: plans });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/finance/plans', async (req, res) => {
  try {
    const plan = req.body;
    if (db) {
      const col = db.collection('finance_plans');
      await col.updateOne({ id: plan.id }, { $set: plan }, { upsert: true });
    }
    res.json({ status: 'success', message: 'Plan saved in MongoDB' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
