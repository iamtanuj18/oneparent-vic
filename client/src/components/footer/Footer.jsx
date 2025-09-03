import "./Footer.css";
import logoUrl from "../../assets/Logo.svg";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer bg-light border-top mt-auto">
      <div className="container">
        <div className="row py-5">
          
          {/* Logo & Description */}
          <div className="col-lg-4 col-md-12 mb-4 mb-lg-0">
            <div className="d-flex align-items-start">
              <img src={logoUrl} alt="OneParent VIC Logo" width={52} height={52} className="me-3" />
              <div>
                <h4 className="brand-title mb-2">
                  OneParent <span className="brand-accent">VIC</span>
                </h4>
                <p className="footer-desc mb-0">
                  Empowering single-parent families across Victoria by providing essential resources, 
                  community connections, and support to navigate parenting challenges with confidence.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="col-lg-8 col-md-12">
            <div className="row">
              
              {/* Events & Activities */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading">Events & Activities</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/playdate" className="footer-link">Playdate Planner</Link></li>
                  <li><Link to="/events" className="footer-link">Find Events</Link></li>
                </ul>
              </div>

              {/* Support Services */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading">Support</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/benefits" className="footer-link">Benefits Entitlement</Link></li>
                  <li><Link to="/childcare" className="footer-link">Childcare Cost</Link></li>
                  <li><Link to="/wellbeing" className="footer-link">Wellbeing</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading">Resources</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/transition" className="footer-link">Single Parent&apos;s Transition Journey</Link></li>
                  <li><Link to="/about" className="footer-link">About Us</Link></li>
                </ul>
              </div>

              {/* Data Privacy */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading">Data Privacy</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/data-privacy" className="footer-link">Learn More</Link></li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-top pt-4 pb-3">
          <div className="row align-items-center">
            <div className="col-md-8">
              <p className="copyright-text mb-0">
                {/* © {new Date().getFullYear()} OneParent VIC. All rights reserved.  */} OneParent VIC. 
                Supporting single parents across Victoria.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-2 mt-md-0">
              <small className="text-muted">Made with ❤️ for Victorian families by Team GitGood</small>
            </div>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
