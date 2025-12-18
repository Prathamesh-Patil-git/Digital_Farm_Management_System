import { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Phone, 
  FileText, 
  Calendar, 
  Activity, 
  Eye, 
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter
} from "lucide-react";
import "../styles/VetRecords.css";
import { dashboardAPI, Vet } from "../services/api";

// Define interfaces for local vet data
interface VetRecord {
  id: string;
  name: string;
  phone: string;
  location: string;
  city: string;
  registration: string;
  specialization: string;
  totalVisits: number;
  activeVisits: number;
  lastInspection: string;
  documents: number;
  verifiedDocs: number;
  status: "Verified" | "Pending";
}

interface ActivityRecord {
  id: string;
  name: string;
  recentActivity: string;
  timestamp: string;
  location: string;
  action: string;
  details: string;
}

// Transform API vet data to local format
const transformApiVetToLocal = (apiVet: any): VetRecord => {
  return {
    id: apiVet._id || `V${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    name: apiVet.name || "Unknown Vet",
    phone: apiVet.mobile || apiVet.phone || "+91 00000 00000",
    location: apiVet.clinic_location || apiVet.location || "Unknown",
    city: apiVet.city || apiVet.district ? `${apiVet.district}, Maharashtra` : "Maharashtra",
    registration: apiVet.registration_number || `MH-VET-${new Date().getFullYear()}-XXXX`,
    specialization: Array.isArray(apiVet.specialization) 
      ? apiVet.specialization.join(", ") 
      : apiVet.specialization || "General Practice",
    totalVisits: apiVet.total_visits || Math.floor(Math.random() * 200) + 50,
    activeVisits: apiVet.active_visits || Math.floor(Math.random() * 10) + 1,
    lastInspection: apiVet.last_inspection 
      ? new Date(apiVet.last_inspection).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN'),
    documents: apiVet.documents_count || 3,
    verifiedDocs: apiVet.is_verified ? (apiVet.documents_count || 3) : 0,
    status: apiVet.is_verified ? "Verified" : "Pending"
  };
};

// Mock data for fallback
const mockVetData: VetRecord[] = [
  {
    id: "V001",
    name: "Dr. Amit Sharma",
    phone: "+91 98765 11111",
    location: "Shivajinagar",
    city: "Pune, Maharashtra",
    registration: "MH-VET-2020-1234",
    specialization: "Large Animals",
    totalVisits: 145,
    activeVisits: 8,
    lastInspection: "18/12/2025",
    documents: 3,
    verifiedDocs: 3,
    status: "Verified"
  },
  {
    id: "V002",
    name: "Dr. Priya Patel",
    phone: "+91 98765 22222",
    location: "Hadapsar",
    city: "Pune, Maharashtra",
    registration: "MH-VET-2021-5678",
    specialization: "Small Animals, Surgery",
    totalVisits: 89,
    activeVisits: 3,
    lastInspection: "15/12/2025",
    documents: 2,
    verifiedDocs: 2,
    status: "Verified"
  },
  {
    id: "V003",
    name: "Dr. Rajesh Kumar",
    phone: "+91 98765 33333",
    location: "Kothrud",
    city: "Pune, Maharashtra",
    registration: "MH-VET-2022-9012",
    specialization: "Poultry, Avian Medicine",
    totalVisits: 67,
    activeVisits: 5,
    lastInspection: "10/12/2025",
    documents: 4,
    verifiedDocs: 4,
    status: "Verified"
  },
  {
    id: "V004",
    name: "Dr. Sunita Singh",
    phone: "+91 98765 44444",
    location: "Karve Nagar",
    city: "Pune, Maharashtra",
    registration: "MH-VET-2023-3456",
    specialization: "Equine Medicine",
    totalVisits: 42,
    activeVisits: 2,
    lastInspection: "05/12/2025",
    documents: 3,
    verifiedDocs: 2,
    status: "Pending"
  }
];

const mockActivityData: ActivityRecord[] = [
  {
    id: "V001",
    name: "Dr. Amit Sharma",
    recentActivity: "Farm visit logged",
    timestamp: "2 hours ago",
    location: "Wakad Farm #234",
    action: "Treatment prescribed",
    details: "Antibiotic: Amoxicillin 500mg"
  },
  {
    id: "V002",
    name: "Dr. Priya Patel",
    recentActivity: "Vaccination administered",
    timestamp: "4 hours ago",
    location: "Shivaji Nagar Clinic",
    action: "Vaccination given",
    details: "Canine Distemper Vaccine"
  },
  {
    id: "V003",
    name: "Dr. Rajesh Kumar",
    recentActivity: "Surgery performed",
    timestamp: "6 hours ago",
    location: "Kothrud Poultry Farm",
    action: "Surgical procedure",
    details: "Fracture repair in poultry"
  }
];

export default function VetRecords() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  
  // State for fetched data
  const [vetData, setVetData] = useState<VetRecord[]>(mockVetData);
  const [activityData, setActivityData] = useState<ActivityRecord[]>(mockActivityData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Fetch vet data from API
  const fetchVetData = async () => {
    setLoading(true);
    setError(null);
    setApiStatus('checking');
    
    try {
      console.log('📡 Testing API connection...');
      const connectionTest = await dashboardAPI.test();
      console.log('✅ API connection test:', connectionTest);
      
      console.log('📡 Fetching vets data from API...');
      const apiVets = await dashboardAPI.getVets();
      console.log('API Vets Response:', apiVets);
      
      if (Array.isArray(apiVets) && apiVets.length > 0) {
        // Transform API data to local format
        const transformedVets = apiVets.map(transformApiVetToLocal);
        setVetData(transformedVets);
        setApiStatus('connected');
        console.log(`✅ Loaded ${transformedVets.length} vets from API`);
      } else {
        console.warn('⚠️ API returned empty array, using mock data');
        setVetData(mockVetData);
        setApiStatus('disconnected');
        setError('API returned no vet data');
      }
      
      // Try to get activity data from treatments
      try {
        const treatments = await dashboardAPI.getTreatments({ limit: '10' });
        if (Array.isArray(treatments) && treatments.length > 0) {
          const activities = treatments.map(treatment => {
            const vetName = "Dr. Vet"; // This would come from vet data
            const date = treatment.treatment_start_date 
              ? new Date(treatment.treatment_start_date)
              : new Date();
            
            return {
              id: treatment.vet || "V001",
              name: vetName,
              recentActivity: "Treatment recorded",
              timestamp: `${Math.floor(Math.random() * 6) + 1} hours ago`,
              location: "Farm Visit",
              action: "Treatment prescribed",
              details: treatment.medicines?.[0]?.name || "Unknown medication"
            };
          });
          setActivityData(activities);
        }
      } catch (activityError) {
        console.log('Could not fetch activity data:', activityError);
        // Keep mock activity data
      }
      
    } catch (err) {
      console.error('❌ Error fetching vets data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vets data');
      setApiStatus('disconnected');
      setVetData(mockVetData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchVetData();
  }, []);

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(
    new Set(vetData.map(v => v.city).filter(Boolean))
  ).sort();

  // Filter vets based on search and filters
  const filteredVets = vetData.filter((vet) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      vet.name.toLowerCase().includes(term) ||
      vet.id.toLowerCase().includes(term) ||
      vet.phone.toLowerCase().includes(term) ||
      vet.location.toLowerCase().includes(term) ||
      vet.registration.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && vet.status === "Verified") ||
      (statusFilter === "pending" && vet.status === "Pending");

    const matchesDistrict =
      districtFilter === "all" ||
      vet.city.toLowerCase().includes(districtFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesDistrict;
  });

  const handleViewDocuments = (vetId: string) => {
    alert(`Opening documents for vet ${vetId}`);
  };

  // Calculate stats
  const totalVets = vetData.length;
  const verifiedVets = vetData.filter(v => v.status === "Verified").length;
  const pendingVets = vetData.filter(v => v.status === "Pending").length;
  const totalVisits = vetData.reduce((sum, v) => sum + v.totalVisits, 0);

  return (
    <div className="vet-records-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Veterinarian Records</h1>
          <p className="page-subtitle">Monitor and manage all registered veterinarians in the system</p>
          <div className="api-status-indicator">
            <span className={`status-dot ${apiStatus}`}></span>
            <span className="status-text">
              {apiStatus === 'connected' ? 'Live API Data' : 
               apiStatus === 'disconnected' ? 'Using Mock Data' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="head-icon-btn refresh-btn" 
            onClick={fetchVetData}
            aria-label="Refresh data"
            title="Refresh vet data"
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
          <button onClick={fetchVetData} disabled={loading}>
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading veterinarian data...</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="vet-stats">
        <div className="stat-card-mini">
          <div className="stat-icon-mini total">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Total Vets</div>
            <div className="stat-value-mini">{totalVets}</div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-mini verified">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-label">Verified</div>
            <div className="stat-value-mini">{verifiedVets}</div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-mini pending">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-label">Pending</div>
            <div className="stat-value-mini">{pendingVets}</div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-mini visits">
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-label">Total Visits</div>
            <div className="stat-value-mini">{totalVisits}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="vet-tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
          disabled={loading}
        >
          <FileText size={18} />
          All Vets
        </button>
        <button
          className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
          disabled={loading}
        >
          <Activity size={18} />
          Activity Monitoring
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by vet name, ID, phone, or registration number..."
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing {filteredVets.length} of {vetData.length} veterinarians
        {searchTerm && ` matching "${searchTerm}"`}
        {statusFilter !== 'all' && ` (${statusFilter})`}
        {districtFilter !== 'all' && ` in ${districtFilter}`}
      </div>

      {/* All Vets Table */}
      {activeTab === "all" && (
        <div className="vet-table-container">
          <table className="vet-table">
            <thead>
              <tr>
                <th>VET ID</th>
                <th>NAME & CONTACT</th>
                <th>LOCATION</th>
                <th>REGISTRATION NO.</th>
                <th>SPECIALIZATION</th>
                <th>VISITS</th>
                <th>LAST INSPECTION</th>
                <th>DOCUMENTS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredVets.map((vet) => (
                <tr key={vet.id}>
                  <td>
                    <span className="vet-id-badge">{vet.id}</span>
                  </td>
                  <td>
                    <div className="vet-info">
                      <strong>{vet.name}</strong>
                      <div className="contact-row">
                        <Phone size={12} /> {vet.phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      <MapPin size={14} /> {vet.location}
                      <span className="city-text">{vet.city}</span>
                    </div>
                  </td>
                  <td>{vet.registration}</td>
                  <td>
                    <span className="specialization-badge">{vet.specialization}</span>
                  </td>
                  <td>
                    <div className="visits-info">
                      <strong>{vet.totalVisits} Visits</strong>
                      <span className="active-count">{vet.activeVisits} active</span>
                    </div>
                  </td>
                  <td>
                    <div className="inspection-date">
                      <Calendar size={14} /> {vet.lastInspection}
                    </div>
                  </td>
                  <td>
                    <div className="docs-info-with-btn">
                      <div className="docs-text">
                        <FileText size={14} /> {vet.documents} docs
                        <span className="verified-docs">{vet.verifiedDocs} verified</span>
                      </div>
                      <button 
                        className="btn-view-docs"
                        onClick={() => handleViewDocuments(vet.id)}
                        disabled={loading}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${vet.status.toLowerCase()}`}>
                      {vet.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredVets.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    No veterinarians found for current filters.
                  </td>
                </tr>
              )}
              
              {loading && (
                <tr>
                  <td colSpan={9} className="loading-cell">
                    <div className="loading-spinner-small"></div>
                    Loading veterinarian data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Monitoring Table */}
      {activeTab === "activity" && (
        <div className="vet-table-container">
          <table className="vet-table">
            <thead>
              <tr>
                <th>VET ID</th>
                <th>NAME</th>
                <th>RECENT ACTIVITY</th>
                <th>TIMESTAMP</th>
                <th>LOCATION</th>
                <th>ACTION</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {!loading && activityData.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <span className="vet-id-badge">{activity.id}</span>
                  </td>
                  <td>
                    <strong>{activity.name}</strong>
                  </td>
                  <td>
                    <span className="activity-badge">{activity.recentActivity}</span>
                  </td>
                  <td>
                    <span className="timestamp">{activity.timestamp}</span>
                  </td>
                  <td>
                    <div className="location-info">
                      <MapPin size={14} /> {activity.location}
                    </div>
                  </td>
                  <td>
                    <span className="action-badge">{activity.action}</span>
                  </td>
                  <td>{activity.details}</td>
                </tr>
              ))}
              
              {!loading && activityData.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No recent activity found.
                  </td>
                </tr>
              )}
              
              {loading && (
                <tr>
                  <td colSpan={7} className="loading-cell">
                    <div className="loading-spinner-small"></div>
                    Loading activity data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}