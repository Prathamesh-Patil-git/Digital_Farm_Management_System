import { FiDownload } from "react-icons/fi";
import "../styles/Reports.css";

export default function Reports() {
  const handleExportCSV = () => {
    console.log("Exporting CSV...");
    // Add CSV export logic here
  };

  const handleExportPDF = () => {
    console.log("Exporting PDF...");
    // Add PDF export logic here
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Reports</h2>
        <p>Download usage, treatments and compliance reports</p>
      </div>

      <div className="empty-note">
        Static placeholder — add CSV/PDF export later.
      </div>

      {/* Future Export Buttons */}
      {/* <div className="export-buttons">
        <button className="btn-export" onClick={handleExportCSV}>
          <FiDownload /> Export as CSV
        </button>
        <button className="btn-export" onClick={handleExportPDF}>
          <FiDownload /> Export as PDF
        </button>
      </div> */}
    </div>
  );
}
