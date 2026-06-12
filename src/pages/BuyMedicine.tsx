import React, { useState } from "react";
import "./BuyMedicine.css";
import { useNavigate } from "react-router-dom";
import { FaUpload, FaPrescriptionBottleAlt, FaUserMd, FaCheckCircle } from "react-icons/fa";
import API from "../services/api";
import { toast } from "react-toastify";

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
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleUploadClick = () => {
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    if (!file) {
      toast.error("Please upload prescription");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await API.post("/orders", {
          items: [],
          payment_mode: "COD",
          prescription_image: base64String,
        });
        setShowSuccessModal(true);
      } catch (err: any) {
        console.error("Order error", err);
        const msg = err.response?.data?.message || "Failed to place order";
        if (msg.toLowerCase().includes("address are required")) {
          toast.error("Please update your delivery address in your Profile before placing an order.");
        } else {
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
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

          <button onClick={handleUploadClick} disabled={loading}>
            {loading ? "Processing..." : "Upload & Continue"}
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

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="popup-overlay">
          <div className="popup-box success-box">
            <div className="success-icon"><FaCheckCircle size={40} color="#16a34a" /></div>
            <h3>Order Placed Successfully!</h3>
            <p>Our pharmacist will review your prescription and connect with you soon.</p>
            <button onClick={() => navigate("/profile")}>Go to My Orders</button>
            <span onClick={() => { setShowSuccessModal(false); navigate("/"); }}>Back to Home</span>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyMedicine;