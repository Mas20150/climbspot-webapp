import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../../../../src/components/user/Register/Register";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// ✅ window.alert verhindern (jsdom unterstützt es nicht)
beforeAll(() => {
  window.alert = jest.fn();
});

// ✅ mock für useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ✅ mockRegister definieren
const mockRegister = jest.fn();

// ✅ RegisterApi-Klasse mocken
jest.mock("../../../../src/api/RegisterApi", () => {
  return {
    RegisterApi: class {
      register = (...args: any[]) => mockRegister(...args);
    },
  };
});

describe("Register-Komponente", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  it("soll Benutzer erfolgreich registrieren und weiterleiten", async () => {
    mockRegister.mockResolvedValueOnce({ username: "TestUser" });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText("Benutzername"), {
      target: { value: "TestUser" },
    });
    fireEvent.change(screen.getByLabelText("E-Mail Adresse"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /registrieren/i }));

    await waitFor(() => {
      // 👇 passt zu dem echten Aufruf (ohne explizites "user"-Argument)
      expect(mockRegister).toHaveBeenCalledWith(
        "TestUser",
        "test@example.com",
        "123456"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/login");
      expect(window.alert).toHaveBeenCalledWith(
        "Willkommen, TestUser! Registrierung erfolgreich."
      );
    });
  });

  it("soll Fehlermeldung anzeigen, wenn Registrierung fehlschlägt", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Registrierung fehlgeschlagen"));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText("Benutzername"), {
      target: { value: "FehlerUser" },
    });
    fireEvent.change(screen.getByLabelText("E-Mail Adresse"), {
      target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "fehlerpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /registrieren/i }));

    expect(await screen.findByText(/registrierung fehlgeschlagen/i)).toBeInTheDocument();
  });
});
