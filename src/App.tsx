import { useState } from "react";
import CaretakerApp from "./CaretakerApp";
import PatientApp from "./patient/App";
import LoginPage from "./auth/LoginPage";

type Role = "patient" | "caretaker" | null;

export default function App() {
  const [role, setRole] = useState<Role>(null);

  if (role === "patient") {
    return <PatientApp />;
  }

  if (role === "caretaker") {
    return <CaretakerApp />;
  }

  return <LoginPage onLogin={setRole} />;
}