import "./globals.css";

export const metadata = {
  title: "AIXI TEMP MAIL",
  description: "Disposable email inbox by AIXI CODEX"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}