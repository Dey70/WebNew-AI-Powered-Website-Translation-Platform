// Minimal static file server for e2e fixtures -- no dependency on a live
// Next.js server, Supabase, or LibreTranslate. The widget's /api/translate
// calls are intercepted at the network layer by Playwright (page.route) in
// the test itself, so this server only ever needs to serve the fixture page
// and the widget script.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4321;
const ROOT = path.join(__dirname, "..", "..");

const routes = {
  "/widget-demo.html": path.join(ROOT, "tests", "fixtures", "widget-demo.html"),
  "/cdn/webnew.js": path.join(ROOT, "public", "cdn", "webnew.js"),
};

const server = http.createServer((req, res) => {
  const filePath = routes[req.url];
  if (!filePath) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error reading file");
      return;
    }
    const contentType = filePath.endsWith(".html") ? "text/html" : "application/javascript";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`e2e static server listening on http://localhost:${PORT}`);
});
