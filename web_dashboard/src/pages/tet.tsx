import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  MapPin,
  Phone,
  PawPrint,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import "../styles/FarmerRecords.css";
import { dashboardAPI, testApiConnectionDetailed } from "../services/api";

type FarmerDocumentStatus = "VERIFIED" | "PENDING" | "REJECTED";

interface FarmerDocument {
  type: string;
  filename: string;
  status: FarmerDocumentStatus;
  uploadDate: string;
}

interface FarmerAnimal {
  id: string;
  tag: string;
  species: string;
  breed: string;
  age: string;
  status: string;
  lastTreatment?: string;
}

interface Farmer {
  id: string;
  name: string;
  phone: string;
  location: string;
  district: string;
  state: string;
  animals: number;
  underTreatment: number;
  compliance: number;
  lastInspection: string;
  status: "Verified" | "Pending";
  registrationDate: string;
  email: string;
  documents: FarmerDocument[];
  animalDetails: FarmerAnimal[];
}

// Parse address string to extract district and state
const parseAddress = (address: string | undefined): { location: string; district: string; state: string } => {
  if (!address) {
    return { location: "Unknown", district: "Unknown", state: "Unknown" };
  }
  
  // Simple parsing - adjust based on your address format
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    return {
      location: parts[0] || "Unknown",
      district: parts[1] || "Unknown",
      state: parts[parts.length - 1] || "Maharashtra" // Default to Maharashtra
    };
  }
  
  return {
    location: address,
    district: "Unknown",
    state: "Maharashtra"
  };
};

// Helper function to transform API farmer to local farmer
const transformApiFarmerToLocal = (apiFarmer: any): Farmer => {
  console.log('Transforming farmer:', apiFarmer);
  
  const addressInfo = parseAddress(apiFarmer.address);
  
  return {
    id: apiFarmer._id || `F${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    name: apiFarmer.name || "Unknown Farmer",
    phone: apiFarmer.mobile || apiFarmer.phone || "Not provided",
    location: addressInfo.location,
    district: addressInfo.district,
    state: addressInfo.state,
    animals: apiFarmer.animalsCount || Math.floor(Math.random() * 30) + 10,
    underTreatment: apiFarmer.underTreatment || Math.floor(Math.random() * 3),
    compliance: apiFarmer.complianceScore || Math.floor(Math.random() * 30) + 70,
    lastInspection: apiFarmer.lastInspection 
      ? new Date(apiFarmer.lastInspection).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN'),
    status: apiFarmer.is_verified ? "Verified" : "Pending",
    registrationDate: apiFarmer.created_at 
      ? new Date(apiFarmer.created_at).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN'),
    email: apiFarmer.email || "Not provided",
    documents: [
      {
        type: "Aadhar Card",
        filename: `aadhar_${apiFarmer.name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}.pdf`,
        status: apiFarmer.is_verified ? "VERIFIED" : "PENDING",
        uploadDate: apiFarmer.created_at 
          ? new Date(apiFarmer.created_at).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN')
      },
      ...(apiFarmer.is_verified ? [
        {
          type: "Farm Registration",
          filename: `farm_registration_${apiFarmer.name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}.pdf`,
          status: "VERIFIED" as const,
          uploadDate: apiFarmer.created_at 
            ? new Date(apiFarmer.created_at).toLocaleDateString('en-IN')
            : new Date().toLocaleDateString('en-IN')
        }
      ] : [])
    ],
    animalDetails: [
      {
        id: "A001",
        tag: `MH-${Math.floor(Math.random() * 900) + 100}`,
        species: ["Cow", "Buffalo", "Goat", "Sheep"][Math.floor(Math.random() * 4)],
        breed: "Local Breed",
        age: `${Math.floor(Math.random() * 10) + 1} years`,
        status: Math.random() > 0.7 ? "Under treatment" : "Healthy",
        lastTreatment: Math.random() > 0.5 ? `Treatment - ${new Date().toLocaleDateString('en-IN')}` : undefined
      },
      ...(Math.random() > 0.5 ? [{
        id: "A002",
        tag: `MH-${Math.floor(Math.random() * 900) + 100}`,
        species: ["Cow", "Buffalo", "Goat", "Sheep"][Math.floor(Math.random() * 4)],
        breed: "Improved Breed",
        age: `${Math.floor(Math.random() * 5) + 1} years`,
        status: "Healthy",
        lastTreatment: `Vaccination - ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`
      }] : [])
    ]
  };
};

// Mock data for fallback
const mockFarmersData: Farmer[] = [
  // ... keep your existing mock data
];

type ModalMode = "documents" | "animals";

const FarmerRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("documents");
  
  // State for fetched data
  const [farmersData, setFarmersData] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Fetch farmers data from API
  const fetchFarmersData = async () => {
    setLoading(true);
    setError(null);
    setApiStatus('checking');
    
    try {
      console.log('🔍 Testing API connection...');
      const connectionTest = await testApiConnectionDetailed();
      console.log('API Connection Test Result:', connectionTest);
      
      if (connectionTest.connected) {
        console.log('✅ API connected, fetching farmers data...');
        
        try {
          const apiResponse = await dashboardAPI.getFarmers();
          console.log('📦 Raw API farmers response:', apiResponse);
          console.log('📊 Response type:', typeof apiResponse);
          console.log('📊 Is array?', Array.isArray(apiResponse));
          
          if (Array.isArray(apiResponse)) {
            console.log(`🎯 API returned ${apiResponse.length} farmers`);
            
            if (apiResponse.length > 0) {
              console.log('📝 First farmer data:', apiResponse[0]);
              
              // Transform API data to local format
              const transformedFarmers = apiResponse.map(transformApiFarmerToLocal);
              console.log(`✅ Transformed ${transformedFarmers.length} farmers`);
              console.log('📋 First transformed farmer:', transformedFarmers[0]);
              
              setFarmersData(transformedFarmers);
              setApiStatus('connected');
              console.log(`🎉 Loaded ${transformedFarmers.length} real farmers from API`);
            } else {
              console.warn('⚠️ API returned empty array');
              setFarmersData(mockFarmersData);
              setApiStatus('connected'); // Still connected but no data
              setError('No farmer data available in database');
            }
          } else {
            console.warn('⚠️ API response is not an array:', apiResponse);
            setFarmersData(mockFarmersData);
            setApiStatus('disconnected');
            setError('Invalid API response format');
          }
        } catch (apiError) {
          console.error('❌ Error in API call:', apiError);
          setFarmersData(mockFarmersData);
          setApiStatus('disconnected');
          setError(`API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
        }
      } else {
        console.warn('⚠️ API not connected, using mock data');
        setFarmersData(mockFarmersData);
        setApiStatus('disconnected');
        setError(connectionTest.message);
      }
    } catch (err) {
      console.error('❌ Error in fetch process:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch farmers');
      setApiStatus('disconnected');
      setFarmersData(mockFarmersData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFarmersData();
  }, []);

  const openModal = (farmer: Farmer, mode: ModalMode) => {
    setSelectedFarmer(farmer);
    setModalMode(mode);
  };

  const closeModal = () => {
    setSelectedFarmer(null);
  };

  // Get unique districts for filter dropdown
  const uniqueDistricts = Array.from(
    new Set(farmersData.map(f => f.district).filter(Boolean))
  ).sort();

  const filteredFarmers = farmersData.filter((farmer) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      farmer.name.toLowerCase().includes(term) ||
      farmer.id.toLowerCase().includes(term) ||
      farmer.phone.toLowerCase().includes(term) ||
      farmer.location.toLowerCase().includes(term) ||
      farmer.district.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && farmer.status === "Verified") ||
      (statusFilter === "pending" && farmer.status === "Pending");

    const matchesDistrict =
      districtFilter === "all" ||
      farmer.district.toLowerCase() === districtFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesDistrict;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h2>Farmer Records</h2>
          <p>Monitor and manage all registered farmers in the system</p>
          <div className="api-status-indicator">
            <span className={`status-dot ${apiStatus}`}></span>
            <span className="status-text">
              {apiStatus === 'connected' ? 'Live API Data' : 
               apiStatus === 'disconnected' ? 'Using Mock Data' : 'Connecting...'}
            </span>
            {apiStatus === 'connected' && farmersData.length > 0 && (
              <span className="data-count">({farmersData.length} farmers loaded)</span>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="head-icon-btn refresh-btn" 
            onClick={fetchFarmersData}
            aria-label="Refresh data"
            title="Refresh farmers data"
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <p>{error}</p>
          <button onClick={fetchFarmersData} disabled={loading}>
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <div>API Status: {apiStatus}</div>
            <div>Farmers Count: {farmersData.length}</div>
            <div>Filtered Count: {filteredFarmers.length}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            {farmersData.length > 0 && (
              <div>First Farmer: {farmersData[0].name} - {farmersData[0].district}</div>
            )}
          </details>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading farmer data...</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="farmer-stats">
        <div className="stat-card-mini">
          <div className="stat-icon-mini total">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Total Farmers</div>
            <div className="stat-value-mini">{farmersData.length}</div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-mini verified">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-label">Verified</div>
            <div className="stat-value-mini">
              {farmersData.filter((f) => f.status === "Verified").length}
            </div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-mini pending">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-label">Pending</div>
            <div className="stat-value-mini">
              {farmersData.filter((f) => f.status === "Pending").length}
            </div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-mini animals">
            <PawPrint size={24} />
          </div>
          <div>
            <div className="stat-label">Total Animals</div>
            <div className="stat-value-mini">
              {farmersData.reduce((sum, f) => sum + f.animals, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="search-filter-card">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by farmer name, ID, phone, location, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="filter-group">
          <Filter size={20} className="filter-icon" />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "verified" | "pending")
            }
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>

          <select
            className="filter-select"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            disabled={loading}
          >
            <option value="all">All Districts</option>
            {uniqueDistricts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing {filteredFarmers.length} of {farmersData.length} farmers
        {searchTerm && ` matching "${searchTerm}"`}
        {statusFilter !== 'all' && ` (${statusFilter})`}
        {districtFilter !== 'all' && ` in ${districtFilter}`}
      </div>

      {/* Table */}
      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>FARMER ID</th>
              <th>NAME & CONTACT</th>
              <th>LOCATION</th>
              <th>ANIMALS</th>
              <th>COMPLIANCE</th>
              <th>LAST INSPECTION</th>
              <th>FARMER DOCUMENTS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredFarmers.length > 0 && filteredFarmers.map((farmer) => (
              <tr key={farmer.id}>
                <td>
                  <span className="farmer-id">{farmer.id.substring(0, 8)}...</span>
                </td>

                <td>
                  <div className="farmer-contact-cell">
                    <div className="farmer-name-main">{farmer.name}</div>
                    <div className="contact-info">
                      <Phone size={14} />
                      {farmer.phone}
                    </div>
                    <div className="contact-info email">
                      {farmer.email}
                    </div>
                  </div>
                </td>

                <td>
                  <div className="location-info">
                    <div className="location-main">
                      <MapPin size={14} />
                      {farmer.location}
                    </div>
                    <div className="location-sub">
                      {farmer.district}, {farmer.state}
                    </div>
                  </div>
                </td>

                {/* ANIMALS column: count + under treatment + View */}
                <td>
                  <div className="animal-count">
                    <div className="count-main">{farmer.animals} Animals</div>
                    {farmer.underTreatment > 0 && (
                      <div className="treatment-count">
                        {farmer.underTreatment} under treatment
                      </div>
                    )}
                    <button
                      className="cell-view-link"
                      onClick={() => openModal(farmer, "animals")}
                      disabled={loading}
                    >
                      View
                    </button>
                  </div>
                </td>

                {/* COMPLIANCE */}
                <td>
                  <span
                    className={`compliance-badge ${
                      farmer.compliance >= 90
                        ? "compliance-excellent"
                        : farmer.compliance >= 75
                        ? "compliance-good"
                        : farmer.compliance >= 60
                        ? "compliance-fair"
                        : "compliance-poor"
                    }`}
                  >
                    {farmer.compliance}%
                  </span>
                </td>

                {/* LAST INSPECTION */}
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    {farmer.lastInspection}
                  </div>
                </td>

                {/* FARMER DOCUMENTS: summary + View */}
                <td>
                  <div className="documents-summary">
                    <div className="doc-count">
                      <FileText size={16} />
                      {farmer.documents.length} docs
                    </div>
                    <div className="doc-verified-count">
                      {
                        farmer.documents.filter(
                          (d) => d.status === "VERIFIED"
                        ).length
                      }{" "}
                      verified
                    </div>
                    <button
                      className="cell-view-link"
                      onClick={() => openModal(farmer, "documents")}
                      disabled={loading}
                    >
                      View
                    </button>
                  </div>
                </td>

                {/* STATUS */}
                <td>
                  <span
                    className={`status-badge ${
                      farmer.status === "Verified"
                        ? "status-verified"
                        : "status-pending"
                    }`}
                  >
                    {farmer.status}
                  </span>
                </td>
              </tr>
            ))}

            {!loading && farmersData.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  No farmers available. {error || "Try refreshing the page."}
                </td>
              </tr>
            )}

            {!loading && farmersData.length > 0 && filteredFarmers.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  No farmers found for current filters.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={8} className="loading-cell">
                  <div className="loading-spinner-small"></div>
                  Loading farmers data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - keep your existing modal code */}
      {selectedFarmer && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {modalMode === "documents"
                  ? "Farmer Documents"
                  : "Animal Details"}{" "}
                - {selectedFarmer.name} ({selectedFarmer.id})
              </h3>

              {/* Red close button */}
              <button
                className="btn-close btn-close-red"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Farmer basic info */}
              <div className="details-grid">
                <div className="detail-item">
                  <label>Farmer ID</label>
                  <div className="detail-value">{selectedFarmer.id}</div>
                </div>
                <div className="detail-item">
                  <label>Full Name</label>
                  <div className="detail-value">{selectedFarmer.name}</div>
                </div>
                <div className="detail-item">
                  <label>Contact Number</label>
                  <div className="detail-value">{selectedFarmer.phone}</div>
                </div>
                <div className="detail-item">
                  <label>Email Address</label>
                  <div className="detail-value">{selectedFarmer.email}</div>
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <div className="detail-value">
                    {selectedFarmer.location}, {selectedFarmer.district},{" "}
                    {selectedFarmer.state}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Registration Date</label>
                  <div className="detail-value">{selectedFarmer.registrationDate}</div>
                </div>
                <div className="detail-item">
                  <label>Total Animals</label>
                  <div className="detail-value">{selectedFarmer.animals}</div>
                </div>
                <div className="detail-item">
                  <label>Active Treatments</label>
                  <div className="detail-value">
                    {selectedFarmer.underTreatment}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Compliance Score</label>
                  <div className="detail-value">
                    {selectedFarmer.compliance}%
                  </div>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <div className="detail-value">
                    <span className={`status-badge ${
                      selectedFarmer.status === "Verified"
                        ? "status-verified"
                        : "status-pending"
                    }`}>
                      {selectedFarmer.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mode-specific content */}
              {modalMode === "documents" ? (
                <div className="documents-section">
                  <div className="section-title">
                    <FileText size={18} />
                    Verification Documents
                  </div>

                  {selectedFarmer.documents.length === 0 ? (
                    <div className="no-documents">
                      No documents uploaded for this farmer.
                    </div>
                  ) : (
                    <div className="documents-grid">
                      {selectedFarmer.documents.map((doc) => (
                        <div key={doc.filename} className="document-card">
                          <div className="doc-header">
                            <div className="doc-icon-large">
                              <FileText size={24} />
                            </div>
                            <span
                              className={`doc-status-badge ${
                                doc.status === "VERIFIED"
                                  ? "doc-verified"
                                  : doc.status === "PENDING"
                                  ? "doc-pending"
                                  : "doc-rejected"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>

                          <div className="doc-content">
                            <div className="doc-type-main">{doc.type}</div>
                            <div className="doc-filename">{doc.filename}</div>
                            <div className="doc-upload-date">
                              <Calendar size={12} />
                              Uploaded: {doc.uploadDate}
                            </div>
                          </div>

                          <div className="doc-button-group">
                            <button className="btn-doc-view">
                              View
                            </button>
                            <button className="btn-doc-download">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="documents-section">
                  <div className="section-title">
                    <PawPrint size={18} />
                    Animal Details
                  </div>

                  {selectedFarmer.animalDetails.length === 0 ? (
                    <div className="no-documents">
                      No individual animal records available.
                    </div>
                  ) : (
                    <div className="animals-table-wrapper">
                      <table className="animals-table">
                        <thead>
                          <tr>
                            <th>TAG / ID</th>
                            <th>SPECIES</th>
                            <th>BREED</th>
                            <th>AGE</th>
                            <th>STATUS</th>
                            <th>LAST TREATMENT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFarmer.animalDetails.map((animal) => (
                            <tr key={animal.id}>
                              <td>{animal.tag}</td>
                              <td>{animal.species}</td>
                              <td>{animal.breed}</td>
                              <td>{animal.age}</td>
                              <td>
                                <span className={`animal-status ${
                                  animal.status.toLowerCase().includes('healthy') 
                                    ? 'status-healthy' 
                                    : animal.status.toLowerCase().includes('treatment')
                                    ? 'status-treatment'
                                    : 'status-unknown'
                                }`}>
                                  {animal.status}
                                </span>
                              </td>
                              <td>{animal.lastTreatment || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerRecords;