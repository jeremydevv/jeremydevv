import { TerminalWindow } from "./TerminalWindow";

export function TerminalHomepage() {
  return (
    <main className="desktop" aria-label="Movable desktop portfolio">
      <TerminalWindow>
        <span className="prompt">jeremy@portfolio ~ %</span>{" "}
        <span className="command">help</span>{"\n"}
        <span className="output">
          {`available commands:
  whoami      show identity
  ls focus    show areas of focus
  open links  show github, email, and status`}
        </span>
        {"\n\n"}
        <span className="prompt">jeremy@portfolio ~ %</span>
        <span className="cursor" aria-hidden="true" />
      </TerminalWindow>
    </main>
  );
}
