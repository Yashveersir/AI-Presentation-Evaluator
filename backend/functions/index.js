const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import Cloud Functions
const triggerAnalysis = require("./triggerAnalysis");
const getResults = require("./getResults");

// Export all functions
exports.triggerAnalysis = triggerAnalysis;
exports.getResults = getResults;
