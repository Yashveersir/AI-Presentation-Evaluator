const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import pipeline and firebase admin
const { runPipeline, extractResults } = require('./pipelines/orchestrator');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized with service account key");
  } catch (error) {
    console.error("⚠️ ERROR: Missing serviceAccountKey.json!");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts");
    // Fallback to default credentials
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'presentai-eval-yash2026'
    });
  }
}
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Set up storage for uploaded videos
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Serve uploaded videos statically
app.use('/videos', express.static(uploadDir));

// Main API Route for video upload and analysis
app.post('/api/analyze', upload.single('video'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const videoId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const videoPath = req.file.path;
    
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    // Create initial document in Firestore
    await db.collection('videos').doc(videoId).set({
      userId,
      fileName: req.file.originalname,
      videoUrl: `${baseUrl}/videos/${req.file.filename}`,
      status: 'processing',
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send response back immediately to unblock UI
    res.json({ success: true, videoId });

    console.log(`[${videoId}] Starting processing for video: ${videoPath}`);

    // Run the AI pipeline in the background
    try {
      const finalContext = await runPipeline({
        videoId,
        userId,
        videoPath
      });
      
      const results = extractResults(finalContext);
      
      // Save results to Firestore
      await db.collection('analysis_results').doc(videoId).set(results);
      
      // Mark as done
      await db.collection('videos').doc(videoId).update({
        status: 'done'
      });
      console.log(`[${videoId}] Processing complete and saved to Firestore`);
    } catch (pipelineErr) {
      console.error(`[${videoId}] Pipeline error:`, pipelineErr);
      await db.collection('videos').doc(videoId).update({
        status: 'failed',
        errorMessage: pipelineErr.message
      });
    }

    // Notice: Video file is intentionally NOT deleted so it can be served to the frontend.

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Automated cleanup: delete videos older than 24 hours to save disk space
setInterval(() => {
  if (!fs.existsSync(uploadDir)) return;
  
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Cleanup read error:", err);
      return;
    }
    
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        // 24 hours in milliseconds
        if (now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
          fs.unlink(filePath, unlinkErr => {
            if (!unlinkErr) {
              console.log(`🧹 Cleaned up old video file: ${file}`);
            }
          });
        }
      });
    });
  });
}, 60 * 60 * 1000); // Run every 1 hour

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PresentAI Backend running locally at http://localhost:${PORT}`);
  console.log(`Using Gemini Free Tier for AI Processing`);
});
