// src/router/Router.jsx

import { Routes, Route } from "react-router-dom";

// Home
import HomePage from "../pages/HomePage";

// Data Insights
import DataInsightsPage from "../pages/datainsights/DataInsightsPage";

// PlayDate & Outings
import PlaydatePage from "../pages/playdate/PlaydatePage";

// Benefits & Childcare
import BenefitsPage from "../pages/benefits/BenefitsPage";
import ChildcarePlannerPage from "../pages/childcare/ChildcarePlannerPage";

// Wellbeing & Transition
import WellbeingPage from "../pages/wellbeing/WellbeingPage";
import TransitionToolPage from "../pages/transition/TransitionToolPage";

// About & Policies
import AboutPage from "../pages/about/AboutPage";
import DataPrivacyPage from "../pages/dataprivacy/DataPrivacyPage";

// Not Found
import NotFoundPage from "../pages/notfound/NotFoundPage";
import EventsPage from "../pages/events/EventsPage";

const Router = () => {
  return (
    <Routes>
      {/* Core */}
      <Route path="/" element={<HomePage />} />

      {/* Iteration 1 */}
      <Route path="/insights" element={<DataInsightsPage />} />
      <Route path="/playdate" element={<PlaydatePage />} />
      <Route path="/events" element={<EventsPage />} />

      {/* Iteration 2 */}
      <Route path="/benefits" element={<BenefitsPage />} />
      <Route path="/childcare" element={<ChildcarePlannerPage />} />

      {/* Iteration 3 */}
      <Route path="/wellbeing" element={<WellbeingPage />} />
      <Route path="/transition" element={<TransitionToolPage />} />

      {/* Additional Info */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<DataPrivacyPage />} />

      {/* 404 - NotFound */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
