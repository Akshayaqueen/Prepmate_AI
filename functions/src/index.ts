import * as admin from "firebase-admin";

admin.initializeApp();

// Import and re-export Cloud Function endpoints from dedicated modules
export { startSession } from "./startSession";
export { submitResponse } from "./submitResponse";
export { endSession } from "./endSession";

/**
 * POST /getRewrite
 * On-demand rewrite for any specific answer.
 * Accepts: sessionId, turnNumber, transcript
 * Returns: original, improved, improvements
 */
import { onRequest } from "firebase-functions/v2/https";

export const getRewrite = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // TODO: Use request body params in full implementation (task 4.7)
  // Expected body: { sessionId, turnNumber, transcript }
  const { transcript } = req.body;

  res.status(200).json({
    original: transcript || "Placeholder original answer",
    improved: "Placeholder improved version with better structure",
    improvements: [
      "Restructured using STAR framework",
      "Added specific metrics and outcomes",
    ],
  });
});
