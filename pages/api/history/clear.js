export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow DELETE requests
  if (req.method !== "DELETE") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only DELETE requests are supported",
    });
  }

  try {
    // For demo purposes, return success since Supabase is not configured
    console.log("[Clear History] Demo mode - no database operations performed");
    
    res.status(200).json({
      success: true,
      data: null,
      message: "Demo mode - no database operations performed",
    });
  } catch (error) {
    console.error("Clear History API Error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while clearing translation history",
      timestamp: new Date().toISOString(),
    });
  }
}

