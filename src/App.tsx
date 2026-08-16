import { ClassicHomepage } from "./components/ClassicHomepage";
import { TerminalHomepage } from "./components/TerminalHomepage";
import { isFastFlagEnabled } from "./fast-flags";

interface AppProps {
  url?: URL;
}

export function App({ url = new URL(window.location.href) }: AppProps) {
  return isFastFlagEnabled(url, "terminalPortfolioHomepage") ? (
    <TerminalHomepage />
  ) : (
    <ClassicHomepage />
  );
}
