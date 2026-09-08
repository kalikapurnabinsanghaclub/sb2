import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://kalikapurnabinsanghaclub_db_user:Sb%40210617@knsdc.ewmcdmb.mongodb.net/knsdc?appName=Knsdc';
const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  connectTimeoutMS: 10000
});

async function run() {
  try {
    await client.connect();
    console.log('[SUCCESS] Connected to MongoDB Atlas knsdc database!');
    const db = client.db('knsdc');
    const cols = await db.listCollections().toArray();
    console.log('[COLLECTIONS]:', cols.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error('[ERROR]:', err.message);
  }
}

run();
