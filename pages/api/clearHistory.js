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
    const { createClient } = await import("../lib/superbase/server");
    const supabase = await createClient();

    const { error } = await supabase
      .from("translation_history")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;

    res.status(200).json({ success: true, data: null, message: "All translation history cleared" });
  } catch (error) {
    console.error("ClearHistory API Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while clearing translation history",
      timestamp: new Date().toISOString(),
    });
  }
} 