// src/router/Router.jsx

import { Routes, Route } from "react-router-dom";

// Home
import HomePage from "../pages/HomePage";

// PlayDate & Events
import PlaydatePage from "../pages/playdate/PlaydatePage";
import EventsPage from "../pages/events/EventsPage";

// Benefits Entitlement & Childcare Cost
import BenefitsPage from "../pages/benefits/BenefitsPage";
import ChildcarePlannerPage from "../pages/childcare/ChildcarePlannerPage";

// Wellbeing & Transition
import WellbeingPage from "../pages/wellbeing/WellbeingPage";
import TransitionToolPage from "../pages/transition/TransitionToolPage";

// About & Policies
import AboutPage from "../pages/about/AboutPage";
import DataPrivacyPage from "../pages/dataprivacy/DataPrivacyPage";

//Other 
import ApitestPage from "../pages/apitest/ApitestPage";

// Not Found
import NotFoundPage from "../pages/notfound/NotFoundPage";

const Router = () => {
  return (
    <Routes>
      {/* Iteration 1 */}
      <Route path="/" element={<HomePage />} />
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
      <Route path="/data-privacy" element={<DataPrivacyPage />} />

      {/* Server Health*/}
      <Route path="/api/health-check" element={<ApitestPage />} />

      {/* 404 - NotFound */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
