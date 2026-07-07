import "./globals.css";

export const metadata = {
  title: "WebNew Dashboard",
  description: "Manage your WebNew projects, sites, and translations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
