// src/App.jsx
import { BrowserRouter, useLocation } from "react-router-dom";
import Router from "./router/Router";
import NavBar from "./components/navbar/NavBar";
import Footer from "./components/footer/Footer";

function AppContent() {
  const location = useLocation();
  const is404Page = location.pathname === '*' || 
    !['/', '/playdate', '/events', '/benefits', '/childcare', '/wellbeing', '/transition', '/about', '/data-privacy', '/api/health-check'].includes(location.pathname);

  return (
    <div className="app-container">
      {!is404Page && <NavBar />}
      <main className="page-content">
        <Router />
      </main>
      {!is404Page && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
