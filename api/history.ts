import { createClient } from "../lib/superbase/server";

export default async function handler(
  req,
  res
) {
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
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log("[History] Supabase not configured, returning empty response");
      
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
            message: "Supabase not configured - no history available"
          });
        case "POST":
          return res.status(200).json({
            success: true,
            data: { id: 'demo-' + Date.now() },
            message: "Supabase not configured - translation not saved to database"
          });
        case "DELETE":
          return res.status(200).json({
            success: true,
            message: "Supabase not configured - no database operations performed"
          });
        default:
          return res.status(405).json({
            success: false,
            error: "Method not allowed",
            message: `Method ${req.method} is not supported`,
          });
      }
    }

    const supabase = await createClient();

    switch (req.method) {
      case "GET":
        // Get translation history with pagination and export support
        const { page = 1, limit = 10, export: isExport } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const offset = (pageNum - 1) * limitNum;

        const query = supabase
          .from("translation_history")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (isExport === "true") {
          const { data: allHistory, error: fetchError } = await query;
          if (fetchError) throw fetchError;
          res.status(200).json({
            success: true,
            data: allHistory || [],
            count: allHistory?.length || 0,
            message: "Export data retrieved successfully",
          });
        } else {
          const { data: history, error: fetchError, count } = await query.range(
            offset,
            offset + limitNum - 1
          );
          if (fetchError) throw fetchError;
          res.status(200).json({
            success: true,
            data: history || [],
            count: history?.length || 0,
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil((count || 0) / limitNum),
          });
        }
        break;

      case "POST":
        const { original_text, translated_text, target_language } = req.body;

        if (!original_text || !translated_text || !target_language) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields",
            message:
              "original_text, translated_text, and target_language are required",
          });
        }

        if (original_text.length > 1000) {
          return res.status(400).json({
            success: false,
            error: "Text too long",
            message: "Original text must be less than 1000 characters",
          });
        }

        const validLanguages = [
          "french",
          "spanish",
          "german",
          "italian",
          "portuguese",
          "dutch",
          "russian",
          "chinese",
          "japanese",
          "korean",
        ];

        if (!validLanguages.includes(target_language)) {
          return res.status(400).json({
            success: false,
            error: "Invalid language",
            message: `Target language must be one of: ${validLanguages.join(", ")}`,
          });
        }

        const { data: newEntry, error: insertError } = await supabase
          .from("translation_history")
          .insert({
            original_text,
            translated_text,
            target_language,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        res.status(201).json({
          success: true,
          data: newEntry,
          message: "Translation saved to history",
        });
        break;

      case "DELETE":
        const { id } = req.query;
        if (!id || typeof id !== "string") {
          return res.status(400).json({
            success: false,
            error: "Missing or invalid ID",
            message: "A valid translation ID is required",
          });
        }

        const { error: deleteError } = await supabase
          .from("translation_history")
          .delete()
          .eq("id", id);
        if (deleteError) throw deleteError;

        res.status(200).json({
          success: true,
          message: "Translation deleted from history",
        });
        break;

      default:
        res.status(405).json({
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