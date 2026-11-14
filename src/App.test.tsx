import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("shows expanded experience and keeps its previous introduction as a fallback", () => {
    const { unmount } = render(<App url={new URL("https://jeremy.md/")} />);
    expect(screen.getByRole("heading", { name: "[ experience ]" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "[ education ]" })).toBeInTheDocument();
    unmount();
    render(<App url={new URL("https://jeremy.md/?ff_expandedPortfolio=off")} />);
    expect(screen.queryByRole("heading", { name: "[ skills ]" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand education" })).toBeInTheDocument();
  });
  it("renders the terminal homepage by default", () => {
    render(<App url={new URL("https://jeremy.md/")} />);

    expect(
      screen.getByRole("main", { name: "Movable desktop portfolio" })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Terminal command" })).toBeInTheDocument();
    expect(screen.queryByText("available commands:", { exact: false })).not.toBeInTheDocument();
  });

  it.each([
    "https://jeremy.md/?ff_terminalPortfolioHomepage=off",
    "https://jeremy.md/?ff_terminalPortfolioHomepageV2=off"
  ])("renders the classic fallback when the flag is disabled by %s", (href) => {
    render(
      <App url={new URL(href)} />
    );

    expect(
      screen.getByRole("heading", { name: "Jeremy Mathew" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/jeremydevv"
    );
    expect(screen.getByRole("link", { name: "Status" })).toHaveAttribute(
      "href",
      "/status"
    );
  });
});
