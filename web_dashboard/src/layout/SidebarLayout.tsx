import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileBarChart,
  LogOut,
  ShieldCheck,
  Settings,
  HelpCircle,
  UserCheck,
  Tag   
} from "lucide-react";

// Use the layout CSS, not FarmerRecords
import "../styles/SidebarLayout.css";

export default function SidebarLayout() {
  const navigate = useNavigate();

  // Logout handler
  const logout = () => {
    localStorage.removeItem("amu_auth");
    navigate("/");
  };

  return (
    <div className="layout-container">
      {/* ✅ WHITE SIDEBAR WITH GREEN ACCENTS */}
      <aside className="sidebar">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <ShieldCheck size={28} strokeWidth={2.5} />
          </div>
          <div className="logo-text">
            <h2 className="app-title">AMU Authority</h2>
            <p className="logo-subtitle">Monitoring Portal</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="menu">
          {/* MENU Section */}
          <div className="menu-section">
            <div className="menu-label">MENU</div>
            <NavLink to="/dashboard" className="menu-item">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/treatments" className="menu-item">
              <ClipboardList size={20} />
              <span>Treatment Log</span>
            </NavLink>

            <NavLink to="/farmers" className="menu-item">
              <Users size={20} />
              <span>Farmer Records</span>
            </NavLink>

            <NavLink to="/vet-records" className="menu-item">
              <UserCheck size={20} />
              <span>Vet Records</span>
            </NavLink>

            <NavLink to="/reports" className="menu-item">
              <FileBarChart size={20} />
              <span>Reports</span>
            </NavLink>
          </div>

          {/* VERIFICATION Section */}
          <div className="menu-section">
            <div className="menu-label">VERIFICATION</div>
            <NavLink to="/vet-verification" className="menu-item">
              <ShieldCheck size={20} />
              <span>Vet Verification</span>
            </NavLink>

            <NavLink to="/farmer-verification" className="menu-item">
              <UserCheck size={20} />
              <span>Farmer Verification</span>
            </NavLink>

            {/* ✅ MOVED INSIDE THE VERIFICATION SECTION */}
            <NavLink to="/animal-verification" className="menu-item">
              <Tag size={20} />
              <span>Animal Verification</span>
            </NavLink>
          </div>

          {/* TOOLS Section */}
          <div className="menu-section">
            <div className="menu-label">TOOLS</div>
            <button className="menu-item" onClick={() => alert("Settings coming soon!")}>
              <Settings size={20} />
              <span>Settings</span>
            </button>

            <button className="menu-item" onClick={() => alert("Help center coming soon!")}>
              <HelpCircle size={20} />
              <span>Help</span>
            </button>
          </div>
        </nav>

        {/* Logout Button */}
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
