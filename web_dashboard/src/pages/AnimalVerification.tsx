import { useState } from "react";
import { Search, FileText, CheckCircle, XCircle, Eye, Download, MapPin, Phone, Mail, BarChart3, TrendingUp, Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../styles/AnimalVerification.css";

export default function AnimalVerification() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample pending animal data
  const pendingAnimals = [
    {
      id: "ANI-T001",
      animalTag: "MH-DAI-2025-1234",
      animalType: "Cattle",
      breed: "Holstein Friesian",
      age: "3 years",
      owner: "Rajesh Patil",
      farmerId: "F001",
      farmName: "Green Valley Farm",
      phone: "+91 98765 43210",
      location: "Hadapsar, Pune",
      district: "Pune",
      status: "Pending",
      appliedDate: "13/12/2025",
      healthStatus: "Healthy",
      vaccinationStatus: "Up to date",
      documents: [
        { name: "Animal Health Certificate", status: "Uploaded", size: "850 KB" },
        { name: "Vaccination Records", status: "Uploaded", size: "1.2 MB" },
        { name: "Animal Photos", status: "Uploaded", size: "2.4 MB" },
        { name: "Purchase Invoice", status: "Uploaded", size: "620 KB" }
      ]
    }
  ];

  const verifiedAnimals = [
    {
      id: "A001",
      animalTag: "MH-DAI-2024-5678",
      animalType: "Cattle",
      breed: "Jersey",
      owner: "Suresh Kale",
      farmerId: "F002",
      farmName: "Sunrise Dairy Farm",
      location: "Kharadi, Pune",
      verifiedDate: "10/12/2025",
      status: "Verified"
    }
  ];

  // Chart Data
  const animalDistributionData = [
    { name: "Cattle", value: 117, color: "#f97316" },
    { name: "Buffalo", value: 23, color: "#3b82f6" },
    { name: "Goat", value: 16, color: "#10b981" }
  ];

  const monthlyRegistrationData = [
    { month: "Jul", registrations: 12 },
    { month: "Aug", registrations: 19 },
    { month: "Sep", registrations: 15 },
    { month: "Oct", registrations: 22 },
    { month: "Nov", registrations: 28 },
    { month: "Dec", registrations: 35 }
  ];

  const healthStatusData = [
    { status: "Healthy", count: 142 },
    { status: "Under Treatment", count: 14 }
  ];

  const breedDistributionData = [
    { breed: "Holstein Friesian", count: 45 },
    { breed: "Jersey", count: 38 },
    { breed: "Gir", count: 34 },
    { breed: "Murrah Buffalo", count: 23 },
    { breed: "Local Goat", count: 16 }
  ];

  const handleApprove = (animal: any) => {
    alert(`✅ Approved: Animal Tag ${animal.animalTag}`);
    setShowDetailModal(false);
  };

  const handleReject = (animal: any) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      alert(`❌ Rejected: Animal Tag ${animal.animalTag}\nReason: ${reason}`);
      setShowDetailModal(false);
    }
  };

  const openDetailModal = (animal: any) => {
    setSelectedAnimal(animal);
    setShowDetailModal(true);
  };

  return (
    <div className="animal-verification-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Animal Verification</h1>
          <p className="page-subtitle">Verify and register animals in the system</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="verification-tabs">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <FileText size={18} />
          Pending Approvals
        </button>
        <button
          className={`tab-btn ${activeTab === "verified" ? "active" : ""}`}
          onClick={() => setActiveTab("verified")}
        >
          <CheckCircle size={18} />
          Verified Animals
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {/* Search Bar */}
      {(activeTab === "pending" || activeTab === "verified") && (
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search by animal tag, owner name, or farm..." />
          </div>
        </div>
      )}

      {/* Pending Approvals Table */}
      {activeTab === "pending" && (
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th>ANIMAL TAG</th>
                <th>TYPE & BREED</th>
                <th>OWNER</th>
                <th>FARM NAME</th>
                <th>LOCATION</th>
                <th>HEALTH STATUS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pendingAnimals.map((animal) => (
                <tr key={animal.id}>
                  <td>
                    <div className="animal-tag-info">
                      <strong>{animal.animalTag}</strong>
                      <span className="animal-id">{animal.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="type-breed">
                      <span className="type-badge">{animal.animalType}</span>
                      <span className="breed-text">{animal.breed}</span>
                    </div>
                  </td>
                  <td>
                    <div className="owner-info">
                      <strong>{animal.owner}</strong>
                      <span className="farmer-id-text">{animal.farmerId}</span>
                    </div>
                  </td>
                  <td>{animal.farmName}</td>
                  <td>
                    <div className="location-info">
                      <MapPin size={14} /> {animal.location}
                      <span className="district-text">{animal.district}</span>
                    </div>
                  </td>
                  <td>
                    <span className="health-badge healthy">{animal.healthStatus}</span>
                  </td>
                  <td>
                    <span className="status-badge pending">{animal.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-review"
                        onClick={() => openDetailModal(animal)}
                      >
                        <Eye size={16} /> Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verified Animals Table */}
      {activeTab === "verified" && (
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th>ANIMAL TAG</th>
                <th>TYPE & BREED</th>
                <th>OWNER</th>
                <th>FARM NAME</th>
                <th>LOCATION</th>
                <th>VERIFIED DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {verifiedAnimals.map((animal) => (
                <tr key={animal.id}>
                  <td>
                    <div className="animal-tag-info">
                      <strong>{animal.animalTag}</strong>
                      <span className="animal-id">{animal.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="type-breed">
                      <span className="type-badge">{animal.animalType}</span>
                      <span className="breed-text">{animal.breed}</span>
                    </div>
                  </td>
                  <td>
                    <div className="owner-info">
                      <strong>{animal.owner}</strong>
                      <span className="farmer-id-text">{animal.farmerId}</span>
                    </div>
                  </td>
                  <td>{animal.farmName}</td>
                  <td>
                    <div className="location-info">
                      <MapPin size={14} /> {animal.location}
                    </div>
                  </td>
                  <td>{animal.verifiedDate}</td>
                  <td>
                    <span className="status-badge verified">{animal.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Analytics Tab with Charts */}
      {activeTab === "analytics" && (
        <div className="analytics-container">
          {/* Stats Cards */}
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="card-header">
                <h3>Total Animals Registered</h3>
                <BarChart3 size={24} className="card-icon" />
              </div>
              <p className="card-value">156</p>
              <p className="card-change positive">+12% from last month</p>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <h3>Pending Approvals</h3>
                <FileText size={24} className="card-icon" />
              </div>
              <p className="card-value">8</p>
              <p className="card-change neutral">Awaiting review</p>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <h3>Healthy Animals</h3>
                <CheckCircle size={24} className="card-icon" />
              </div>
              <p className="card-value">142</p>
              <p className="card-change positive">91% health rate</p>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <h3>Under Treatment</h3>
                <Activity size={24} className="card-icon" />
              </div>
              <p className="card-value">14</p>
              <p className="card-change negative">9% of total</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Animal Distribution Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">
                <BarChart3 size={20} />
                Animal Distribution by Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={animalDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {animalDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Registration Trend Line Chart */}
            <div className="chart-card">
              <h3 className="chart-title">
                <TrendingUp size={20} />
                Monthly Registration Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRegistrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ fill: "#f97316", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Breed Distribution Bar Chart */}
            <div className="chart-card chart-card-wide">
              <h3 className="chart-title">
                <BarChart3 size={20} />
                Top Breeds Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breedDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="breed" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal (keeping existing modal code) */}
      {showDetailModal && selectedAnimal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Animal Verification Review</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h3>Animal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Animal Tag</label>
                    <p>{selectedAnimal.animalTag}</p>
                  </div>
                  <div className="info-item">
                    <label>Animal ID</label>
                    <p>{selectedAnimal.id}</p>
                  </div>
                  <div className="info-item">
                    <label>Animal Type</label>
                    <p>{selectedAnimal.animalType}</p>
                  </div>
                  <div className="info-item">
                    <label>Breed</label>
                    <p>{selectedAnimal.breed}</p>
                  </div>
                  <div className="info-item">
                    <label>Age</label>
                    <p>{selectedAnimal.age}</p>
                  </div>
                  <div className="info-item">
                    <label>Health Status</label>
                    <p>{selectedAnimal.healthStatus}</p>
                  </div>
                  <div className="info-item">
                    <label>Vaccination Status</label>
                    <p>{selectedAnimal.vaccinationStatus}</p>
                  </div>
                  <div className="info-item">
                    <label>Applied Date</label>
                    <p>{selectedAnimal.appliedDate}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Owner Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Owner Name</label>
                    <p>{selectedAnimal.owner}</p>
                  </div>
                  <div className="info-item">
                    <label>Farmer ID</label>
                    <p>{selectedAnimal.farmerId}</p>
                  </div>
                  <div className="info-item">
                    <label>Farm Name</label>
                    <p>{selectedAnimal.farmName}</p>
                  </div>
                  <div className="info-item">
                    <label><Phone size={14} /> Phone</label>
                    <p>{selectedAnimal.phone}</p>
                  </div>
                  <div className="info-item">
                    <label><MapPin size={14} /> Location</label>
                    <p>{selectedAnimal.location}</p>
                  </div>
                  <div className="info-item">
                    <label>District</label>
                    <p>{selectedAnimal.district}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Uploaded Documents</h3>
                <div className="documents-list">
                  {selectedAnimal.documents.map((doc: any, idx: number) => (
                    <div key={idx} className="document-item">
                      <div className="doc-info">
                        <FileText size={20} />
                        <div>
                          <strong>{doc.name}</strong>
                          <span className="doc-size">{doc.size}</span>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <span className="doc-status-badge">{doc.status}</span>
                        <button className="btn-download">
                          <Download size={16} /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-reject-main"
                onClick={() => handleReject(selectedAnimal)}
              >
                <XCircle size={18} /> Reject Application
              </button>
              <button
                className="btn-approve-main"
                onClick={() => handleApprove(selectedAnimal)}
              >
                <CheckCircle size={18} /> Approve & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
