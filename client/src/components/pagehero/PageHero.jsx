// src/components/pagehero/PageHero.jsx

import "./PageHero.css";

export default function PageHero({ title, subtitle }) {
  return (
    <>
      <section className="page-hero">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </section>
    </>
  );
}
