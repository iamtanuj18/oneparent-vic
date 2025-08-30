// src/pages/playdate/PlaydatePage.jsx
import "./PlaydatePage.css";
import { Helmet } from "react-helmet-async";

export default function PlaydatePage() {
  return (
    <>
      <Helmet>
        <title>PlayDate Planner — OneParent VIC</title>
        <meta 
          name="description" 
          content="Get quick, tailored activity ideas for quality time with your child by age and schedule." 
        />
      </Helmet>

      <div className="playdate-page">
        <h2>PlayDate Planner</h2>
        <p>Quick ideas for activities with your child, tailored by age and time.</p>
      </div>
    </>
  );
}
