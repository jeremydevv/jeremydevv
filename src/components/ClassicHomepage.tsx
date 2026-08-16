const SITE_DESCRIPTION =
  "Software engineer building fast, reliable products across cloud, web, and applied AI systems.";

export function ClassicHomepage() {
  return (
    <main className="classic-homepage">
      <h1>Jeremy Mathew</h1>
      <p className="lede">{SITE_DESCRIPTION}</p>
      <nav className="links" aria-label="Primary links">
        <a href="https://github.com/jeremydevv">GitHub</a>
        <a href="mailto:jeremymathewgithub@outlook.com">Email</a>
        <a href="/status">Status</a>
      </nav>
    </main>
  );
}
