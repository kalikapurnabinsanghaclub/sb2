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
    if (db && state.foodMenu) {
      const collection = db.collection('menu_items');
      await collection.deleteMany({});
      if (state.foodMenu.length > 0) {
        await collection.insertMany(state.foodMenu);
      }
      console.log('[MongoDB] Synced menu items to Atlas cluster!');
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
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
