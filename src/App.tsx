import { ClassicHomepage } from "./components/ClassicHomepage";
import { TerminalHomepage } from "./components/TerminalHomepage";
import { isFastFlagEnabled, terminalPortfolioHomepageFlag } from "./fast-flags";

interface AppProps {
  url?: URL;
}

export function App({ url = new URL(window.location.href) }: AppProps) {
  return isFastFlagEnabled(url, terminalPortfolioHomepageFlag) ? (
    // fast-flag-use: expandedPortfolio
    <TerminalHomepage
      expanded={isFastFlagEnabled(url, "expandedPortfolio")}
      // fast-flag-use: collapsiblePortfolio
      collapsible={isFastFlagEnabled(url, "collapsiblePortfolio")}
      // fast-flag-use: terminalTextZoom
      textZoomEnabled={isFastFlagEnabled(url, "terminalTextZoom")}
    />
  ) : (
    <ClassicHomepage />
  );
}
