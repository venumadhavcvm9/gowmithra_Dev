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

  const [files, setFiles] = useState<File[]>([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleUploadClick = async () => {
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload prescription");
      return;
    }

    setLoading(true);
    
    try {
      const base64Images = await Promise.all(
        files.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      await API.post("/orders", {
        items: [],
        payment_mode: "COD",
        prescription_image: base64Images,
      });
      setShowSuccessModal(true);
      setFiles([]);
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

  return (
    <>
      <div className="buy-container">

        {/* LEFT - UPLOAD */}
        <div className="upload-box">

          <h2><FaUpload /> Upload Prescription</h2>

          <div
            className="upload-area"
            onClick={() => document.getElementById("fileInput")?.click()}
            style={{ opacity: files.length >= 3 ? 0.5 : 1, cursor: files.length >= 3 ? "not-allowed" : "pointer" }}
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
            accept="image/*"
            multiple
            hidden
            disabled={files.length >= 3}
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files || []);
              if (files.length + selectedFiles.length > 3) {
                toast.error("You can upload a maximum of 3 prescription pages.");
                return;
              }
              const validFiles = selectedFiles.filter(f => {
                if (!f.type.startsWith("image/")) {
                  toast.error("Please select only image files.");
                  return false;
                }
                return true;
              });
              setFiles(prev => [...prev, ...validFiles]);
              e.target.value = "";
            }}
          />

          {files.length > 0 && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px", marginBottom: "15px" }}>
              {files.map((f, idx) => (
                <div key={idx} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd", width: "80px", height: "80px" }}>
                  <img src={URL.createObjectURL(f)} alt={`Prescription page ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                    style={{ position: "absolute", top: "2px", right: "2px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => {
              if (files.length === 0) {
                document.getElementById("fileInput")?.click();
              } else {
                handleUploadClick();
              }
            }} 
            disabled={loading}
          >
            {loading ? "Processing..." : files.length === 0 ? "Upload" : "Continue"}
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
            <button onClick={() => navigate("/orders")}>Go to My Orders</button>
            <span onClick={() => { setShowSuccessModal(false); navigate("/"); }}>Back to Home</span>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyMedicine;