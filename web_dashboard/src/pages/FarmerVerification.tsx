import { useState } from "react";
import { Search, FileText, CheckCircle, XCircle, Eye, Download, MapPin, Phone, Mail } from "lucide-react";
import "../styles/FarmerVerification.css";

export default function FarmerVerification() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample pending farmer data
  const pendingFarmers = [
    {
      id: "FRM-T001",
      name: "Rajesh Patil",
      farmName: "Green Valley Farm",
      email: "rajesh.patil@gmail.com",
      phone: "+91 98765 43210",
      location: "Hadapsar, Pune",
      district: "Pune",
      status: "Pending",
      appliedDate: "12/12/2025",
      farmSize: "5 Acres",
      animalCount: "25 Cattle",
      farmType: "Dairy",
      documents: [
        { name: "Aadhaar Card", status: "Uploaded", size: "420 KB" },
        { name: "Land Ownership Document", status: "Uploaded", size: "1.8 MB" },
        { name: "Farm Registration Certificate", status: "Uploaded", size: "950 KB" },
        { name: "Bank Account Details", status: "Uploaded", size: "320 KB" }
      ]
    }
  ];

  const verifiedFarmers = [
    {
      id: "F001",
      name: "Suresh Kale",
      farmName: "Sunrise Dairy Farm",
      email: "suresh.kale@gmail.com",
      phone: "+91 98761 22334",
      location: "Kharadi, Pune",
      district: "Pune",
      verifiedDate: "05/12/2025",
      status: "Verified"
    }
  ];

  const handleApprove = (farmer: any) => {
    alert(`✅ Approved: ${farmer.name}`);
    setShowDetailModal(false);
  };

  const handleReject = (farmer: any) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      alert(`❌ Rejected: ${farmer.name}\nReason: ${reason}`);
      setShowDetailModal(false);
    }
  };

  const openDetailModal = (farmer: any) => {
    setSelectedFarmer(farmer);
    setShowDetailModal(true);
  };

  return (
    <div className="farmer-verification-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Farmer Verification</h1>
          <p className="page-subtitle">Verify and approve farmer registrations</p>
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
          Verified Farmers
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by name, farm name, phone or ID..." />
        </div>
      </div>

      {/* Pending Approvals Table */}
      {activeTab === "pending" && (
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th>FARMER</th>
                <th>FARM NAME</th>
                <th>CONTACT</th>
                <th>LOCATION</th>
                <th>FARM DETAILS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pendingFarmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td>
                    <div className="farmer-info">
                      <strong>{farmer.name}</strong>
                      <span className="farmer-id">{farmer.id}</span>
                    </div>
                  </td>
                  <td>{farmer.farmName}</td>
                  <td>
                    <div className="contact-info">
                      <div>{farmer.email}</div>
                      <div className="phone-text">{farmer.phone}</div>
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      <MapPin size={14} /> {farmer.location}
                      <span className="district-text">{farmer.district}</span>
                    </div>
                  </td>
                  <td>
                    <div className="farm-details">
                      <span className="farm-badge">{farmer.farmType}</span>
                      <div className="farm-stats">{farmer.farmSize} • {farmer.animalCount}</div>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge pending">{farmer.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-review"
                        onClick={() => openDetailModal(farmer)}
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

      {/* Verified Farmers Table */}
      {activeTab === "verified" && (
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th>FARMER</th>
                <th>FARM NAME</th>
                <th>CONTACT</th>
                <th>LOCATION</th>
                <th>VERIFIED DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {verifiedFarmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td>
                    <div className="farmer-info">
                      <strong>{farmer.name}</strong>
                      <span className="farmer-id">{farmer.id}</span>
                    </div>
                  </td>
                  <td>{farmer.farmName}</td>
                  <td>
                    <div className="contact-info">
                      <div>{farmer.email}</div>
                      <div className="phone-text">{farmer.phone}</div>
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      <MapPin size={14} /> {farmer.location}
                      <span className="district-text">{farmer.district}</span>
                    </div>
                  </td>
                  <td>{farmer.verifiedDate}</td>
                  <td>
                    <span className="status-badge verified">{farmer.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedFarmer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Farmer Verification Review</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Farmer Info Section */}
              <div className="info-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{selectedFarmer.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Farmer ID</label>
                    <p>{selectedFarmer.id}</p>
                  </div>
                  <div className="info-item">
                    <label>Farm Name</label>
                    <p>{selectedFarmer.farmName}</p>
                  </div>
                  <div className="info-item">
                    <label>Farm Type</label>
                    <p>{selectedFarmer.farmType}</p>
                  </div>
                  <div className="info-item">
                    <label><Mail size={14} /> Email</label>
                    <p>{selectedFarmer.email}</p>
                  </div>
                  <div className="info-item">
                    <label><Phone size={14} /> Phone</label>
                    <p>{selectedFarmer.phone}</p>
                  </div>
                  <div className="info-item">
                    <label><MapPin size={14} /> Location</label>
                    <p>{selectedFarmer.location}</p>
                  </div>
                  <div className="info-item">
                    <label>District</label>
                    <p>{selectedFarmer.district}</p>
                  </div>
                  <div className="info-item">
                    <label>Farm Size</label>
                    <p>{selectedFarmer.farmSize}</p>
                  </div>
                  <div className="info-item">
                    <label>Animal Count</label>
                    <p>{selectedFarmer.animalCount}</p>
                  </div>
                  <div className="info-item">
                    <label>Applied Date</label>
                    <p>{selectedFarmer.appliedDate}</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="info-section">
                <h3>Uploaded Documents</h3>
                <div className="documents-list">
                  {selectedFarmer.documents.map((doc: any, idx: number) => (
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

            {/* Action Buttons */}
            <div className="modal-footer">
              <button
                className="btn-reject-main"
                onClick={() => handleReject(selectedFarmer)}
              >
                <XCircle size={18} /> Reject Application
              </button>
              <button
                className="btn-approve-main"
                onClick={() => handleApprove(selectedFarmer)}
              >
                <CheckCircle size={18} /> Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
