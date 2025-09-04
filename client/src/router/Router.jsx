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

// main app router
const Router = () => {
  return (
    <Routes>
      {/* home page */}
      <Route path="/" element={<HomePage />} />
      {/* playdate planner */}
      <Route path="/playdate" element={<PlaydatePage />} />
      {/* events directory */}
      <Route path="/events" element={<EventsPage />} />
      {/* benefits entitlement */}
      <Route path="/benefits" element={<BenefitsPage />} />
      {/* childcare cost planner */}
      <Route path="/childcare" element={<ChildcarePlannerPage />} />
      {/* wellbeing resources */}
      <Route path="/wellbeing" element={<WellbeingPage />} />
      {/* transition tool */}
      <Route path="/transition" element={<TransitionToolPage />} />
      {/* about page */}
      <Route path="/about" element={<AboutPage />} />
      {/* data privacy info */}
      <Route path="/data-privacy" element={<DataPrivacyPage />} />
      {/* api health check */}
      <Route path="/api/health-check" element={<ApitestPage />} />
      {/* not found page for unmatched routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Router;
