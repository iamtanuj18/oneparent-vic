import "./PlaydatePage.css";
import { Helmet } from "react-helmet-async";
import PlayDateWizard from "../../components/playdate/PlayDateWizard";
import howitworks from "../../assets/howitworks.svg";

export default function PlaydatePage() {
  return (
    <>
      <Helmet>
        <title>PlayDate Planner — OneParent VIC</title>
        <meta
          name="description"
          content="PlayDate is your smart AI-powered activity planner. In just 2 minutes, get 3 curated ideas to enjoy quality time with your kids—without the stress of endless searching."
        />
      </Helmet>

      {/* hero */}
      <section className="playdate-hero animate-fadeIn">
        <div className="container">
          <div className="row align-items-center g-5">
            {/* left copy */}
            <div className="col-lg-7 animate-slideUp">
              <h1 className="playdate-title">
                PlayDate
                <span className="d-block playdate-subtitle">your AI-powered activity planner</span>
              </h1>

              <p className="playdate-body">
                PlayDate is the simplest tool to help when you&apos;re out of ideas and too exhausted to
                plan. With a short, interactive 2-minute journey, we generate 3 curated activities
                tailored for you and your kids. No more juggling dozens of tabs or stressing about
                what to do — just quick, doable fun.
              </p>

              <a href="#playdate-wizard" className="btn btn-secondary playdate-cta animate-bounce">
                Try Now
              </a>
            </div>

            {/* right visual */}
            <div className="col-lg-5 animate-slideUp animate-delay-200">
              <div className="playdate-visual">
                <div className="text-center playdate-visual-label">How it works</div>
                <p className="playdate-visual-sub">
                  Enter a few quick details — time, energy, budget, place etc. — and we&apos;ll generate
                  3 curated ideas for your family.
                </p>
                <img src={howitworks} alt="How it works" className="playdate-visual-svg animate-float" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* wizard */}
      <section id="playdate-wizard" className="playdate-wizard animate-fadeIn animate-delay-400">
        <div className="container">
          <PlayDateWizard />
        </div>
      </section>
    </>
  );
}
