import { useState, useEffect } from "react";
import { FiSearch, FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw } from "react-icons/fi";
import "../styles/TreatmentLog.css";
import { dashboardAPI, Treatment as ApiTreatment, Farmer, Animal, Vet } from "../services/api";

// Local interface for transformed treatment data
interface Treatment {
  id: string;
  farmer: string;
  farmerId: string;
  animalId: string;
  animalType: string;
  vetName: string;
  medicine: string;
  dosage: string;
  withdrawalDays: number;
  treatmentDate: string;
  status: "Active" | "Warning" | "Completed" | "Violation";
  remainingDays: number;
  symptoms?: string[];
  diagnosis?: string;
  notes?: string;
}

// Cache for fetched data
const dataCache: {
  farmers: Map<string, Farmer>;
  animals: Map<string, Animal>;
  vets: Map<string, Vet>;
} = {
  farmers: new Map(),
  animals: new Map(),
  vets: new Map()
};

// Helper function to get name from ID with caching
const getNameFromId = async (
  id: string, 
  type: 'farmer' | 'animal' | 'vet'
): Promise<{name: string, id: string, details?: any}> => {
  try {
    // Check cache first
    const cacheKey = `${type}:${id}`;
    
    if (type === 'farmer' && dataCache.farmers.has(id)) {
      const farmer = dataCache.farmers.get(id)!;
      return { name: farmer.name || 'Unknown Farmer', id: farmer._id, details: farmer };
    }
    
    if (type === 'animal' && dataCache.animals.has(id)) {
      const animal = dataCache.animals.get(id)!;
      return { 
        name: animal.tag_number || `Animal-${id.substring(0, 6)}`, 
        id: animal._id,
        details: animal 
      };
    }
    
    if (type === 'vet' && dataCache.vets.has(id)) {
      const vet = dataCache.vets.get(id)!;
      return { name: vet.name || 'Unknown Vet', id: vet._id, details: vet };
    }
    
    // Fetch from API if not in cache
    switch (type) {
      case 'farmer':
        try {
          const farmers = await dashboardAPI.getFarmers();
          // Cache all farmers
          farmers.forEach(f => dataCache.farmers.set(f._id, f));
          const farmer = farmers.find(f => f._id === id);
          return { 
            name: farmer?.name || 'Unknown Farmer', 
            id: id,
            details: farmer 
          };
        } catch {
          return { name: 'Unknown Farmer', id };
        }
        
      case 'animal':
        try {
          const animals = await dashboardAPI.getAnimals();
          // Cache all animals
          animals.forEach(a => dataCache.animals.set(a._id, a));
          const animal = animals.find(a => a._id === id);
          return { 
            name: animal?.tag_number || `Animal-${id.substring(0, 6)}`, 
            id: id,
            details: animal 
          };
        } catch {
          return { name: 'Unknown Animal', id };
        }
        
      case 'vet':
        try {
          const vets = await dashboardAPI.getVets();
          // Cache all vets
          vets.forEach(v => dataCache.vets.set(v._id, v));
          const vet = vets.find(v => v._id === id);
          return { 
            name: vet?.name || 'Unknown Vet', 
            id: id,
            details: vet 
          };
        } catch {
          return { name: 'Unknown Vet', id };
        }
    }
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return { name: `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`, id };
  }
};

// Enhanced helper function to transform API treatment to local format
const transformApiTreatment = async (apiTreatment: any, index: number): Promise<Treatment> => {
  console.log(`Transforming treatment ${index}:`, apiTreatment);
  
  const treatmentDate = new Date(apiTreatment.treatment_start_date || apiTreatment.created_at || new Date());
  
  // Get names from IDs
  const farmerInfo = apiTreatment.farmer ? 
    await getNameFromId(apiTreatment.farmer, 'farmer') : 
    { name: 'Unknown Farmer', id: 'Unknown' };
    
  const animalInfo = apiTreatment.animal ? 
    await getNameFromId(apiTreatment.animal, 'animal') : 
    { name: 'Unknown Animal', id: 'Unknown' };
    
  const vetInfo = apiTreatment.vet ? 
    await getNameFromId(apiTreatment.vet, 'vet') : 
    { name: 'Unknown Vet', id: 'Unknown' };
  
  // Calculate withdrawal days
  let withdrawalDays = 7; // Default
  if (apiTreatment.withdrawal_ends_on) {
    const withdrawalEndDate = new Date(apiTreatment.withdrawal_ends_on);
    withdrawalDays = Math.ceil((withdrawalEndDate.getTime() - treatmentDate.getTime()) / (1000 * 3600 * 24));
  } else if (apiTreatment.medicines && apiTreatment.medicines[0]?.withdrawal_days) {
    withdrawalDays = apiTreatment.medicines[0].withdrawal_days;
  }
  
  // Calculate remaining days
  const today = new Date();
  const withdrawalEndDate = apiTreatment.withdrawal_ends_on ? 
    new Date(apiTreatment.withdrawal_ends_on) : 
    new Date(treatmentDate.getTime() + withdrawalDays * 24 * 60 * 60 * 1000);
  
  const remainingDays = Math.ceil((withdrawalEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  // Determine status
  let status: "Active" | "Warning" | "Completed" | "Violation";
  if (apiTreatment.is_flagged_violation) {
    status = "Violation";
  } else if (remainingDays > 0) {
    status = remainingDays <= 2 ? "Warning" : "Active";
  } else {
    status = "Completed";
  }
  
  // Get medicine details
  let medicineName = "No medicine specified";
  let dosage = "Not specified";
  
  if (apiTreatment.medicines && Array.isArray(apiTreatment.medicines) && apiTreatment.medicines.length > 0) {
    // Handle multiple medicines
    const medicines = apiTreatment.medicines;
    if (medicines.length === 1) {
      const med = medicines[0];
      medicineName = med.name || "Unknown Medicine";
      dosage = `${med.dosage || "Unknown"} ${med.unit || ""}`.trim();
    } else {
      // Multiple medicines
      medicineName = `${medicines.length} medicines`;
      dosage = "Multiple dosages";
    }
  }
  
  // Get animal type/species
  const animalType = animalInfo.details?.species || 
                    (animalInfo.details as any)?.type || 
                    "Unknown";
  
  // Handle symptoms array
  const symptoms = apiTreatment.symptoms || [];
  
  return {
    id: apiTreatment._id || `T${index + 1}`,
    farmer: farmerInfo.name,
    farmerId: farmerInfo.id,
    animalId: animalInfo.name,
    animalType: animalType,
    vetName: vetInfo.name,
    medicine: medicineName,
    dosage: dosage,
    withdrawalDays: withdrawalDays,
    treatmentDate: treatmentDate.toISOString().split('T')[0],
    status: status,
    remainingDays: remainingDays,
    symptoms: symptoms,
    diagnosis: apiTreatment.diagnosis,
    notes: apiTreatment.notes
  };
};

// Mock data for fallback
const mockTreatmentData: Treatment[] = [
  {
    id: "1",
    farmer: "Rajesh Patil",
    farmerId: "F001",
    animalId: "MH-DAI-2024-1234",
    animalType: "Cattle",
    vetName: "Dr. Amit Shah",
    medicine: "Oxytetracycline",
    dosage: "20 mg/kg",
    withdrawalDays: 7,
    treatmentDate: "2025-12-10",
    status: "Active",
    remainingDays: 2
  },
  {
    id: "2",
    farmer: "Suresh Kale",
    farmerId: "F002",
    animalId: "MH-DAI-2024-5678",
    animalType: "Buffalo",
    vetName: "Dr. Priya Deshmukh",
    medicine: "Amoxicillin",
    dosage: "15 mg/kg",
    withdrawalDays: 5,
    treatmentDate: "2025-12-08",
    status: "Warning",
    remainingDays: 0
  },
  {
    id: "3",
    farmer: "Ramesh Jadhav",
    farmerId: "F003",
    animalId: "MH-DAI-2024-9012",
    animalType: "Cattle",
    vetName: "Dr. Amit Shah",
    medicine: "Ceftriaxone",
    dosage: "10 mg/kg",
    withdrawalDays: 14,
    treatmentDate: "2025-11-25",
    status: "Completed",
    remainingDays: -6
  },
  {
    id: "4",
    farmer: "Prakash More",
    farmerId: "F004",
    animalId: "MH-DAI-2024-3456",
    animalType: "Goat",
    vetName: "Dr. Sunita Rane",
    medicine: "Penicillin G",
    dosage: "5 mg/kg",
    withdrawalDays: 10,
    treatmentDate: "2025-12-05",
    status: "Active",
    remainingDays: 5
  },
  {
    id: "5",
    farmer: "Rajesh Patil",
    farmerId: "F001",
    animalId: "MH-DAI-2024-7890",
    animalType: "Cattle",
    vetName: "Dr. Priya Deshmukh",
    medicine: "Sulfamethazine",
    dosage: "25 mg/kg",
    withdrawalDays: 21,
    treatmentDate: "2025-12-01",
    status: "Active",
    remainingDays: 7
  },
  {
    id: "6",
    farmer: "Anita Sharma",
    farmerId: "F005",
    animalId: "MH-DAI-2024-2468",
    animalType: "Buffalo",
    vetName: "Dr. Amit Shah",
    medicine: "Enrofloxacin",
    dosage: "12 mg/kg",
    withdrawalDays: 28,
    treatmentDate: "2025-11-20",
    status: "Completed",
    remainingDays: -3
  }
];

export default function TreatmentLog() {
  const [farmerId, setFarmerId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<Treatment[]>([]);
  
  // State for API data
  const [treatmentData, setTreatmentData] = useState<Treatment[]>(mockTreatmentData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // State for selected treatment details modal
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  // Fetch treatments data from API
  const fetchTreatmentsData = async () => {
    setLoading(true);
    setError(null);
    setApiStatus('checking');
    
    try {
      console.log('📡 Fetching treatments data from API...');
      
      // Test API connection first
      const isConnected = await dashboardAPI.test()
        .then(() => true)
        .catch(() => false);
      
      if (isConnected) {
        console.log('✅ API connected, fetching treatments...');
        
        // Fetch treatments from API
        const apiTreatments = await dashboardAPI.getTreatments();
        console.log('✅ API treatments response:', apiTreatments);
        
        if (Array.isArray(apiTreatments) && apiTreatments.length > 0) {
          // Transform API data to local format with async mapping
          const transformedTreatments: Treatment[] = [];
          
          for (let i = 0; i < apiTreatments.length; i++) {
            try {
              const transformed = await transformApiTreatment(apiTreatments[i], i);
              transformedTreatments.push(transformed);
            } catch (transformError) {
              console.error(`Error transforming treatment ${i}:`, transformError);
            }
          }
          
          setTreatmentData(transformedTreatments);
          setFilteredData(transformedTreatments);
          setApiStatus('connected');
          console.log(`✅ Loaded ${transformedTreatments.length} treatments from API`);
        } else {
          console.warn('⚠️ API returned empty array, using mock data');
          setTreatmentData(mockTreatmentData);
          setFilteredData(mockTreatmentData);
          setApiStatus('disconnected');
        }
      } else {
        console.warn('⚠️ API not connected, using mock data');
        setTreatmentData(mockTreatmentData);
        setFilteredData(mockTreatmentData);
        setApiStatus('disconnected');
      }
    } catch (err) {
      console.error('❌ Error fetching treatments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch treatment data');
      setApiStatus('disconnected');
      setTreatmentData(mockTreatmentData);
      setFilteredData(mockTreatmentData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTreatmentsData();
  }, []);

  // Filter data based on search criteria
  useEffect(() => {
    if (!treatmentData.length) return;
    
    const filtered = treatmentData.filter((treatment) => {
      const matchesFarmer = farmerId
        ? treatment.farmerId.toLowerCase().includes(farmerId.toLowerCase()) ||
          treatment.farmer.toLowerCase().includes(farmerId.toLowerCase())
        : true;
      
      const matchesAnimal = animalId
        ? treatment.animalId.toLowerCase().includes(animalId.toLowerCase())
        : true;

      const matchesSearch = searchTerm
        ? treatment.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.animalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.vetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          treatment.symptoms?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      return matchesFarmer && matchesAnimal && matchesSearch;
    });

    setFilteredData(filtered);
  }, [farmerId, animalId, searchTerm, treatmentData]);

  const handleSearch = () => {
    console.log('🔍 Searching treatments...');
  };

  const handleReset = () => {
    setFarmerId("");
    setAnimalId("");
    setSearchTerm("");
    setFilteredData(treatmentData);
  };

  const getStatusBadge = (status: string, remainingDays: number) => {
    switch (status) {
      case "Active":
        return (
          <span className="status-badge status-active">
            <FiClock size={14} />
            Active ({remainingDays > 0 ? `${remainingDays}d left` : 'Ending today'})
          </span>
        );
      case "Warning":
        return (
          <span className="status-badge status-warning">
            <FiAlertCircle size={14} />
            Ending Soon
          </span>
        );
      case "Violation":
        return (
          <span className="status-badge status-violation">
            <FiAlertCircle size={14} />
            Violation
          </span>
        );
      default:
        return (
          <span className="status-badge status-completed">
            <FiCheckCircle size={14} />
            Completed
          </span>
        );
    }
  };

  // Format array fields for display
  const formatArrayField = (arr: any[] | undefined): string => {
    if (!arr || !Array.isArray(arr)) return "None";
    return arr.join(", ");
  };

  // Open treatment details modal
  const openTreatmentDetails = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
  };

  // Close treatment details modal
  const closeTreatmentDetails = () => {
    setSelectedTreatment(null);
  };

  // Calculate statistics
  const activeCount = treatmentData.filter(t => t.status === "Active").length;
  const warningCount = treatmentData.filter(t => t.status === "Warning").length;
  const completedCount = treatmentData.filter(t => t.status === "Completed").length;
  const violationCount = treatmentData.filter(t => t.status === "Violation").length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head">
        <div>
          <h2>Treatment Log</h2>
          <p>Search and view all treatment records</p>
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
            onClick={fetchTreatmentsData}
            aria-label="Refresh data"
            title="Refresh treatment data"
            disabled={loading}
          >
            <FiRefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <FiAlertCircle size={20} />
          <p>{error}</p>
          <button onClick={fetchTreatmentsData} disabled={loading}>
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading treatment data...</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-active">
          <div className="stat-icon">
            <FiClock size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Treatments</h3>
            <p className="stat-value">{activeCount}</p>
            <span className="stat-subtext">Under withdrawal period</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <FiAlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Ending Soon</h3>
            <p className="stat-value">{warningCount}</p>
            <span className="stat-subtext">Within 2 days of completion</span>
          </div>
        </div>

        <div className="stat-card stat-completed">
          <div className="stat-icon">
            <FiCheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-value">{completedCount}</p>
            <span className="stat-subtext">Withdrawal period over</span>
          </div>
        </div>

        <div className="stat-card stat-violation">
          <div className="stat-icon">
            <FiAlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Violations</h3>
            <p className="stat-value">{violationCount}</p>
            <span className="stat-subtext">Flagged for review</span>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="form-card">
        <h3>Search Treatments</h3>

        <div className="form-row">
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Search farmer, animal, vet, medicine, symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Farmer ID"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              className="form-input"
              placeholder="Animal ID"
              value={animalId}
              onChange={(e) => setAnimalId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group button-group">
            <button className="btn-search" onClick={handleSearch} disabled={loading}>
              <FiSearch /> Search
            </button>

            <button className="btn-reset" onClick={handleReset} disabled={loading}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredData.length}</strong> of {treatmentData.length} treatments
          {searchTerm && ` matching "${searchTerm}"`}
          {farmerId && ` for farmer "${farmerId}"`}
          {animalId && ` for animal "${animalId}"`}
        </p>
        <p className="data-source">
          Data Source: {apiStatus === 'connected' ? 'Live API' : 'Mock Data'} • 
          Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>FARMER</th>
              <th>ANIMAL ID</th>
              <th>TYPE</th>
              <th>VET NAME</th>
              <th>MEDICINE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredData.length > 0 ? (
              filteredData.map((treatment) => (
                <tr key={treatment.id} className="table-row">
                  <td>
                    <div className="farmer-info">
                      <strong>{treatment.farmer}</strong>
                      <span className="farmer-id">{treatment.farmerId}</span>
                    </div>
                  </td>
                  <td>
                    <span className="animal-tag">{treatment.animalId}</span>
                  </td>
                  <td>
                    <span className="animal-type-badge">{treatment.animalType}</span>
                  </td>
                  <td>{treatment.vetName}</td>
                  <td>
                    <strong className="medicine-name">{treatment.medicine}</strong>
                    <div className="medicine-dosage">{treatment.dosage}</div>
                  </td>
                  <td>{getStatusBadge(treatment.status, treatment.remainingDays)}</td>
                  <td>
                    <button 
                      className="btn-view-details"
                      onClick={() => openTreatmentDetails(treatment)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : !loading && filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <FiSearch size={48} />
                  <p>No treatments found</p>
                  <span>Try adjusting your search filters</span>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={7} className="loading-cell">
                  <div className="loading-spinner-small"></div>
                  Loading treatment data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Treatment Details Modal */}
      {selectedTreatment && (
        <div className="modal-backdrop" onClick={closeTreatmentDetails}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Treatment Details</h3>
              <button className="btn-close" onClick={closeTreatmentDetails}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Treatment ID</label>
                  <div className="detail-value">{selectedTreatment.id}</div>
                </div>
                <div className="detail-item">
                  <label>Farmer</label>
                  <div className="detail-value">
                    <strong>{selectedTreatment.farmer}</strong>
                    <div className="detail-subtext">ID: {selectedTreatment.farmerId}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <label>Animal</label>
                  <div className="detail-value">
                    <strong>{selectedTreatment.animalId}</strong>
                    <div className="detail-subtext">Type: {selectedTreatment.animalType}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <label>Veterinarian</label>
                  <div className="detail-value">{selectedTreatment.vetName}</div>
                </div>
                <div className="detail-item">
                  <label>Treatment Date</label>
                  <div className="detail-value">
                    {new Date(selectedTreatment.treatmentDate).toLocaleDateString("en-IN", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <div className="detail-value">
                    {getStatusBadge(selectedTreatment.status, selectedTreatment.remainingDays)}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Withdrawal Period</label>
                  <div className="detail-value">
                    {selectedTreatment.withdrawalDays} days
                    <div className="detail-subtext">
                      {selectedTreatment.remainingDays > 0 
                        ? `Ends in ${selectedTreatment.remainingDays} days`
                        : selectedTreatment.remainingDays === 0
                        ? 'Ends today'
                        : `Ended ${Math.abs(selectedTreatment.remainingDays)} days ago`
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Medicine Details</h4>
                <div className="detail-item full-width">
                  <label>Medicine</label>
                  <div className="detail-value">{selectedTreatment.medicine}</div>
                </div>
                <div className="detail-item full-width">
                  <label>Dosage</label>
                  <div className="detail-value">{selectedTreatment.dosage}</div>
                </div>
              </div>
              
              {selectedTreatment.symptoms && selectedTreatment.symptoms.length > 0 && (
                <div className="details-section">
                  <h4>Symptoms</h4>
                  <div className="symptoms-list">
                    {selectedTreatment.symptoms.map((symptom, index) => (
                      <span key={index} className="symptom-tag">{symptom}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTreatment.diagnosis && (
                <div className="details-section">
                  <h4>Diagnosis</h4>
                  <div className="diagnosis-text">{selectedTreatment.diagnosis}</div>
                </div>
              )}
              
              {selectedTreatment.notes && (
                <div className="details-section">
                  <h4>Notes</h4>
                  <div className="notes-text">{selectedTreatment.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Violations Section (if any) */}
      {violationCount > 0 && (
        <div className="violations-alert">
          <div className="alert-header">
            <FiAlertCircle size={20} />
            <h3>Treatment Violations Detected</h3>
          </div>
          <p>
            There {violationCount === 1 ? 'is' : 'are'} {violationCount} treatment{violationCount !== 1 ? 's' : ''} 
            flagged for violation. Please review these treatments for compliance issues.
          </p>
          <button className="btn-view-violations" onClick={() => {
            // Filter to show only violations
            setSearchTerm('');
            setFarmerId('');
            setAnimalId('');
            setFilteredData(treatmentData.filter(t => t.status === "Violation"));
          }}>
            View All Violations
          </button>
        </div>
      )}
    </div>
  );
}