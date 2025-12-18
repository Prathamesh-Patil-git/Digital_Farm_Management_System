// API service for making requests to Flask backend
const API_BASE_URL = 'http://127.0.0.1:5000';

// Define interfaces for TypeScript
export interface OverviewData {
  total_farmers: number;
  total_veterinarians: number;
  total_animals: number;
  total_treatments: number;
  pending_verifications: number;
}

export interface Farmer {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  is_verified: boolean;
  created_at?: string;
  // Add other fields as needed
}

export interface Vet {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  specialization?: string[];
  is_verified: boolean;
  created_at?: string;
  // Add other fields as needed
}
export interface FarmerAnimalResponse {
  _id: string;
  species: string;
  breed?: string;
  tag_number?: string;
  age?: number;
  gender?: string;
  status?: string;
  last_treatment_date?: string;
  last_treatment_medicine?: string;
  farmer: string;
  created_at?: string;
}
// Add this interface for animals by farmer response
export interface FarmerAnimalResponse {
  _id: string;
  species: string;
  breed?: string;
  tag_number?: string;
  age?: number;
  gender?: string;
  status?: string;
  last_treatment_date?: string;
  last_treatment_medicine?: string;
  farmer: string;
  created_at?: string;
}

// Add this method to dashboardAPI object

export interface Animal {
  _id: string;
  species: string;
  farmer: string;
  breed?: string;
  tag_number?: string;
  age?: number;
  gender?: string;
  created_at?: string;
  // Add other fields as needed
}

export interface Treatment {
  _id: string;
  treatment_start_date: string;
  medicines: Array<{name: string}>;
  is_flagged_violation: boolean;
  farmer?: string;
  vet?: string;
  animal?: string;
  status?: string;
  diagnosis?: string;
  // Add other fields as needed
}

export interface MedicineUsage {
  medicine: string;
  count: number;
}

export interface DailyTreatments {
  today_treatments: number;
}

export interface Violation {
  _id: string;
  farmer?: string;
  animal?: string;
  treatment_start_date?: string;
  medicines?: Array<{name: string}>;
  reason?: string;
  status?: string;
  // Add other fields as needed
}

export interface SimplifiedDashboard {
  overview: OverviewData;
  today_treatments: number;
  violations_count: number;
  farm_safety: {
    safe: number;
    unsafe: number;
  };
  charts: {
    treatment_trends: LineDataPoint[];
    animals_by_species: BarDataPoint[];
    farm_safety_status: PieDataPoint[];
  };
}

// Chart data interfaces
export interface LineDataPoint {
  month: string;
  treatments: number;
}

export interface BarDataPoint {
  species: string;
  count: number;
}

export interface PieDataPoint {
  name: string;
  value: number;
}

export interface ComplianceDataPoint {
  month: string;
  compliant: number;
  nonCompliant: number;
}

export interface VetActivityDataPoint {
  day: string;
  visits: number;
}

// Response wrapper interface - matches Flask's success_response structure
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  status?: string;
}

// Common headers for authentication
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Handle API responses with better error handling
// In the handleResponse function, update it to:
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    const result = await response.json();
    console.log(`📡 API Response for ${response.url}:`, result);
    
    // Your Flask backend returns { data: [...], status: "success" }
    // Check if it has data property
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data;
    }
    
    // If it doesn't have data property, return the whole result
    return result;
    
  } catch (error) {
    console.error('❌ Failed to parse response:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse response as JSON');
  }
};

// Dashboard API calls
export const dashboardAPI = {
  // 1. Get dashboard overview data
  getOverview: async (): Promise<OverviewData> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<OverviewData>(response);
  },

  // 2. Get all farmers
  getFarmers: async (): Promise<Farmer[]> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/farmers`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<Farmer[]>(response);
    console.log(`✅ Loaded ${Array.isArray(data) ? data.length : 0} farmers from API`);
    return data;
  },

  // 3. Get all vets
  getVets: async (): Promise<Vet[]> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/vets`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Vet[]>(response);
  },

  // 4. Get all animals
  getAnimals: async (): Promise<Animal[]> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/animals`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Animal[]>(response);
  },

  // 5. Get all treatments with optional filters
  getTreatments: async (filters: Record<string, string> = {}): Promise<Treatment[]> => {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/treatments?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<Treatment[]>(response);
  },

  // 6. Get withdrawal violations
  getViolations: async (): Promise<Violation[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/violations`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<Violation[]>(response);
  },

  // 7. Get medicine usage stats
  getMedicineUsage: async (): Promise<MedicineUsage[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/medicine-usage`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<MedicineUsage[]>(response);
  },

  // 8. Get daily treatments
  getDailyTreatments: async (): Promise<DailyTreatments> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/daily-treatments`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<DailyTreatments>(response);
  },

  // 9. Get treatment trends (for line chart)
  getTreatmentTrends: async (): Promise<LineDataPoint[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/treatment-trends`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<LineDataPoint[]>(response);
  },

  // 10. Get animals by species (for bar chart)
  getAnimalsBySpecies: async (): Promise<BarDataPoint[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/animals-by-species`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<BarDataPoint[]>(response);
  },

  // 11. Get farm safety status (for pie chart)
  getFarmSafetyStatus: async (): Promise<PieDataPoint[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/farm-safety-status`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<PieDataPoint[]>(response);
  },

  // 12. Get compliance data (for area chart)
  getComplianceData: async (): Promise<ComplianceDataPoint[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/compliance-data`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<ComplianceDataPoint[]>(response);
  },

  // 13. Get vet activity data
  getVetActivity: async (): Promise<VetActivityDataPoint[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/stats/vet-activity`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<VetActivityDataPoint[]>(response);
  },

  // 14. Test endpoint
  test: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/test`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // 15. Get simplified dashboard data (all in one)
  getSimplifiedDashboard: async (): Promise<SimplifiedDashboard> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/simplified`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<SimplifiedDashboard>(response);
  },

  // 16. Health check
  getHealth: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/health`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // 17. Refresh data
  refreshData: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/test`, {
      headers: getAuthHeaders(),
      cache: 'no-cache'
    });
    return handleResponse(response);
  },

  // 18. Get animals by farmer ID
  getAnimalsByFarmer: async (farmerId: string): Promise<FarmerAnimalResponse[]> => {
    const response = await fetch(
      `${API_BASE_URL}/authority/dashboard/farmer/${farmerId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<FarmerAnimalResponse[]>(response);
  },

  // 19. Get total animals count
  getTotalAnimalsCount: async (): Promise<number> => {
    try {
      const animals = await dashboardAPI.getAnimals();
      return animals.length;
    } catch {
      return 0;
    }
  },

  // 20. Get animal count by farmer ID
  getAnimalCountByFarmer: async (farmerId: string): Promise<number> => {
    try {
      const animals = await dashboardAPI.getAnimalsByFarmer(farmerId);
      return animals.length;
    } catch {
      return 0;
    }
  },
};



// Mock data generators (fallback while API is being developed)
export const generateMockData = {
  lineData: (treatments: Treatment[]): LineDataPoint[] => {
    if (!treatments || treatments.length === 0) {
      return [
        { month: "Jan", treatments: 12 },
        { month: "Feb", treatments: 18 },
        { month: "Mar", treatments: 25 },
        { month: "Apr", treatments: 20 },
        { month: "May", treatments: 30 },
        { month: "Jun", treatments: 22 },
      ];
    }
    
    // Group treatments by month from real data
    const monthMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    treatments.forEach(treatment => {
      if (treatment.treatment_start_date) {
        const date = new Date(treatment.treatment_start_date);
        const month = date.getMonth();
        const monthName = monthNames[month];
        monthMap[monthName] = (monthMap[monthName] || 0) + 1;
      }
    });
    
    return monthNames.slice(0, 6).map(month => ({
      month,
      treatments: monthMap[month] || 0
    }));
  },

  barData: (animals: Animal[]): BarDataPoint[] => {
    if (!animals || animals.length === 0) {
      return [
        { species: "Cattle", count: 120 },
        { species: "Goat", count: 70 },
        { species: "Buffalo", count: 55 },
        { species: "Sheep", count: 45 },
      ];
    }
    
    // Process real animal data by species
    const speciesCount: Record<string, number> = {};
    animals.forEach(animal => {
      const species = animal.species || 'Unknown';
      speciesCount[species] = (speciesCount[species] || 0) + 1;
    });
    
    return Object.entries(speciesCount)
      .map(([species, count]) => ({ species, count }))
      .sort((a, b) => b.count - a.count);
  },

  pieData: (farmers: Farmer[], violations: Violation[] = []): PieDataPoint[] => {
    if (!farmers || farmers.length === 0) {
      return [
        { name: "Safe", value: 82 },
        { name: "Under Withdrawal", value: 18 },
      ];
    }
    
    // Calculate farmers with violations
    const farmerIdsWithViolations = new Set(
      violations.map(v => v.farmer).filter(Boolean)
    );
    
    const unsafeCount = farmerIdsWithViolations.size;
    const safeCount = Math.max(0, farmers.length - unsafeCount);
    
    return [
      { name: 'Safe', value: Math.round((safeCount / farmers.length) * 100) },
      { name: 'Under Withdrawal', value: Math.round((unsafeCount / farmers.length) * 100) }
    ];
  },

  complianceData: (treatments: Treatment[] = []): ComplianceDataPoint[] => {
    if (!treatments || treatments.length === 0) {
      return [
        { month: "Jan", compliant: 85, nonCompliant: 15 },
        { month: "Feb", compliant: 88, nonCompliant: 12 },
        { month: "Mar", compliant: 90, nonCompliant: 10 },
        { month: "Apr", compliant: 87, nonCompliant: 13 },
        { month: "May", compliant: 92, nonCompliant: 8 },
        { month: "Jun", compliant: 94, nonCompliant: 6 },
      ];
    }
    
    // Group treatments by month and calculate compliance
    const monthData: Record<string, {compliant: number, nonCompliant: number}> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    treatments.forEach(treatment => {
      if (treatment.treatment_start_date) {
        const date = new Date(treatment.treatment_start_date);
        const monthIndex = date.getMonth();
        if (monthIndex < 6) {
          const month = monthNames[monthIndex];
          if (!monthData[month]) {
            monthData[month] = { compliant: 0, nonCompliant: 0 };
          }
          
          if (treatment.is_flagged_violation) {
            monthData[month].nonCompliant++;
          } else {
            monthData[month].compliant++;
          }
        }
      }
    });
    
    return monthNames.map(month => ({
      month,
      compliant: monthData[month]?.compliant || 0,
      nonCompliant: monthData[month]?.nonCompliant || 0
    }));
  },

  vetActivityData: (vets: Vet[]): VetActivityDataPoint[] => {
    if (!vets || vets.length === 0) {
      return [
        { day: "Mon", visits: 12 },
        { day: "Tue", visits: 15 },
        { day: "Wed", visits: 18 },
        { day: "Thu", visits: 14 },
        { day: "Fri", visits: 20 },
        { day: "Sat", visits: 10 },
        { day: "Sun", visits: 8 },
      ];
    }
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      visits: Math.floor(Math.random() * 12) + 8
    }));
  },

  medicineUsageData: (treatments: Treatment[]): MedicineUsage[] => {
    if (!treatments || treatments.length === 0) {
      return [
        { medicine: "Antibiotic A", count: 45 },
        { medicine: "Vaccine X", count: 38 },
        { medicine: "Painkiller Y", count: 32 },
        { medicine: "Antibiotic B", count: 28 },
      ];
    }
    
    const medicineCount: Record<string, number> = {};
    
    treatments.forEach(treatment => {
      if (treatment.medicines && Array.isArray(treatment.medicines)) {
        treatment.medicines.forEach(med => {
          const name = med.name || 'Unknown';
          medicineCount[name] = (medicineCount[name] || 0) + 1;
        });
      }
    });
    
    return Object.entries(medicineCount)
      .map(([medicine, count]) => ({ medicine, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  // Generate mock dashboard data
  mockDashboard: (): SimplifiedDashboard => {
    return {
      overview: {
        total_farmers: 143,
        total_veterinarians: 24,
        total_animals: 987,
        total_treatments: 436,
        pending_verifications: 8
      },
      today_treatments: 12,
      violations_count: 5,
      farm_safety: {
        safe: 118,
        unsafe: 25
      },
      charts: {
        treatment_trends: [
          { month: "Jan", treatments: 12 },
          { month: "Feb", treatments: 18 },
          { month: "Mar", treatments: 25 },
          { month: "Apr", treatments: 20 },
          { month: "May", treatments: 30 },
          { month: "Jun", treatments: 22 },
        ],
        animals_by_species: [
          { species: "Cattle", count: 120 },
          { species: "Goat", count: 70 },
          { species: "Buffalo", count: 55 },
          { species: "Sheep", count: 45 },
        ],
        farm_safety_status: [
          { name: "Safe", value: 82 },
          { name: "Under Withdrawal", value: 18 }
        ]
      }
    };
  }
};

// Utility function to test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/test`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Enhanced API connection test with debugging
export const testApiConnectionDetailed = async (): Promise<{
  connected: boolean;
  message: string;
  data?: any;
}> => {
  try {
    console.log('🔍 Testing API connection to:', `${API_BASE_URL}/authority/dashboard/test`);
    const response = await fetch(`${API_BASE_URL}/authority/dashboard/test`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      console.error('❌ API test failed with status:', response.status);
      return {
        connected: false,
        message: `API responded with status ${response.status}`
      };
    }
    
    const data = await response.json();
    console.log('✅ API test response:', data);
    
    return {
      connected: true,
      message: 'API connection successful',
      data
    };
  } catch (error) {
    console.error('❌ API test error:', error);
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
};

// Health check
export const healthCheck = async (): Promise<{service: string; status: string}> => {
  const response = await fetch(`${API_BASE_URL}/authority/dashboard/health`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};