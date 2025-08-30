// src/pages/events/EventsPage.jsx
import "./EventsPage.css";
import { Helmet } from "react-helmet-async";

export default function EventsPage() {
  return (
    <>
      <Helmet>
        <title>Outing Explorer — OneParent VIC</title>
        <meta 
          name="description" 
          content="Discover family-friendly events and activities happening near you with OneParent VIC." 
        />
      </Helmet>

      <div className="events-page">
        <h2>Outing Explorer</h2>
        <p>Find family-friendly events and activities happening near you.</p>
      </div>
    </>
  );
}
