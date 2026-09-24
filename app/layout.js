import "./globals.css";
import ClientAuthInit from "./components/client-auth-init";
import GlobalProgressBar from "./components/ui/global-progress-bar";

export const metadata = {
  title: "Advance Printing CRM & ERP",
  description: "Unified Printing Operations & Customer Management Platform",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <GlobalProgressBar />
        <ClientAuthInit />
        {children}
      </body>
    </html>
  );
}
