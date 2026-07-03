export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only DELETE requests are supported",
    });
  }

  try {
    const id = req.query?.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid ID",
        message: "A valid translation ID is required",
      });
    }

    const { getServiceClient } = await import("@/lib/supabase/admin");
    const supabase = getServiceClient();

    if (!supabase) {
      console.log("[Delete] Supabase not configured, returning success response");
      return res.status(200).json({
        success: true,
        message: "Supabase not configured - no database operations performed"
      });
    }

    const { error } = await supabase
      .from("translation_history")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ success: true, message: "Translation deleted" });
  } catch (error) {
    console.error("Delete API Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while deleting translation",
      timestamp: new Date().toISOString(),
    });
  }
} 