import { useState, useEffect } from 'react';
import StatCard from "../components/StatCard";
import { FiUsers, FiTag, FiShield, FiActivity, FiBarChart2, FiAlertTriangle, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { MdOutlineVaccines } from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import "../styles/Dashboard.css";
import {
  dashboardAPI,
  generateMockData,
  OverviewData,
  SimplifiedDashboard,
  LineDataPoint,
  BarDataPoint,
  PieDataPoint,
  ComplianceDataPoint,
  VetActivityDataPoint,
  testApiConnection
} from "../services/api";

const PIE_COLORS = ["#10b981", "#f97316"];
const GREEN_COLOR = "#10b981";
const ORANGE_COLOR = "#f97316";
const BLUE_COLOR = "#3b82f6";

// Define default dashboard data
const DEFAULT_DASHBOARD_DATA: SimplifiedDashboard = {
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

// Define interface for chart data state
interface ChartDataState {
  lineData: LineDataPoint[];
  barData: BarDataPoint[];
  pieData: PieDataPoint[];
  complianceData: ComplianceDataPoint[];
  vetActivityData: VetActivityDataPoint[];
  medicineUsage: Array<{ medicine: string; count: number }>;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [dashboardData, setDashboardData] = useState<SimplifiedDashboard>(DEFAULT_DASHBOARD_DATA);

  const [chartData, setChartData] = useState<ChartDataState>({
    lineData: DEFAULT_DASHBOARD_DATA.charts.treatment_trends,
    barData: DEFAULT_DASHBOARD_DATA.charts.animals_by_species,
    pieData: DEFAULT_DASHBOARD_DATA.charts.farm_safety_status,
    complianceData: [],
    vetActivityData: [],
    medicineUsage: []
  });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    setApiStatus('checking');

    try {
      // First, test if API is connected
      const isConnected = await testApiConnection();
      setApiStatus(isConnected ? 'connected' : 'disconnected');

      if (isConnected) {
        try {
          console.log('📡 API connected, fetching dashboard data...');

          // Get simplified dashboard data (all in one call)
          const response = await dashboardAPI.getSimplifiedDashboard();
          const simplifiedData = response?.data ?? response;

          if (simplifiedData && simplifiedData.overview) {
            setDashboardData(simplifiedData);
          } else {
            console.error("Invalid dashboard response:", response);
            throw new Error("Invalid dashboard data received");
          }


          // Try to fetch individual chart data (but don't fail if some fail)
          const fetchPromises = [
            dashboardAPI.getTreatmentTrends().catch(() => simplifiedData.charts.treatment_trends),
            dashboardAPI.getAnimalsBySpecies().catch(() => simplifiedData.charts.animals_by_species),
            dashboardAPI.getFarmSafetyStatus().catch(() => simplifiedData.charts.farm_safety_status),
            dashboardAPI.getComplianceData().catch(() => generateMockData.complianceData()),
            dashboardAPI.getVetActivity().catch(() => []),
            dashboardAPI.getMedicineUsage().catch(() => []),
            dashboardAPI.getDailyTreatments().catch(() => ({ today_treatments: simplifiedData.today_treatments || 0 })),
            dashboardAPI.getViolations().catch(() => [])
          ];

          const [
            treatmentTrends,
            animalsBySpecies,
            farmSafetyStatus,
            complianceData,
            vetActivity,
            medicineUsage,
            dailyTreatments,
            violations
          ] = await Promise.all(fetchPromises);

          // Set all chart data
          setChartData({
            lineData: Array.isArray(treatmentTrends) ? treatmentTrends : [],
            barData: Array.isArray(animalsBySpecies) ? animalsBySpecies : [],
            pieData: Array.isArray(farmSafetyStatus) ? farmSafetyStatus : [],
            complianceData: Array.isArray(complianceData) ? complianceData : [],
            vetActivityData: Array.isArray(vetActivity) ? vetActivity : [],
            medicineUsage: Array.isArray(medicineUsage) ? medicineUsage : []
          });


          console.log('📊 Data loaded successfully');

        } catch (apiError) {
          console.error('Error fetching dashboard data:', apiError);
          setError(`API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          setApiStatus('disconnected');

          // Use default data on API error
          setDashboardData(DEFAULT_DASHBOARD_DATA);
          setChartData({
            lineData: DEFAULT_DASHBOARD_DATA.charts.treatment_trends,
            barData: DEFAULT_DASHBOARD_DATA.charts.animals_by_species,
            pieData: DEFAULT_DASHBOARD_DATA.charts.farm_safety_status,
            complianceData: generateMockData.complianceData(),
            vetActivityData: [],
            medicineUsage: []
          });
        }
      } else {
        console.log('🌐 API not reachable, using mock data');
        setError('API server is not reachable. Using mock data.');
        setApiStatus('disconnected');

        // Use mock data
        const mockData = generateMockData.mockDashboard();
        setDashboardData(mockData);
        setChartData({
          lineData: mockData.charts.treatment_trends,
          barData: mockData.charts.animals_by_species,
          pieData: mockData.charts.farm_safety_status,
          complianceData: generateMockData.complianceData(),
          vetActivityData: [],
          medicineUsage: []
        });
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setApiStatus('disconnected');

      // Always fallback to default data
      setDashboardData(DEFAULT_DASHBOARD_DATA);
      setChartData({
        lineData: DEFAULT_DASHBOARD_DATA.charts.treatment_trends,
        barData: DEFAULT_DASHBOARD_DATA.charts.animals_by_species,
        pieData: DEFAULT_DASHBOARD_DATA.charts.farm_safety_status,
        complianceData: generateMockData.complianceData(),
        vetActivityData: [],
        medicineUsage: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch real-time data for specific charts
  const fetchRealChartData = async () => {
    try {
      console.log('🔄 Refreshing chart data...');
      const [treatmentTrends, animalsBySpecies, farmSafetyStatus] = await Promise.all([
        dashboardAPI.getTreatmentTrends(),
        dashboardAPI.getAnimalsBySpecies(),
        dashboardAPI.getFarmSafetyStatus()
      ]);

      setChartData(prev => ({
        ...prev,
        lineData: treatmentTrends,
        barData: animalsBySpecies,
        pieData: farmSafetyStatus
      }));
      console.log('✅ Chart data refreshed');
    } catch (error) {
      console.log('Failed to fetch updated chart data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchDashboardData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate derived statistics with safe defaults
  const totalFarmers = dashboardData?.overview?.total_farmers || 143;
  const totalAnimals = dashboardData?.overview?.total_animals || 987;
  const totalVets = dashboardData?.overview?.total_veterinarians || 24;
  const totalTreatments = dashboardData?.overview?.total_treatments || 436;
  const pendingVerifications = dashboardData?.overview?.pending_verifications || 8;
  const todayTreatments = dashboardData?.today_treatments || 0;
  const violationsCount = dashboardData?.violations_count || 0;

  // Calculate safety metrics from dashboard data or use defaults
  const safeFarms = dashboardData?.farm_safety?.safe || Math.floor(totalFarmers * 0.82);
  const underWithdrawal = dashboardData?.farm_safety?.unsafe || totalFarmers - safeFarms;
  const activeMonitoring = Math.floor(totalFarmers * 0.54); // Default calculation
  const complianceRate = Math.min(94, 100 - (pendingVerifications / Math.max(totalFarmers, 1)) * 100);

  // Calculate total animals from bar chart data
  const totalAnimalsFromChart = Array.isArray(chartData.barData)
    ? chartData.barData.reduce((sum, item) => sum + item.count, 0)
    : 0;

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
          {apiStatus === 'checking' && <p className="api-status">Checking API connection...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Top Header */}
      <header className="page-head">
        <div>
          <h2>AMU Dashboard</h2>
          <p>Authority overview of antimicrobial usage and farm safety</p>
          <span className="page-date">{today}</span>
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
            onClick={fetchDashboardData}
            aria-label="Refresh data"
            title="Refresh dashboard data"
            disabled={loading}
          >
            <FiRefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
          <button className="head-icon-btn" aria-label="Notifications">
            🔔
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchDashboardData} disabled={loading}>
            {loading ? 'Retrying...' : 'Retry Connection'}
          </button>
        </div>
      )}

      {/* KPI Cards - Row 1 */}
      <section className="grid-4">
        <StatCard
          title="Total Farmers"
          value={totalFarmers}
          subtitle="Registered in system"
          badge={`${pendingVerifications} pending verification`}
          icon={<FiUsers size={20} />}
          accent="green"
        />
        <StatCard
          title="Total Animals"
          value={totalAnimalsFromChart || totalAnimals}
          subtitle="Across all farms"
          badge={`${chartData.barData.length} species`}
          icon={<FiTag size={20} />}
          accent="green"
        />
        <StatCard
          title="Total Vets"
          value={totalVets}
          subtitle="Active veterinarians"
          badge="All verified"
          icon={<FiShield size={20} />}
          accent="blue"
        />
        <StatCard
          title="Total Treatments"
          value={totalTreatments}
          subtitle="Logged this year"
          badge={`${todayTreatments} today`}
          icon={<MdOutlineVaccines size={20} />}
          accent="green"
        />
      </section>

      {/* KPI Cards - Row 2 */}
      <section className="grid-4 mt-24">
        <StatCard
          title="Safe Farms"
          value={safeFarms}
          subtitle="No active withdrawal"
          badge={`${Math.floor((safeFarms / Math.max(totalFarmers, 1)) * 100)}% safe`}
          icon={<FiCheckCircle size={20} />}
          accent="green"
        />
        <StatCard
          title="Under Withdrawal"
          value={underWithdrawal}
          subtitle="Monitoring samples closely"
          badge={`${violationsCount} violations`}
          icon={<FiAlertTriangle size={20} />}
          accent="orange"
        />
        <StatCard
          title="Active Monitoring"
          value={activeMonitoring}
          subtitle="Farms sending daily data"
          badge="Realtime"
          icon={<FiActivity size={20} />}
          accent="blue"
        />
        <StatCard
          title="Compliance Rate"
          value={`${Math.round(complianceRate)}%`}
          subtitle="MRL standards met"
          badge={complianceRate >= 90 ? "Excellent" : "Needs attention"}
          icon={<FiBarChart2 size={20} />}
          accent={complianceRate >= 90 ? "green" : "orange"}
        />
      </section>

      {/* Charts row 1 - Main Analytics */}
      <section className="charts-wrap mt-24">
        {/* Line chart card - Green hover */}
        <div className="dashboard-card chart-card" data-theme="green">
          <div className="chart-card-head">
            <div>
              <h3>Treatments per Month</h3>
              <p>Track antimicrobial treatments over time</p>
            </div>
            <div className="chart-actions">
              <span className="chip chip-green">This year</span>
              <button
                className="chart-refresh-btn"
                onClick={fetchRealChartData}
                title="Update chart data"
                disabled={apiStatus === 'disconnected'}
              >
                <FiRefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="chart-container">
            {chartData.lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value) => [`${value} treatments`, 'Count']}
                  />
                  <Line
                    type="monotone"
                    dataKey="treatments"
                    stroke={GREEN_COLOR}
                    strokeWidth={3}
                    dot={{ r: 5, fill: GREEN_COLOR }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No treatment data available
              </div>
            )}
          </div>
        </div>

        {/* Bar chart card - Green hover */}
        <div className="dashboard-card chart-card" data-theme="green">
          <div className="chart-card-head">
            <div>
              <h3>Animals by Species</h3>
              <p>Distribution of animals across registered farms</p>
            </div>
            <div className="chart-actions">
              <span className={`chip ${apiStatus === 'connected' ? 'chip-green' : 'chip-orange'}`}>
                <FiBarChart2 size={14} />
                {apiStatus === 'connected' ? 'Live Data' : 'Mock Data'}
              </span>
            </div>
          </div>

          <div className="chart-container">
            {chartData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="species" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value) => [`${value} animals`, 'Count']}
                  />
                  <Bar dataKey="count" fill={GREEN_COLOR} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No animal data available
              </div>
            )}
          </div>
        </div>

        {/* Pie chart card - Orange hover */}
        <div className="dashboard-card chart-card" data-theme="orange">
          <div className="chart-card-head">
            <div>
              <h3>Farm Safety Status</h3>
              <p>Share of farms safe vs under withdrawal</p>
            </div>
            <div className="chart-actions">
              <span className={`chip ${apiStatus === 'connected' ? 'chip-green' : 'chip-orange'}`}>
                {apiStatus === 'connected' ? 'Live' : 'Mock'}
              </span>
            </div>
          </div>

          <div className="chart-container">
            {chartData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={(entry) => `${entry.value}%`}
                    labelLine={false}
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No safety data available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Charts row 2 - Additional Monitoring */}
      <section className="charts-wrap-2 mt-24">
        {/* Compliance Trend Area Chart - Green hover */}
        <div className="dashboard-card chart-card" data-theme="green">
          <div className="chart-card-head">
            <div>
              <h3>Compliance Monitoring</h3>
              <p>Monthly compliance vs non-compliance rate</p>
            </div>
            <span className="chip chip-green">6 Months</span>
          </div>

          <div className="chart-container">
            {chartData.complianceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.complianceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value, name) => {
                      const label = name === 'compliant' ? 'Compliant' : 'Non-Compliant';
                      return [`${value}%`, label];
                    }}
                  />
                  <Legend
                    formatter={(value) => value === 'compliant' ? 'Compliant' : 'Non-Compliant'}
                  />
                  <Area
                    type="monotone"
                    dataKey="compliant"
                    stackId="1"
                    stroke={GREEN_COLOR}
                    fill={GREEN_COLOR}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="nonCompliant"
                    stackId="1"
                    stroke={ORANGE_COLOR}
                    fill={ORANGE_COLOR}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No compliance data available
              </div>
            )}
          </div>
        </div>

        {/* Vet Activity Chart - Blue hover */}
        <div className="dashboard-card chart-card" data-theme="blue">
          <div className="chart-card-head">
            <div>
              <h3>Vet Activity (This Week)</h3>
              <p>Daily farm visits by registered veterinarians</p>
            </div>
            <span className="chip chip-blue">Weekly</span>
          </div>

          <div className="chart-container">
            {chartData.vetActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.vetActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value) => [`${value} visits`, 'Count']}
                  />
                  <Bar dataKey="visits" fill={BLUE_COLOR} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                No vet activity data available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Medicine Usage Section */}
      {chartData.medicineUsage.length > 0 && (
        <section className="medicine-usage mt-24">
          <div className="dashboard-card">
            <div className="summary-header">
              <h3>Top Medicines Usage</h3>
              <div className="data-source-info">
                <span className="data-source">
                  Based on {chartData.medicineUsage.reduce((sum, item) => sum + item.count, 0)} treatments
                </span>
              </div>
            </div>
            <div className="medicine-list">
              {chartData.medicineUsage.map((item, index) => (
                <div key={index} className="medicine-item">
                  <span className="medicine-name">{item.medicine}</span>
                  <div className="medicine-bar">
                    <div
                      className="medicine-fill"
                      style={{
                        width: `${(item.count / Math.max(...chartData.medicineUsage.map(m => m.count), 1)) * 90}%`,
                        backgroundColor: index === 0 ? GREEN_COLOR : BLUE_COLOR
                      }}
                    />
                  </div>
                  <span className="medicine-count">{item.count} uses</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Data Summary Section */}
      <section className="data-summary mt-24">
        <div className="dashboard-card">
          <div className="summary-header">
            <h3>Real-time Data Summary</h3>
            <div className="data-source-info">
              <span className="data-source">
                Data Source: {apiStatus === 'connected' ? 'Live API' : 'Mock Data'}
              </span>
              <span className="last-updated">
                Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Farmers with pending verification:</span>
              <span className="summary-value">{pendingVerifications}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Active withdrawal violations:</span>
              <span className="summary-value">{violationsCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Treatments today:</span>
              <span className="summary-value">{todayTreatments}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total farms:</span>
              <span className="summary-value">{totalFarmers}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Safe farms:</span>
              <span className="summary-value">{safeFarms}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Farms under withdrawal:</span>
              <span className="summary-value">{underWithdrawal}</span>
            </div>
          </div>
        </div>
      </section>

      {/* API Status Information */}
      {apiStatus === 'disconnected' && (
        <section className="api-info mt-24">
          <div className="dashboard-card info-card">
            <div className="info-header">
              <FiAlertTriangle className="info-icon" />
              <h3>Development Mode</h3>
            </div>
            <p>
              The dashboard is currently displaying mock data because the API server
              is not reachable. This is normal during development.
            </p>
            <div className="info-actions">
              <button onClick={fetchDashboardData} className="btn-primary" disabled={loading}>
                {loading ? 'Reconnecting...' : 'Try Reconnecting'}
              </button>
              <a
                href="http://127.0.0.1:5000/authority/dashboard/test"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Test API Directly
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// test change for git commit
// git push test - Prathamesh
