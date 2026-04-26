# PresentAI — AI Presentation Evaluator

PresentAI is a comprehensive, AI-powered presentation coaching platform that analyzes video submissions for confidence, speech clarity, eye contact, and emotional engagement.

## 🚀 Live Links

- **Frontend App:** [https://presentai-eval-yash2026.web.app](https://presentai-eval-yash2026.web.app)
- **Backend API:** [https://ai-presentation-evaluator.onrender.com](https://ai-presentation-evaluator.onrender.com)

## ✨ Features

- **Confidence Scoring:** Overall performance evaluation based on multiple metrics.
- **Speech-to-Text:** Automated transcription of presentation audio.
- **Filler Word Detection:** Identifies "ums," "ahs," and other verbal crutches.
- **Eye Contact Analysis:** Uses computer vision to track audience engagement.
- **Dashboard History:** Real-time access to past analysis results.
- **Professional PDF Reports:** Downloadable summary of coaching feedback and charts.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, TailwindCSS, Lucide, Recharts, jsPDF
- **Backend:** Node.js, Express, Multer, FFmpeg
- **AI Engine:** Google Gemini 2.5 Flash
- **Database/Auth:** Firebase Firestore & Authentication

## 📦 Deployment Information

The application is deployed using a hybrid architecture for maximum performance and cost efficiency:
1. **Frontend** is hosted on **Firebase Hosting** for rapid global delivery.
2. **Backend** is hosted on **Render** to handle heavy video processing tasks with FFmpeg.
3. **Storage** is managed locally on the backend server with an automated 24-hour cleanup cycle.

---

Created with ❤️ by [Yashveersir](https://github.com/Yashveersir)
