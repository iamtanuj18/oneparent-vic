import "./Footer.css";
import { Link } from "react-router-dom";


// footer component
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row py-5">
          {/* brand and description */}
          <div className="col-lg-4 col-md-12 mb-4 mb-lg-0">
            <div>
              {/* wordmark links to home but has no underline or highlight */}
              <h4 className="brand-title mb-3">
                <Link to="/" style={{ textDecoration: "none", color: "inherit", pointerEvents: "auto" }}>
                  oneparent <span className="brand-accent">vic</span>
                </Link>
              </h4>
              <p className="footer-desc mb-0">
                empowering single parent families across victoria by providing essential resources, 
                community connections, and support to navigate parenting challenges with confidence.
              </p>
            </div>
          </div>

          {/* footer links */}
          <div className="col-lg-8 col-md-12">
            <div className="row">
              {/* events and activities links */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading mb-3">events & activities</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/playdate" className="footer-link">playdate planner</Link></li>
                  <li><Link to="/events" className="footer-link">find events</Link></li>
                </ul>
              </div>

              {/* support services links */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading mb-3">support</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/benefits" className="footer-link">benefits entitlement</Link></li>
                  <li><Link to="/childcare" className="footer-link">childcare cost</Link></li>
                  <li><Link to="/wellbeing" className="footer-link">wellbeing</Link></li>
                </ul>
              </div>

              {/* resources links */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading mb-3">resources</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/transition" className="footer-link">single parent&apos;s transition journey</Link></li>
                  <li><Link to="/about" className="footer-link">about us</Link></li>
                </ul>
              </div>

              {/* data privacy links */}
              <div className="col-6 col-md-3 mb-4">
                <h6 className="footer-heading mb-3">data privacy</h6>
                <ul className="list-unstyled footer-links">
                  <li><Link to="/data-privacy" className="footer-link">learn more</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* copyright and attribution section */}
        <div className="border-top pt-4 pb-3">
          <div className="row align-items-center">
            <div className="col-md-8">
              <p className="copyright-text mb-0">
                oneparent vic • supporting single parents across victoria.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-2 mt-md-0">
              <small className="attribution-text">
                made with <span className="heart">❤️</span> for victorian families by team <a href="https://eportfolio.monash.edu/view/view.php?t=926064abe60f91f12a8f" target="_blank" rel="noopener noreferrer" style={{ color: "#00b7ff", textDecoration: "none" }}>gitgood</a>
              </small>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
