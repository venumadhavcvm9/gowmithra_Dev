import "./Navbar.css";
import { FaHome, FaCapsules, FaHeartbeat, FaFirstAid } from "react-icons/fa";
import { GiMedicines } from "react-icons/gi";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const cartCount = 0; // 🔥 replace with real cart later

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="navbar-container">
      <div className="navbar">

        {/* LOGO */}
        <div className="logo" onClick={() => navigate("/")}>
          Gow<span>Mithra</span>
        </div>

        {/* SEARCH */}
        <div className="search-box">
          <input placeholder="Search medicines..." />
          <span className="search-icon">🔍</span>
        </div>

        {/* NAV LINKS */}
        <div className="nav-links">
          <span onClick={() => navigate("/")}>
            <FaHome />
          </span>
            
            <span 
            className={location.pathname === "/buy-medicine" ? "active" : ""}
            onClick={() => navigate("/buy-medicine")}>
            <GiMedicines /> <label>Buy Medicine</label>
          </span>

          <span
          className={location.pathname === "/supplements" ? "active" : ""}
          onClick={() => navigate("/supplements")}>
            <FaCapsules /> <label>Supplements</label>
          </span>

          <span
          className={location.pathname === "/first-aid" ? "active" : ""}
          onClick={() => navigate("/first-aid")}>
            <FaFirstAid /> <label>First Aid</label>
          </span>

          <span
          className={location.pathname === "/feed-additives" ? "active" : ""}
          onClick={() => navigate("/feed-additives")}>
            <FaHeartbeat /> <label>Feed Additives</label>
          </span>
        </div>

        {/* RIGHT SECTION */}
        <div className="right-section">

          {/* CART */}
          <div className="cart" onClick={() => navigate("/cart")}>
            🛒
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </div>

          {/* USER */}
          {!token ? (
            <div className="login-btn" onClick={() => navigate("/login")}>
              Login
            </div>
          ) : (
            <div className="profile" onClick={() => setOpen(!open)}>
              <div className="avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              {open && (
                <div className="dropdown">
                  <div onClick={() => navigate("/profile")}>My Profile</div>
                  <div onClick={handleLogout}>Logout</div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Navbar;