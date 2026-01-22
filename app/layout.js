import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { DarkModeProvider } from "../contexts/DarkModeContext";

// Removed Google Geist fonts to allow global Times New Roman to apply

export const metadata = {
  title: "IB Past Papers Chatbot",
  description: "Access IB past papers through a Gemini-integrated chatbot",
};

export default function RootLayout({ children }) {
  const adsenseClient = process.env.GOOGLE_ADSENSE_CLIENT;
  
  return (
    <html lang="en">
      <body className="app-container">
        <DarkModeProvider>
          <Header />
          <main className="app-main">
            <section className="app-main-section">{children}</section>
          </main>
          <Footer />
        </DarkModeProvider>
      </body>
    </html>
  );
}
