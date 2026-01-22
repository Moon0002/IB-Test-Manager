"use client";

import { useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Chatbot from "./Chatbot";
import StructuredPaperSelector from "../components/StructuredPaperSelector";
import { useDarkMode } from "../contexts/DarkModeContext";

export default function Home() {
  const chatbotRef = useRef(null);
  const [layout, setLayout] = useState('side-by-side'); // 'side-by-side' or 'stacked'
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleSelectionSubmit = (query) => {
    console.log('Structured selector generated query:', query);
    // Send the query directly to the chatbot
    if (chatbotRef.current) {
      chatbotRef.current.sendStructuredQuery(query);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="hero-section">
          <div className="hero-content">
            <img src="/logo.png" alt="Logo" className="hero-logo" />
            <div>
              <h1 className="hero-title">Welcome to IB Past Papers Chatbot</h1>
              <span className="hero-description">Select your Year, Month, Group, Subject, Level, and Paper to get the exact file.</span>

              <p>
                &nbsp;
              </p>
              <p className="hero-description">
                If the bot cannot find the paper, the paper may not exist in the database.
              </p>
              <span style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: '500', background: 'rgba(255, 255, 255, 0.15)', padding: '0.5rem 1rem', borderRadius: '16px', display: 'inline-block', marginTop: '1rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Paper for May 2020 (COVID-19) does not exist
              </span>
              <p className="hero-description">
                Reminder 1: ab_initio papers are classified as SL Language papers.
              </p>
              <p className="hero-description">
                Reminder 2: Further Mathematics are only available as HL papers.
              </p>
              <p className="hero-description" style={{ color: '#ffd700' }}>
                New Update: November 2024 and May 2025 Papers are now available.
              </p>

              <p className="hero-description">
                Notice: If you find any missing files (pdf or audio), please let me know.<br/>
                Email ibtestmanager0928@gmail.com with screenshot and details of the bug/missing files.<br/>
                However, before you do that, please check if the paper does exist in this world.
              </p>

              
              {/* Layout Toggle Button */}
              <div className="layout-toggle-container">
                <button 
                  className={`layout-toggle-btn ${layout === 'side-by-side' ? 'active' : ''}`}
                  onClick={() => setLayout('side-by-side')}
                  title="Side-by-side layout"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="8" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <rect x="13" y="3" width="8" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Side-by-side
                </button>
                <button 
                  className={`layout-toggle-btn ${layout === 'stacked' ? 'active' : ''}`}
                  onClick={() => setLayout('stacked')}
                  title="Stacked layout"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="13" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Stacked
                </button>
              </div>

              {/* Dark Mode Toggle Button */}
              <div className="dark-mode-toggle-container">
                <button 
                  className="dark-mode-toggle-btn"
                  onClick={toggleDarkMode}
                  title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                >
                  {isDarkMode ? (
                    // Moon icon for dark mode (current state)
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    // Sun icon for light mode (current state)
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="main-interface">

          <div className={`interface-container ${layout}`}>
            {/* Left/Top Column - Structured Selector */}
            <div className="selector-column">
              <div className="selector-header">
                <h2>Structured Paper Selector</h2>
                <p>Use the guided interface to find papers step-by-step</p>
              </div>
              <StructuredPaperSelector onSelectionSubmit={handleSelectionSubmit} />
            </div>
            
            {/* Right/Bottom Column - Chat Interface */}
            <div className="chat-column">
              <div className="chat-header">
                <h2>Results</h2>
                <p>Your selected papers will appear here</p>
              </div>
              <Chatbot ref={chatbotRef} />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
