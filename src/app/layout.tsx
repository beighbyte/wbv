import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp Backup Viewer - 100% Client-Side & Private",
  description:
    "View your exported WhatsApp chats (.zip or folder) smoothly with full WhatsApp design, voice notes, stickers, and images. All processing stays local on your device.",
  keywords: [
    "WhatsApp Backup Viewer",
    "WhatsApp Export Reader",
    "WhatsApp Chat Viewer",
    "Local WhatsApp Reader",
  ],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#008069",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full select-none antialiased bg-gray-100 dark:bg-wa-dark-bg text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}

