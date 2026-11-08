const SITE_DESCRIPTION =
  "High school junior and Hillsborough College dual enrollment student building cloud infrastructure, websites, and tailored software through Atripix.";

export function ClassicHomepage() {
  return (
    <main className="classic-homepage">
      <h1>Jeremy Mathew</h1>
      <p className="lede">{SITE_DESCRIPTION}</p>
      <nav className="links" aria-label="Primary links">
        <a href="https://github.com/jeremydevv">GitHub</a>
        <a href="mailto:me@jeremy.md">Email</a>
        <a href="/assets/Jeremy-Mathew-Resume.pdf">Résumé</a>
        <a href="/status">Status</a>
      </nav>
    </main>
  );
}
