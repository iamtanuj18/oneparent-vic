// src/pages/about/AboutPage.jsx
import "./AboutPage.css";
import { Helmet } from "react-helmet-async";

// Import team member images
import tanujImg from '../../assets/tanuj.png';
import mingImg from '../../assets/ming.png';
import nirmalImg from '../../assets/nirmal.png';
import yuchenImg from '../../assets/yuchen.png';

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Tanuj Tanuj",
      course: "Master of Information Technology",
      image: tanujImg
    },
    {
      name: "Ming Kai",
      course: "Master of Data Science",
      image: mingImg
    },
    {
      name: "Nirmal Kumar Kumaresan",
      course: "Master of Data Science",
      image: nirmalImg
    },
    {
      name: "Yuchen Chi",
      course: "Master of Information Technology",
      image: yuchenImg
    }
  ];

  return (
    <>
      <Helmet>
        <title>About — OneParent VIC</title>
        <meta name="description" content="Learn about OneParent VIC - your parenting partner helping single-parent families turn pressure into clarity." />
      </Helmet>

      <div className="about-page">
        <div className="container">
          {/* Hero Section */}
          <section className="about-hero">
            <h1 className="about-title">OneParent VIC</h1>
            <p className="about-subtitle">Your parenting partner helping you turn pressure into clarity for single-parent families</p>
          </section>

          {/* What is OneParent VIC */}
          <section className="about-section">
            <h2 className="section-title">What is OneParent VIC?</h2>
            <p className="section-text">
              OneParent VIC is a practical platform that turns the everyday pressure of raising children alone into clear next steps. About one in six Australian families is led by a single parent, many facing tight budgets, childcare struggles, patchy services, and periods of isolation.
            </p>
            <p className="section-text">
              Our platform supports <strong>social inclusion (SDG 10)</strong> by making daily decisions around money, care, wellbeing, and community easier to manage. Right now, we are starting in Victoria but the idea is designed to grow nationally.
            </p>
          </section>

          {/* Problem Statement */}
          <section className="about-section">
            <h2 className="section-title">Why OneParent VIC?</h2>
            <p className="section-text">
              Around <strong>16% of Australian families</strong> with children are led by a single parent. They often face greater financial stress, housing pressure, heavy time demands, and mental health challenges compared to two-parent families. More than one in three children in these households live in poverty.
            </p>
            <p className="section-text">
              Childcare and support are often costly, hard to find, or confusing. With services scattered across different places, many parents don&apos;t get the clear guidance they need—leading to stress, isolation, and uncertainty.
            </p>
          </section>

          {/* Our Solution */}
          <section className="about-section">
            <h2 className="section-title">Our Solution</h2>
            <p className="section-text">
              <strong>How might we</strong> make support more inclusive, simple, and practical—so single parents can manage money, plan childcare, check wellbeing, and find local help with confidence?
            </p>
            <div className="features-grid">
              <div className="feature-item">
                <h4>Data Insights</h4>
                <p>Shows the bigger picture of single-parent families</p>
              </div>
              <div className="feature-item">
                <h4>Smart Planning</h4>
                <p>PlayDate & activity explorer for family time</p>
              </div>
              <div className="feature-item">
                <h4>Benefits Guide</h4>
                <p>Simplified payments and entitlements in plain English</p>
              </div>
              <div className="feature-item">
                <h4>Cost Planning</h4>
                <p>Childcare cost breakdown and savings tips</p>
              </div>
              <div className="feature-item">
                <h4>Wellbeing Support</h4>
                <p>Quick check-ins connecting to trusted support</p>
              </div>
              <div className="feature-item">
                <h4>Journey Guide</h4>
                <p>Guidance for the first five years of parenting alone</p>
              </div>
            </div>
          </section>

          {/* What We Aim For */}
          <section className="about-section">
            <h2 className="section-title">What We Aim For</h2>
            <p className="section-text">
              Together, these features make life a little clearer by easing six common struggles: <strong>financial stress, childcare complexity, hidden support, isolation, dips in wellbeing, and uncertainty about the future.</strong>
            </p>
            <p className="section-text highlight">
              The aim is simple — <strong>less stress, more confidence.</strong>
            </p>
          </section>

          {/* Team Section */}
          <section className="team-section">
            <h2 className="section-title text-center">Meet Team GitGood</h2>
            <p className="team-intro">
                A multidisciplinary team of Monash Master&apos;s students combining skills to deliver OneParent VIC.
            </p>
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="team-image">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=333333&color=fff&size=200&bold=true`;
                      }}
                    />
                  </div>
                  <h4 className="team-name">{member.name}</h4>
                  <p className="team-course">{member.course}</p>
                  <div className="team-badge">Final Semester</div>
                </div>
              ))}
            </div>
            <div className="team-footer">
              <p><strong>Team:</strong> GitGood (TE09) | <strong>University:</strong> Monash University, Faculty of Information Technology</p>
              <p><strong>Project:</strong> FIT5120 Industrial Experience Studio Project – S2 2025</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
