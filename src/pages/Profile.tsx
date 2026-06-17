import React, { useEffect, useState } from "react";
import "./Profile.css";
import API from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const navigate = useNavigate();

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [originalFullName, setOriginalFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [originalAddress, setOriginalAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize profile from local storage and verify login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast.error("Please login to access your profile");
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setFullName(user.full_name || "");
      setOriginalFullName(user.full_name || "");
      setMobile(user.mobile || "");
      setAddress(user.address || "");
      setOriginalAddress(user.address || "");
    } catch (err) {
      console.error("Error parsing user from localStorage", err);
    }
  }, [navigate]);

  const hasChanges = fullName !== originalFullName || address !== originalAddress;

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      return toast.error("Full Name cannot be empty");
    }
    if (fullName.trim().length < 3) {
      return toast.error("Full Name must be at least 3 characters");
    }
    if (!address.trim()) {
      return toast.error("Address cannot be empty");
    }
    if (address.trim().length < 5) {
      return toast.error("Address must be at least 5 characters");
    }

    try {
      setSaving(true);
      const res = await API.patch("/users/profile", {
        full_name: fullName.trim(),
        address: address.trim(),
      });

      // Update local storage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, full_name: res.data.user.full_name, address: res.data.user.address };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setOriginalFullName(res.data.user.full_name);
      setOriginalAddress(res.data.user.address);

      toast.success("Profile updated successfully!");

      // Force top navbar refresh
      setTimeout(() => {
        window.dispatchEvent(new Event("storage"));
      }, 100);

    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-centered-card">
        <form onSubmit={handleUpdateProfile} className="profile-settings-form">
          <h4 className="form-section-title">
            Personal Details
          </h4>

          <div className="profile-form-group">
            <label htmlFor="fullNameInput">Full Name</label>
            <div className="form-input-wrapper">
              <input
                id="fullNameInput"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="mobileInput">Mobile Number</label>
            <div className="form-input-wrapper readonly-wrapper">
              <input
                id="mobileInput"
                type="text"
                value={mobile}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="addressTextarea">Delivery Address</label>
            <div className="form-input-wrapper">
              <textarea
                id="addressTextarea"
                placeholder="Your full delivery address"
                rows={4}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {hasChanges && (
            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
