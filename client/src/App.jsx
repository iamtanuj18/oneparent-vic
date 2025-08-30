// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import Router from "./router/Router";
import NavBar from "./components/navbar/NavBar";
import Footer from "./components/footer/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <NavBar />
        <main className="page-content">
          <Router />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}