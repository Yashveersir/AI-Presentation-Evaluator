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

// API Landing Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PresentAI API Server</title>
        <style>
            :root {
                --primary: #6366f1;
                --bg: #0a0a0f;
                --card: rgba(30, 30, 40, 0.7);
            }
            body {
                margin: 0;
                font-family: 'Inter', system-ui, sans-serif;
                background: var(--bg);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                overflow: hidden;
            }
            .container {
                text-align: center;
                padding: 3rem;
                background: var(--card);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                max-width: 500px;
            }
            .logo {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            h1 {
                margin: 0;
                background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 800;
                letter-spacing: -1px;
            }
            p {
                color: #94a3b8;
                line-height: 1.6;
                margin: 1.5rem 0 2rem;
            }
            .status {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(34, 197, 94, 0.1);
                color: #4ade80;
                padding: 8px 16px;
                border-radius: 100px;
                font-size: 0.875rem;
                font-weight: 600;
            }
            .dot {
                width: 8px;
                height: 8px;
                background: #22c55e;
                border-radius: 50%;
                box-shadow: 0 0 10px #22c55e;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }
            .btn {
                display: inline-block;
                background: var(--primary);
                color: white;
                text-decoration: none;
                padding: 12px 28px;
                border-radius: 12px;
                font-weight: 600;
                transition: all 0.3s;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🚀</div>
            <h1>PresentAI API</h1>
            <p>Your AI Presentation Pipeline is currently active and processing requests. This server handles video analysis, speech-to-text, and coaching generation.</p>
            <div style="margin-bottom: 2rem;">
                <div class="status"><span class="dot"></span> System Operational</div>
            </div>
            <a href="https://presentai-eval-yash2026.web.app" class="btn">Go to Dashboard</a>
        </div>
    </body>
    </html>
  `);
});

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
    
    // Create initial document in Firestore
    await db.collection('videos').doc(videoId).set({
      userId,
      fileName: req.file.originalname,
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
    } finally {
      // Immediately clean up video after processing
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        console.log(`[${videoId}] Deleted processed video: ${videoPath}`);
      }
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PresentAI Backend running locally at http://localhost:${PORT}`);
  console.log(`Using Gemini Free Tier for AI Processing`);
});
