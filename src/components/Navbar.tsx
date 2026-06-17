import "./Navbar.css";
import { FaHome, FaCapsules, FaHeartbeat, FaFirstAid } from "react-icons/fa";
import { GiMedicines } from "react-icons/gi";
import React, { useState } from "react";
import SearchBar from "./SearchBar";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  const [open, setOpen] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const cartCount = totalItems;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <div className="navbar-container">
        <div className="navbar">
        <div className="navbar-top-row">
          <div className="logo" onClick={() => navigate("/")}>
            Gow<span>Mithra</span>
          </div>

          <SearchBar className="desktop-search" />

          <div className="nav-links">
            <span
              className={location.pathname === "/" ? "active" : ""}
              onClick={() => navigate("/")}>
              <FaHome /> <label>Home</label>
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

          <div className="right-section">
            <div className="cart" onClick={() => navigate("/cart")}>
              🛒
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </div>

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
                    <div onClick={() => { navigate("/profile"); setOpen(false); }}>My Profile</div>
                    <div onClick={() => { navigate("/orders"); setOpen(false); }}>My Orders</div>
                    <div onClick={handleLogout}>Logout</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SearchBar className="mobile-search" />
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        <span
          className={location.pathname === "/buy-medicine" ? "active" : ""}
          onClick={() => navigate("/buy-medicine")}>
          <GiMedicines /> <label>Medicines</label>
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
          <FaHeartbeat /> <label>Additives</label>
        </span>
      </div>
    </>
  );
};

export default Navbar;