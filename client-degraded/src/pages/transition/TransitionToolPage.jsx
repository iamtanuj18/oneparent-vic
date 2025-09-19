// src/pages/transition/TransitionToolPage.jsx
import "./TransitionToolPage.css";
import { Helmet } from "react-helmet-async";

export default function TransitionToolPage() {
  return (
    <>
      <Helmet>
        <title>Transition Tool — OneParent VIC</title>
        <meta 
          name="description" 
          content="Explore a realistic 5-year journey as a single parent and get year-by-year guidance." 
        />
      </Helmet>

      <div className="transition-page">
        <h2>Single Parent Transition Tool</h2>
        <p>See a realistic 5-year journey and get year-by-year guidance.</p>
      </div>
    </>
  );
}
