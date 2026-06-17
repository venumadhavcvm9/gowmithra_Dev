import React from "react";
import "./WhatsAppButton.css";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppButton: React.FC = () => {
  // Replace with the actual WhatsApp number (including country code, no + or spaces)
  const phoneNumber = "919866037733"; 
  const defaultMessage = encodeURIComponent("Hi GowMithra, I need help with...");

  const handleClick = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${defaultMessage}`, "_blank");
  };

  return (
    <button className="whatsapp-fab" onClick={handleClick} aria-label="Chat on WhatsApp">
      <FaWhatsapp className="whatsapp-icon" />
    </button>
  );
};

export default WhatsAppButton;
