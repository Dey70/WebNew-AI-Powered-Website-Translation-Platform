export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // For demo purposes, return mock data since Supabase is not configured
    console.log("[History] Returning mock data - Supabase not configured");
    
    switch (req.method) {
      case "GET":
        return res.status(200).json({
          success: true,
          data: [],
          count: 0,
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          message: "Demo mode - no database configured"
        });
        
      case "POST":
        const { original_text, translated_text, target_language } = req.body;
        
        if (!original_text || !translated_text || !target_language) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields",
            message: "original_text, translated_text, and target_language are required",
          });
        }

        return res.status(200).json({
          success: true,
          data: { 
            id: 'demo-' + Date.now(),
            original_text,
            translated_text,
            target_language,
            created_at: new Date().toISOString()
          },
          message: "Demo mode - translation not saved to database"
        });
        
      case "DELETE":
        return res.status(200).json({
          success: true,
          message: "Demo mode - no database operations performed"
        });
        
      default:
        return res.status(405).json({
          success: false,
          error: "Method not allowed",
          message: `Method ${req.method} is not supported`,
        });
    }
  } catch (error) {
    console.error("History API Error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while processing your request",
      timestamp: new Date().toISOString(),
    });
  }
}

