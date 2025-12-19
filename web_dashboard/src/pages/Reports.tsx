import { useState, useEffect } from "react";
import { FiDownload, FiFileText, FiBarChart2, FiPieChart, FiTrendingUp } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/Reports.css";
import { dashboardAPI } from "../services/api";

export default function Reports() {
  const [reportType, setReportType] = useState("all");
  const [dateRange, setDateRange] = useState("month");
  const [isExporting, setIsExporting] = useState(false);

  // State for real statistics
  const [stats, setStats] = useState({
    totalTreatments: 0,
    activeFarms: 0,
    complianceRate: 0,
    violations: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch real statistics on component mount
  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoadingStats(true);
      try {
        const [treatments, farmers, violations] = await Promise.all([
          dashboardAPI.getTreatments(),
          dashboardAPI.getFarmers(),
          dashboardAPI.getViolations()
        ]);

        // Calculate statistics
        const totalTreatments = treatments.length;
        const activeFarms = farmers.filter(f => f.is_verified).length;
        const totalViolations = violations.length;

        // Calculate compliance rate
        const complianceRate = totalTreatments > 0
          ? Math.round(((totalTreatments - totalViolations) / totalTreatments) * 100)
          : 100;

        setStats({
          totalTreatments,
          activeFarms,
          complianceRate,
          violations: totalViolations
        });
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatistics();
  }, []);

  // Helper function to convert array to CSV
  const convertToCSV = (data: any[], headers: string[]) => {
    if (!data || data.length === 0) return '';

    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  };

  // Helper function to download file
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // PDF Export - Treatment Records
  const exportTreatmentsPDF = async () => {
    setIsExporting(true);
    try {
      const treatments = await dashboardAPI.getTreatments();

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Treatment Records Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = treatments.slice(0, 50).map(t => [
        t._id?.slice(-6) || 'N/A',
        t.treatment_start_date || 'N/A',
        t.farmer || 'N/A',
        t.animal || 'N/A',
        t.diagnosis || 'N/A',
        t.status || 'pending',
        t.is_flagged_violation ? 'Yes' : 'No'
      ]);

      autoTable(doc, {
        head: [['Treatment ID', 'Date', 'Farmer', 'Animal', 'Diagnosis', 'Status', 'Flagged']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { top: 10 }
      });

      doc.save(`treatment-records-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Treatment records PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export - Farmers
  const exportFarmersPDF = async () => {
    setIsExporting(true);
    try {
      const farmers = await dashboardAPI.getFarmers();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Farmer Database Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = farmers.slice(0, 50).map(f => [
        f._id?.slice(-6) || 'N/A',
        f.name,
        f.email || 'N/A',
        f.mobile || 'N/A',
        f.is_verified ? 'Yes' : 'No'
      ]);

      autoTable(doc, {
        head: [['Farmer ID', 'Name', 'Email', 'Mobile', 'Verified']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.save(`farmer-database-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Farmer database PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export - Animals
  const exportAnimalsPDF = async () => {
    setIsExporting(true);
    try {
      const animals = await dashboardAPI.getAnimals();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Animal Inventory Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = animals.slice(0, 50).map(a => [
        a._id?.slice(-6) || 'N/A',
        a.tag_number || 'N/A',
        a.species,
        a.breed || 'N/A',
        a.age || 'N/A',
        a.gender || 'N/A'
      ]);

      autoTable(doc, {
        head: [['Animal ID', 'Tag', 'Species', 'Breed', 'Age', 'Gender']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [139, 92, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.save(`animal-inventory-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Animal inventory PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export - Compliance
  const exportCompliancePDF = async () => {
    setIsExporting(true);
    try {
      const violations = await dashboardAPI.getViolations();

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Compliance Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = violations.slice(0, 50).map(v => [
        v._id?.slice(-6) || 'N/A',
        v.farmer || 'N/A',
        v.animal || 'N/A',
        v.treatment_start_date || 'N/A',
        v.reason || 'N/A',
        v.status || 'pending'
      ]);

      autoTable(doc, {
        head: [['Violation ID', 'Farmer', 'Animal', 'Date', 'Reason', 'Status']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [245, 158, 11],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.save(`compliance-report-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Compliance report PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export - Medicine Usage
  const exportMedicineUsagePDF = async () => {
    setIsExporting(true);
    try {
      const medicineUsage = await dashboardAPI.getMedicineUsage();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Medicine Usage Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = medicineUsage.map(m => [
        m.medicine,
        m.count.toString()
      ]);

      autoTable(doc, {
        head: [['Medicine Name', 'Usage Count']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.save(`medicine-usage-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Medicine usage PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export - Vets
  const exportVetsPDF = async () => {
    setIsExporting(true);
    try {
      const vets = await dashboardAPI.getVets();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Veterinarian Activity Report', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      const tableData = vets.slice(0, 50).map(v => [
        v._id?.slice(-6) || 'N/A',
        v.name,
        v.email || 'N/A',
        v.mobile || 'N/A',
        v.specialization?.join(', ') || 'N/A',
        v.is_verified ? 'Yes' : 'No'
      ]);

      autoTable(doc, {
        head: [['Vet ID', 'Name', 'Email', 'Mobile', 'Specialization', 'Verified']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.save(`veterinarian-activity-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Veterinarian activity PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Exports
  const exportTreatmentsCSV = async () => {
    setIsExporting(true);
    try {
      const treatments = await dashboardAPI.getTreatments();

      const csvData = treatments.map(t => ({
        'Treatment ID': t._id,
        'Treatment Date': t.treatment_start_date,
        'Farmer ID': t.farmer || 'N/A',
        'Animal ID': t.animal || 'N/A',
        'Vet ID': t.vet || 'N/A',
        'Diagnosis': t.diagnosis || 'N/A',
        'Status': t.status || 'pending',
        'Withdrawal End': t.withdrawal_ends_on || 'N/A',
        'Flagged': t.is_flagged_violation ? 'Yes' : 'No'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      downloadFile(
        csv,
        `treatment-records-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );

      alert('Treatment records exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportFarmersCSV = async () => {
    setIsExporting(true);
    try {
      const farmers = await dashboardAPI.getFarmers();

      const csvData = farmers.map(f => ({
        'Farmer ID': f._id,
        'Name': f.name,
        'Email': f.email || 'N/A',
        'Mobile': f.mobile || 'N/A',
        'Verified': f.is_verified ? 'Yes' : 'No',
        'Created Date': f.created_at || 'N/A'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      downloadFile(
        csv,
        `farmer-database-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );

      alert('Farmer database exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAnimalsCSV = async () => {
    setIsExporting(true);
    try {
      const animals = await dashboardAPI.getAnimals();

      const csvData = animals.map(a => ({
        'Animal ID': a._id,
        'Tag Number': a.tag_number || 'N/A',
        'Species': a.species,
        'Breed': a.breed || 'N/A',
        'Age': a.age || 'N/A',
        'Gender': a.gender || 'N/A',
        'Farmer ID': a.farmer,
        'Created Date': a.created_at || 'N/A'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      downloadFile(
        csv,
        `animal-inventory-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );

      alert('Animal inventory exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportVetsCSV = async () => {
    setIsExporting(true);
    try {
      const vets = await dashboardAPI.getVets();

      const csvData = vets.map(v => ({
        'Vet ID': v._id,
        'Name': v.name,
        'Email': v.email || 'N/A',
        'Mobile': v.mobile || 'N/A',
        'Specialization': v.specialization?.join(', ') || 'N/A',
        'Verified': v.is_verified ? 'Yes' : 'No',
        'Created Date': v.created_at || 'N/A'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      downloadFile(
        csv,
        `veterinarian-activity-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );

      alert('Veterinarian activity exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportComplianceCSV = async () => {
    setIsExporting(true);
    try {
      const violations = await dashboardAPI.getViolations();

      const csvData = violations.map(v => ({
        'Violation ID': v._id,
        'Farmer ID': v.farmer || 'N/A',
        'Animal ID': v.animal || 'N/A',
        'Treatment Date': v.treatment_start_date || 'N/A',
        'Medicine': v.medicines?.map(m => m.name).join(', ') || 'N/A',
        'Reason': v.reason || 'N/A',
        'Status': v.status || 'pending'
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      downloadFile(
        csv,
        `compliance-report-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );

      alert('Compliance report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportMedicineUsageCSV = async () => {
    setIsExporting(true);
    try {
      const medicineUsage = await dashboardAPI.getMedicineUsage();

      const csvData = medicineUsage.map(m => ({
        'Medicine Name': m.medicine,
        'Usage Count': m.count
      }));

      const headers = Object.keys(csvData[0] || {});
      const csv = convertToCSV(csvData, headers);

      downloadFile(
        csv,
        `medicine-usage-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );

      alert('Medicine usage exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await Promise.all([
        exportTreatmentsCSV(),
        exportFarmersCSV(),
        exportAnimalsCSV(),
        exportVetsCSV(),
        exportComplianceCSV(),
        exportMedicineUsageCSV()
      ]);
    } catch (error) {
      console.error('Bulk export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="reports-page">
      {/* Page Header */}
      <div className="page-header">
        <h2>Reports</h2>
        <p>Download usage, treatments and compliance reports</p>
      </div>

      {/* Filter Card */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="report-type">Report Type</label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="all">All Reports</option>
              <option value="treatments">Treatments</option>
              <option value="farmers">Farmers</option>
              <option value="animals">Animals</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date-range">Date Range</label>
            <select
              id="date-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="start-date">Start Date</label>
            <input
              type="date"
              id="start-date"
              disabled={dateRange !== 'custom'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-date">End Date</label>
            <input
              type="date"
              id="end-date"
              disabled={dateRange !== 'custom'}
            />
          </div>
        </div>
      </div>

      {/* Statistics Section with Real Data */}
      <div className="stats-section">
        <h3>Report Summary</h3>
        {isLoadingStats ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            Loading statistics...
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Treatments</span>
              <span className="stat-value green">{stats.totalTreatments}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Farms</span>
              <span className="stat-value">{stats.activeFarms}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Compliance Rate</span>
              <span className={`stat-value ${stats.complianceRate >= 90 ? 'green' : 'orange'}`}>
                {stats.complianceRate}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Violations</span>
              <span className="stat-value orange">{stats.violations}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {/* Treatment Report */}
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-icon green">
              <FiFileText size={24} />
            </div>
            <div className="report-card-title">
              <h3>Treatment Records</h3>
              <p>Complete treatment history</p>
            </div>
          </div>
          <div className="report-card-body">
            <p>
              Detailed records of all antimicrobial treatments including medicine names,
              dosages, withdrawal periods, and vet information.
            </p>
          </div>
          <div className="report-card-footer">
            <button
              className="export-btn"
              onClick={exportTreatmentsCSV}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              CSV
            </button>
            <button
              className="export-btn primary"
              onClick={exportTreatmentsPDF}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Farmer Report */}
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-icon blue">
              <FiBarChart2 size={24} />
            </div>
            <div className="report-card-title">
              <h3>Farmer Database</h3>
              <p>Registered farmer details</p>
            </div>
          </div>
          <div className="report-card-body">
            <p>
              Complete database of registered farmers with contact information,
              verification status, and animal counts.
            </p>
          </div>
          <div className="report-card-footer">
            <button
              className="export-btn"
              onClick={exportFarmersCSV}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              CSV
            </button>
            <button
              className="export-btn primary"
              onClick={exportFarmersPDF}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Animal Report */}
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-icon purple">
              <FiPieChart size={24} />
            </div>
            <div className="report-card-title">
              <h3>Animal Inventory</h3>
              <p>Livestock registration data</p>
            </div>
          </div>
          <div className="report-card-body">
            <p>
              Comprehensive inventory of all registered animals including species,
              breeds, tag numbers, and health status.
            </p>
          </div>
          <div className="report-card-footer">
            <button
              className="export-btn"
              onClick={exportAnimalsCSV}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              CSV
            </button>
            <button
              className="export-btn primary"
              onClick={exportAnimalsPDF}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Compliance Report */}
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-icon orange">
              <FiTrendingUp size={24} />
            </div>
            <div className="report-card-title">
              <h3>Compliance Report</h3>
              <p>Withdrawal and violations</p>
            </div>
          </div>
          <div className="report-card-body">
            <p>
              Analysis of withdrawal period compliance, violation reports,
              and farm safety status for regulatory review.
            </p>
          </div>
          <div className="report-card-footer">
            <button
              className="export-btn"
              onClick={exportComplianceCSV}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              CSV
            </button>
            <button
              className="export-btn primary"
              onClick={exportCompliancePDF}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Medicine Usage Report */}
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-icon green">
              <FiBarChart2 size={24} />
            </div>
            <div className="report-card-title">
              <h3>Medicine Usage</h3>
              <p>AMU statistics and trends</p>
            </div>
          </div>
          <div className="report-card-body">
            <p>
              Detailed antimicrobial usage statistics showing medicine types,
              frequency, and trends over time.
            </p>
          </div>
          <div className="report-card-footer">
            <button
              className="export-btn"
              onClick={exportMedicineUsageCSV}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              CSV
            </button>
            <button
              className="export-btn primary"
              onClick={exportMedicineUsagePDF}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Vet Activity Report */}
        <div className="report-card">
          <div className="report-card-header">
            <div className="report-icon blue">
              <FiTrendingUp size={24} />
            </div>
            <div className="report-card-title">
              <h3>Veterinarian Activity</h3>
              <p>Vet performance metrics</p>
            </div>
          </div>
          <div className="report-card-body">
            <p>
              Veterinarian activity logs including visit frequency, treatments
              prescribed, and farmer coverage area.
            </p>
          </div>
          <div className="report-card-footer">
            <button
              className="export-btn"
              onClick={exportVetsCSV}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              CSV
            </button>
            <button
              className="export-btn primary"
              onClick={exportVetsPDF}
              disabled={isExporting}
            >
              <FiDownload size={16} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-btn primary"
          onClick={handleExportAll}
          disabled={isExporting}
        >
          <FiDownload size={20} />
          {isExporting ? 'Exporting...' : 'Export All Reports (CSV)'}
        </button>
      </div>
    </div>
  );
}
