import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App, AppProviders } from "./App";

describe("App shell render", () => {
  it("renders admin layout at /admin/parameters", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/admin/parameters"]}>
          <App />
        </MemoryRouter>
      </AppProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("Администрирование")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("redirects from / to admin content", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AppProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("Service Panel Web UI")).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
