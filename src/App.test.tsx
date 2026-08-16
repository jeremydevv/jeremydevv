import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the terminal homepage by default", () => {
    render(<App url={new URL("https://jeremy.md/")} />);

    expect(
      screen.getByRole("main", { name: "Movable desktop portfolio" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("available commands:", { exact: false })
    ).toBeInTheDocument();
  });

  it("renders the classic fallback when the flag is disabled", () => {
    render(
      <App
        url={
          new URL(
            "https://jeremy.md/?ff_terminalPortfolioHomepage=off"
          )
        }
      />
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
