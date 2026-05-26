import React, { useState } from "react";
import "./BuyMedicine.css";
import { useNavigate } from "react-router-dom";
import { FaUpload, FaPrescriptionBottleAlt, FaUserMd } from "react-icons/fa";

const restrictedCategories = [
  "Antibiotics",
  "Injectables",
  "Hormonal Medicines",
  "Strong Anti-parasitics",
  "Vaccines",
];

const BuyMedicine = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [file, setFile] = useState<File | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const handleUploadClick = () => {
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    if (!file) {
      alert("Please upload prescription");
      return;
    }

    console.log("Uploading:", file);
  };

  return (
    <>
      <div className="buy-container">

        {/* LEFT - UPLOAD */}
        <div className="upload-box">

          <h2><FaUpload /> Upload Prescription</h2>

          <div
            className="upload-area"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/3097/3097412.png"
              alt="upload"
            />

            <p>Click or Drag & Drop your prescription</p>
            <span>Supports JPG, PNG, PDF</span>
          </div>

          <input
            id="fileInput"
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          {file && <p className="file-name">📄 {file.name}</p>}

          <button onClick={handleUploadClick}>
            Upload & Continue
          </button>

          {/* STEPS */}
          <div className="steps">
            <div><FaPrescriptionBottleAlt /> Upload Prescription</div>
            <div><FaUserMd /> Verified by Pharmacist</div>
            <div>💊 Get Medicines Delivered</div>
          </div>

        </div>

        {/* RIGHT - INFO */}
        <div className="info-box">

          <h2>Why Prescription Required?</h2>

          <p>
            Certain medicines require a valid prescription to ensure safe usage.
            These medicines may have strong effects and must be monitored by a doctor.
          </p>

          <h3>Restricted Medicines</h3>

          <div className="category-list">
            {restrictedCategories.map((cat) => (
              <div key={cat} className="category-pill">
                💊 {cat}
              </div>
            ))}
          </div>

          <div className="note">
            <FaUserMd /> Our certified pharmacist will verify your prescription before delivery.
          </div>

        </div>

      </div>

      {/* LOGIN POPUP */}
      {showLoginPopup && (
        <div className="popup-overlay">
          <div className="popup-box">

            <h3>🔐 Login Required</h3>
            <p>Please login to upload prescription</p>

            <button onClick={() => navigate("/login")}>
              Login
            </button>

            <span onClick={() => setShowLoginPopup(false)}>Cancel</span>

          </div>
        </div>
      )}
    </>
  );
};

export default BuyMedicine;