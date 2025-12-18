import { useState } from "react";
import { Search, FileText, CheckCircle, XCircle, Eye, Download, MapPin, Phone, Mail } from "lucide-react";
import "../styles/VetVerification.css";

export default function VetVerification() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample pending vet data
  const pendingVets = [
    {
      id: "VET-T001",
      name: "Dr. Ananya Kulkarni",
      license: "MH-VET-892133",
      clinic: "VetCare Pune",
      email: "ananya.kulkarni@vetcare.com",
      phone: "+91 98200 11223",
      location: "Shivajinagar, Pune",
      district: "Pune",
      status: "Pending",
      appliedDate: "10/12/2025",
      specialization: "Large Animals",
      experience: "8 years",
      documents: [
        { name: "Veterinary Degree Certificate", status: "Uploaded", size: "1.2 MB" },
        { name: "State Council Registration", status: "Uploaded", size: "850 KB" },
        { name: "Clinic License", status: "Uploaded", size: "650 KB" },
        { name: "Identity Proof (Aadhaar)", status: "Uploaded", size: "420 KB" }
      ]
    }
  ];

  const handleApprove = (vet: any) => {
    alert(`✅ Approved: ${vet.name}`);
    setShowDetailModal(false);
  };

  const handleReject = (vet: any) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      alert(`❌ Rejected: ${vet.name}\nReason: ${reason}`);
      setShowDetailModal(false);
    }
  };

  const openDetailModal = (vet: any) => {
    setSelectedVet(vet);
    setShowDetailModal(true);
  };

  return (
    <div className="vet-verification-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vet Verification</h1>
          <p className="page-subtitle">Review and verify veterinarian registrations</p>
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
          Verified Vets
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by name, license or ID..." />
        </div>
      </div>

      {/* Pending Approvals Table */}
      {activeTab === "pending" && (
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th>VET</th>
                <th>LICENSE</th>
                <th>CLINIC</th>
                <th>CONTACT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pendingVets.map((vet) => (
                <tr key={vet.id}>
                  <td>
                    <div className="vet-info">
                      <strong>{vet.name}</strong>
                      <span className="vet-id">{vet.id}</span>
                    </div>
                  </td>
                  <td>{vet.license}</td>
                  <td>{vet.clinic}</td>
                  <td>
                    <div className="contact-info">
                      <div>{vet.email}</div>
                      <div className="phone-text">{vet.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge pending">{vet.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => openDetailModal(vet)}
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

      {/* Verified Vets Table */}
      {activeTab === "verified" && (
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th>VET</th>
                <th>LICENSE</th>
                <th>CLINIC</th>
                <th>CONTACT</th>
                <th>VERIFIED DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="vet-info">
                    <strong>Dr. Amit Sharma</strong>
                    <span className="vet-id">V001</span>
                  </div>
                </td>
                <td>MH-VET-2020-1234</td>
                <td>VetCare Pune</td>
                <td>
                  <div className="contact-info">
                    <div>amit.sharma@vetcare.com</div>
                    <div className="phone-text">+91 98765 11111</div>
                  </div>
                </td>
                <td>08/12/2025</td>
                <td>
                  <span className="status-badge verified">Verified</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVet && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vet Verification Review</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Vet Info Section */}
              <div className="info-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{selectedVet.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Vet ID</label>
                    <p>{selectedVet.id}</p>
                  </div>
                  <div className="info-item">
                    <label>License Number</label>
                    <p>{selectedVet.license}</p>
                  </div>
                  <div className="info-item">
                    <label>Clinic Name</label>
                    <p>{selectedVet.clinic}</p>
                  </div>
                  <div className="info-item">
                    <label><Mail size={14} /> Email</label>
                    <p>{selectedVet.email}</p>
                  </div>
                  <div className="info-item">
                    <label><Phone size={14} /> Phone</label>
                    <p>{selectedVet.phone}</p>
                  </div>
                  <div className="info-item">
                    <label><MapPin size={14} /> Location</label>
                    <p>{selectedVet.location}</p>
                  </div>
                  <div className="info-item">
                    <label>District</label>
                    <p>{selectedVet.district}</p>
                  </div>
                  <div className="info-item">
                    <label>Specialization</label>
                    <p>{selectedVet.specialization}</p>
                  </div>
                  <div className="info-item">
                    <label>Experience</label>
                    <p>{selectedVet.experience}</p>
                  </div>
                  <div className="info-item">
                    <label>Applied Date</label>
                    <p>{selectedVet.appliedDate}</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="info-section">
                <h3>Uploaded Documents</h3>
                <div className="documents-list">
                  {selectedVet.documents.map((doc: any, idx: number) => (
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
                onClick={() => handleReject(selectedVet)}
              >
                <XCircle size={18} /> Reject Application
              </button>
              <button
                className="btn-approve-main"
                onClick={() => handleApprove(selectedVet)}
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
