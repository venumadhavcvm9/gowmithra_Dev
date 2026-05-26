import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <div className="footer">
      <div className="top-footer">
        <a>Home</a>
        <a>Medicines</a>
        <a>Contact Us</a>
        <a>Terms</a>
        <a>Privacy</a>
        <a>Return Policy</a>
      </div>

      <div className="bottom-footer">
        © 2026 GowMithra. All rights reserved.
      </div>
    </div>
  );
};

export default Footer;