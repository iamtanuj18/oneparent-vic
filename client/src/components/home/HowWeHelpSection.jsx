import "./HowWeHelpSection.css";

export default function HowWeHelpSection() {
  // Updated feature descriptions to match actual names and write-ups
  const helpAreas = [
    {
      id: "events",
      title: "Find Events",
      subtitle: "A single hub to find family, kids, fun, education, and other activities across Victoria from multiple providers",
      color: "blue"
    },
    {
      id: "activities",
      title: "Playdate Planner", 
      subtitle: "AI-powered planner to help you plan activities with your kids without too many thoughts",
      color: "green"
    },
    {
      id: "benefits",
      title: "Benefits Entitlements",
      subtitle: "Find what benefit entitlements you are eligible for",
      color: "orange"
    },
    {
      id: "childcare",
      title: "Childcare Cost",
      subtitle: "Analyze childcare costs and identify support gaps",
      color: "purple"
    },
    {
      id: "journey",
      title: "Your Journey",
      subtitle: "Track your progress and milestones as a single parent",
      color: "pink"
    },
    {
      id: "wellbeing",
      title: "Wellbeing",
      subtitle: "Access mental health and wellbeing resources",
      color: "teal"
    }
  ];

  return (
    <section className="how-we-help">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-5">
            <h2 className="help-title">How We Help</h2>
            <div className="help-content">
              <p className="help-text">
                OneParent - A smart platform helping single parents across Victoria by providing them with different types of resources to help make their life better and make them feel more inclusive in the community.
              </p>
              <p className="help-text">
                From our AI-powered activity planner to childcare cost analysis, we provide 
                <strong> smart tools</strong> that help you make informed decisions and 
                <strong> save time</strong> while focusing on what matters most - your family.
              </p>
            </div>
          </div>
          
          <div className="col-lg-7">
            {/* this shows the feature bubbles on the right side */}
            <div className="help-bubbles">
              {helpAreas.map((area) => (
                <div key={area.id} className={`help-bubble help-bubble--${area.color}`}>
                  <h3 className="bubble-title">{area.title}</h3>
                  <p className="bubble-subtitle">{area.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
