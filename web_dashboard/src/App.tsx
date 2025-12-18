import { Navigate, Route, Routes } from "react-router-dom";
import SidebarLayout from "./layout/SidebarLayout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import TreatmentLog from "./pages/TreatmentLog";
import FarmerRecords from "./pages/FarmerRecords";
import VetVerification from "./pages/VetVerification";
import Reports from "./pages/Reports";
import FarmerVerification from "./pages/FarmerVerification";
import VetRecords from "./pages/VetRecords";
import AnimalVerification from "./pages/AnimalVerification";




function useAuth() {
  return localStorage.getItem("amu_auth") === "ok";
}

function Protected({ children }: { children: JSX.Element }) {
  const authed = useAuth();
  if (!authed) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        element={
          <Protected>
            <SidebarLayout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/treatments" element={<TreatmentLog />} />
        <Route path="/farmers" element={<FarmerRecords />} />
        <Route path="/vet-verification" element={<VetVerification />} />
        <Route path="/farmer-verification" element={<FarmerVerification />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/vet-records" element={<VetRecords />} />
        <Route path="/animal-verification" element={<AnimalVerification />} />


      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
