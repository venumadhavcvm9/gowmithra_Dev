import React, { useEffect, useState } from "react";
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import { FiUser, FiPhone, FiMapPin, FiCheckCircle, FiCreditCard, FiAlertCircle } from "react-icons/fi";

const Checkout = () => {
  const { state, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    fullAddress: "",
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [formTouched, setFormTouched] = useState<any>({});
  const [paymentMode, setPaymentMode] = useState<"COD" | "ONLINE">("COD");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const [summaryData, setSummaryData] = useState<{
    items: any[];
    total_amount: number;
    requires_prescription: boolean;
  } | null>(null);

  const [prescriptionImages, setPrescriptionImages] = useState<string[]>([]);
  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to proceed to checkout");
      navigate("/login");
      return;
    }

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData({
          fullName: user.full_name || "",
          phoneNumber: user.mobile || "",
          fullAddress: user.address || "",
        });
      }
    } catch (err) {
      console.error("Error parsing user details from localStorage", err);
    }
  }, [navigate]);

  // Form Validation
  const validateForm = () => {
    const errors: any = {};
    if (!formData.fullName.trim()) {
      errors.fullName = "Full Name is required";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "Full Name must be at least 3 characters";
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = "Phone Number is required";
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid 10-digit Indian Mobile Number";
    }

    if (!formData.fullAddress.trim()) {
      errors.fullAddress = "Full Address is required";
    } else if (formData.fullAddress.trim().length < 5) {
      errors.fullAddress = "Full Address must be at least 5 characters";
    }

    return errors;
  };

  useEffect(() => {
    setFormErrors(validateForm());
  }, [formData]);

  // Redirect if cart is empty, success modal is not showing, and no order has been placed
  useEffect(() => {
    if (state.items.length === 0 && !showSuccessModal && !placedOrder) {
      navigate("/cart");
    }
  }, [state.items, showSuccessModal, placedOrder, navigate]);

  // Fetch Checkout Summary from Backend
  useEffect(() => {
    const fetchSummary = async () => {
      if (state.items.length === 0) {
        setSummaryData(null);
        return;
      }
      try {
        const payload = { items: state.items };
        const res = await API.post("/orders/checkout-summary", payload);
        setSummaryData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch checkout summary", err);
      }
    };
    fetchSummary();
  }, [state.items]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (prescriptionImages.length + files.length > 3) {
      toast.error("You can upload a maximum of 3 prescription pages.");
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select only image files.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input so the same files can be selected again if removed
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setPrescriptionImages(prev => prev.filter((_, i) => i !== index));
  };

  const totalPayable = summaryData ? summaryData.total_amount : parseFloat((totalPrice * 1.05).toFixed(2));

  // Dynamic UPI URL for Indian UPI payment apps
  const upiPayableUri = `upi://pay?pa=gowmithra@ybl&pn=GowMithra&am=${totalPayable}&cu=INR&tn=Order_Payment`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayableUri
  )}`;

  const handlePlaceOrder = async () => {
    const touchedAll = { fullName: true, phoneNumber: true, fullAddress: true };
    setFormTouched(touchedAll);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fill in all details correctly");
      return;
    }

    if (summaryData?.requires_prescription && prescriptionImages.length === 0) {
      toast.error("Please upload your prescription to place this order.");
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload: any = {
        full_name: formData.fullName,
        mobile: formData.phoneNumber,
        address: formData.fullAddress,
        items: state.items,
        total_amount: totalPayable,
        payment_mode: paymentMode,
      };

      if (summaryData?.requires_prescription) {
        orderPayload.prescription_image = prescriptionImages;
      }

      const res = await API.post("/orders", orderPayload);

      setPlacedOrder(res.data.data);
      setShowSuccessModal(true);
      clearCart();
      toast.success("Order Placed Successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-layout">
        {/* LEFT SECTION: Shipping & Payment Forms */}
        <div className="checkout-main-section">

          {/* Shipping Form */}
          <div className="checkout-card">
            <h2 className="card-title">
              <FiMapPin className="card-icon" /> Delivery Information
            </h2>

            <div className="checkout-details-text">
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{formData.fullName || "Not provided"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone Number</span>
                <span className="detail-value">{formData.phoneNumber || "Not provided"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Full Address</span>
                <span className="detail-value">{formData.fullAddress || "Not provided"}</span>
              </div>
            </div>
          </div>

          {/* Prescription Upload Card */}
          {summaryData?.requires_prescription && (
            <div className="checkout-card prescription-card-section" style={{ border: "2px dashed #f59e0b" }}>
              <h2 className="card-title">
                <FiAlertCircle className="card-icon" style={{ color: "#f59e0b" }} /> Prescription Required
              </h2>
              <p className="card-subtitle" style={{ marginBottom: "15px" }}>
                One or more medicines in your cart require a valid prescription. Please upload it below.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={prescriptionImages.length >= 3}
                style={{ marginBottom: "10px", width: "100%", padding: "10px", background: "#fffbeb", borderRadius: "8px", opacity: prescriptionImages.length >= 3 ? 0.5 : 1 }}
              />

              {prescriptionImages.length > 0 && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                  {prescriptionImages.map((imgSrc, idx) => (
                    <div key={idx} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd", width: "100px", height: "100px" }}>
                      <img src={imgSrc} alt={`Prescription page ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", padding: 0 }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Card */}
          <div className="checkout-card payment-card-section">
            <h2 className="card-title">
              <FiCreditCard className="card-icon" /> Payment Options
            </h2>
            <p className="card-subtitle">Choose your preferred payment method.</p>

            <div className="payment-options-grid">
              {/* COD Option */}
              <div
                className={`payment-option-box ${paymentMode === "COD" ? "active" : ""}`}
                onClick={() => setPaymentMode("COD")}
              >
                <div className="radio-indicator">
                  <span className="radio-dot"></span>
                </div>
                <div className="payment-option-details">
                  <h4>Cash on Delivery (COD)</h4>
                  <p>Pay with cash or UPI upon delivery at your doorstep.</p>
                </div>
              </div>

              {/* ONLINE Option */}
              <div
                className={`payment-option-box ${paymentMode === "ONLINE" ? "active" : ""}`}
                onClick={() => setPaymentMode("ONLINE")}
              >
                <div className="radio-indicator">
                  <span className="radio-dot"></span>
                </div>
                <div className="payment-option-details">
                  <h4>Online UPI Payment (Scan & Pay)</h4>
                  <p>Pay instantly using any UPI App (GPay, PhonePe, Paytm, BHIM).</p>
                </div>
              </div>
            </div>

            {/* Dynamic UPI QR Code Section */}
            {paymentMode === "ONLINE" && (
              <div className="upi-qr-container">
                <div className="upi-qr-card">
                  <div className="qr-badge">Indian Region Only</div>
                  <div className="qr-image-wrapper">
                    <img src={qrCodeUrl} alt="UPI Payment QR Code" />
                  </div>
                  <h4 className="qr-amount-text">Amount to Pay: <span>₹{totalPayable}</span></h4>
                  <p className="qr-instructions">
                    Scan this QR code with any UPI app to complete your payment securely.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: Sticky Order Summary */}
        <div className="checkout-sidebar-section">
          <div className="checkout-card summary-card">
            <h3 className="summary-title">Order Details</h3>

            <div className="summary-items-list">
              {state.items.map((item) => (
                <div className="summary-item-row" key={item.medicine_id}>
                  <div className="summary-item-name">
                    <span>{item.name}</span>
                    <span className="summary-item-qty">x {item.quantity}</span>
                  </div>
                  <span className="summary-item-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <hr className="summary-divider" />

            <div className="summary-row">
              <span>Items ({totalItems})</span>
              <span>₹{totalPrice}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            <div className="summary-row">
              <span>Tax (5% GST)</span>
              <span>₹{(totalPrice * 0.05).toFixed(2)}</span>
            </div>

            <hr className="summary-divider" />

            <div className="summary-payable-row">
              <span>Total Payable</span>
              <span>₹{totalPayable}</span>
            </div>

            <button
              className="place-order-btn"
              disabled={submitting}
              onClick={handlePlaceOrder}
            >
              {submitting ? "Placing Order..." : paymentMode === "ONLINE" ? "Pay & Place Order" : "Place Order (COD)"}
            </button>
          </div>
        </div>
      </div>

      {/* ORDER SUCCESS MODAL */}
      {showSuccessModal && placedOrder && (
        <div className="modal-overlay">
          <div className="success-modal-box">
            <div className="success-checkmark-box">
              <FiCheckCircle className="modal-success-icon" />
            </div>
            <h2>Order Placed Successfully!</h2>
            <p className="order-message">Thank you for shopping with GowMithra. Your health is our priority.</p>

            <div className="order-receipt-card">
              <div className="receipt-row">
                <span>Order ID</span>
                <span className="bold-text">#GOW-{placedOrder.id}</span>
              </div>
              <div className="receipt-row">
                <span>Delivered To</span>
                <span className="bold-text truncate">{placedOrder.full_name}</span>
              </div>
              <div className="receipt-row">
                <span>Phone Number</span>
                <span className="bold-text">{placedOrder.mobile}</span>
              </div>
              <div className="receipt-row">
                <span>Total Amount Paid</span>
                <span className="bold-text green-text">₹{placedOrder.total_amount}</span>
              </div>
              <div className="receipt-row">
                <span>Payment Mode</span>
                <span className="bold-text highlight-badge">{placedOrder.payment_mode}</span>
              </div>
            </div>

            <button
              className="modal-home-btn"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/");
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
