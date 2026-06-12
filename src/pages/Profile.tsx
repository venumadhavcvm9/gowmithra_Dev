import React, { useEffect, useState, useCallback } from "react";
import "./Profile.css";
import API from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiUser, FiPhone, FiMapPin, FiPackage, FiCheckCircle, FiClock, FiChevronRight, FiChevronLeft, FiEdit3, FiXCircle } from "react-icons/fi";

interface OrderItem {
  medicine_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  full_name: string;
  mobile: string;
  address: string;
  items: string | OrderItem[];
  total_amount: number | string;
  payment_mode: string;
  payment_status: string;
  order_status: "PENDING" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  prescription_image?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<"ongoing" | "prescription" | "completed">("ongoing");

  // Pagination states
  const [ongoingPage, setOngoingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [prescriptionPage, setPrescriptionPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Cancellation states
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Prescription View and Update states
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [uploadingPrescriptionId, setUploadingPrescriptionId] = useState<number | null>(null);

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
      setMobile(user.mobile || "");
      setAddress(user.address || "");
    } catch (err) {
      console.error("Error parsing user from localStorage", err);
    }
  }, [navigate]);

  // Fetch orders from backend with pagination
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const page = activeTab === "ongoing" ? ongoingPage : activeTab === "completed" ? completedPage : prescriptionPage;
      const res = await API.get(`/orders/my-orders?status=${activeTab}&page=${page}&limit=${ITEMS_PER_PAGE}`);
      setOrders(res.data.data?.orders || []);
      setTotalPages(res.data.data?.totalPages || 1);
      setTotalCount(res.data.data?.total || 0);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      toast.error(err?.response?.data?.message || "Failed to load order history");
    } finally {
      setLoadingOrders(false);
    }
  }, [activeTab, ongoingPage, completedPage, prescriptionPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  // Cancel order handler
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsCancelling(true);
      await API.post(`/orders/${cancelOrderId}/cancel`, { reason: cancelReason });
      toast.success("Order cancelled successfully");
      setCancelOrderId(null);
      setCancelReason("");
      fetchOrders();
    } catch (err: any) {
      console.error("Cancel order error:", err);
      toast.error(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  // Upload Another Prescription handler
  const handleUpdatePrescription = async (e: React.ChangeEvent<HTMLInputElement>, orderId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setUploadingPrescriptionId(orderId);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await API.patch(`/orders/${orderId}/prescription`, {
          prescription_image: base64String
        });
        toast.success("Prescription updated successfully!");
        fetchOrders();
      } catch (err: any) {
        console.error("Update prescription error:", err);
        toast.error(err?.response?.data?.message || "Failed to update prescription");
      } finally {
        setUploadingPrescriptionId(null);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploadingPrescriptionId(null);
    };
    reader.readAsDataURL(file);

    // Reset file input so user can upload same file again if they want
    e.target.value = "";
  };

  // Cleaned up client-side pagination since it's now handled by the backend
  const currentOrders = orders;

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING": return "status-pending";
      case "ACCEPTED": return "status-accepted";
      case "PLACED": return "status-placed";
      case "SHIPPED": return "status-shipped";
      case "OUT_FOR_DELIVERY": return "status-out-for-delivery";
      case "DELIVERED": return "status-delivered";
      case "CANCELLED": return "status-cancelled";
      default: return "status-default";
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-layout-grid">

        {/* LEFT COLUMN: Account Profile Settings (1/3 Width) */}
        <div className="profile-sidebar-card">
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
              {/* <span className="field-hint-text">Mobile number is linked to your verified OTP and cannot be modified.</span> */}
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

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Order History Tabs (2/3 Width) */}
        <div className="profile-orders-container">
          <div className="orders-header-tabs">
            <button
              className={`tab-btn ${activeTab === "ongoing" ? "active" : ""}`}
              onClick={() => setActiveTab("ongoing")}
            >
              <FiClock className="tab-icon" />
              Ongoing Orders
              {activeTab === "ongoing" && <span className="tab-count-badge">{totalCount}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === "prescription" ? "active" : ""}`}
              onClick={() => setActiveTab("prescription")}
            >
              <FiPackage className="tab-icon" />
              Prescription Orders
              {activeTab === "prescription" && <span className="tab-count-badge">{totalCount}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              <FiCheckCircle className="tab-icon" />
              Completed Orders
              {activeTab === "completed" && <span className="tab-count-badge">{totalCount}</span>}
            </button>
          </div>

          <div className="orders-tab-content">
            {loadingOrders ? (
              <div className="orders-loading-state">
                <div className="spinner"></div>
                <p>Retrieving your order history...</p>
              </div>
            ) : activeTab === "ongoing" ? (
              // Ongoing Orders Render
              <div className="orders-list">
                {currentOrders.length === 0 ? (
                  <div className="orders-empty-state">
                    <FiPackage className="empty-state-icon" />
                    <h4>No Ongoing Orders</h4>
                    <p>You do not have any active or shipped orders at this moment.</p>
                    <button className="shop-now-btn" onClick={() => navigate("/buy-medicine")}>
                      Shop Medicines Now
                    </button>
                  </div>
                ) : (
                  <>
                    {currentOrders.map((order) => {
                      const items: OrderItem[] = typeof order.items === "string"
                        ? JSON.parse(order.items)
                        : order.items;

                      return (
                        <div key={order.id} className="order-history-card">
                          <div className="order-card-header">
                            <div>
                              <span className="order-id-label">Order #GOW-{order.id}</span>
                              <span className="order-date-text">{formatDate(order.createdAt)}</span>
                            </div>
                            <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                              {order.order_status}
                            </span>
                          </div>

                          <div className="order-card-body">
                            <div className="order-items-summary">
                              {items.length === 0 && order.prescription_image ? (
                                <div className="order-item-summary-row" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                  <img src={order.prescription_image} alt="Prescription" style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
                                  <span>
                                    📄 Prescription Upload
                                    <span className="item-qty-lbl" style={{ color: order.order_status === "PENDING" ? "#d97706" : "#16a34a" }}>
                                      ({order.order_status === "PENDING" ? "Awaiting Pharmacist Review" : `Pharmacist Reviewed - ${order.order_status}`})
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                items.map((item, idx) => (
                                  <div key={idx} className="order-item-summary-row">
                                    <span>{item.name} <span className="item-qty-lbl">x {item.quantity}</span></span>
                                    <span className="item-price-val">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="order-card-meta">
                              <div className="meta-left">
                                <span className="meta-info-pill">Payment: {order.payment_mode}</span>
                                <span className={`meta-info-pill payment-${order.payment_status.toLowerCase()}`}>
                                  {order.payment_status}
                                </span>
                                {(order.order_status === "PLACED" || order.order_status === "PENDING" || order.order_status === "ACCEPTED") && (
                                  <button
                                    className="cancel-order-btn"
                                    onClick={() => setCancelOrderId(order.id)}
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                              <div className="meta-right">
                                <span className="meta-total-label">Total Amount:</span>
                                <span className="meta-total-amount">₹{Number(order.total_amount).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="pagination-wrapper">
                        <button
                          className="pagination-btn"
                          disabled={ongoingPage === 1}
                          onClick={() => setOngoingPage((p) => Math.max(1, p - 1))}
                        >
                          <FiChevronLeft /> Prev
                        </button>
                        <div className="pagination-pages-list">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`pagination-page-number ${ongoingPage === page ? "active" : ""}`}
                              onClick={() => setOngoingPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          className="pagination-btn"
                          disabled={ongoingPage === totalPages}
                          onClick={() => setOngoingPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next <FiChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : activeTab === "completed" ? (
              // Completed Orders Render
              <div className="orders-list">
                {currentOrders.length === 0 ? (
                  <div className="orders-empty-state">
                    <FiPackage className="empty-state-icon" />
                    <h4>No Completed Orders</h4>
                    <p>Your completed order history is currently empty.</p>
                  </div>
                ) : (
                  <>
                    {currentOrders.map((order) => {
                      const items: OrderItem[] = typeof order.items === "string"
                        ? JSON.parse(order.items)
                        : order.items;

                      return (
                        <div key={order.id} className="order-history-card">
                          <div className="order-card-header">
                            <div>
                              <span className="order-id-label">Order #GOW-{order.id}</span>
                              <span className="order-date-text">{formatDate(order.createdAt)}</span>
                            </div>
                            <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                              {order.order_status}
                            </span>
                          </div>

                          <div className="order-card-body">
                            <div className="order-items-summary">
                              {items.length === 0 && order.prescription_image ? (
                                <div className="order-item-summary-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                    <img src={order.prescription_image} alt="Prescription" style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
                                    <span>
                                      📄 Prescription Upload
                                      <span className="item-qty-lbl" style={{ color: order.order_status === "PENDING" ? "#d97706" : "#16a34a" }}>
                                        ({order.order_status === "PENDING" ? "Awaiting Pharmacist Review" : `Pharmacist Reviewed - ${order.order_status}`})
                                      </span>
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <button
                                      onClick={() => setViewImage(order.prescription_image || null)}
                                      style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#334155", width: "100%", textAlign: "center" }}
                                    >
                                      View
                                    </button>
                                    {order.order_status === "PENDING" && (
                                      <>
                                        <input
                                          type="file"
                                          id={`upload-prescription-${order.id}`}
                                          style={{ display: "none" }}
                                          accept="image/*"
                                          onChange={(e) => handleUpdatePrescription(e, order.id)}
                                        />
                                        <label
                                          htmlFor={`upload-prescription-${order.id}`}
                                          style={{ padding: "6px 12px", background: "#0ea5e9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#fff", display: "inline-block", margin: 0, textAlign: "center", width: "100%" }}
                                        >
                                          {uploadingPrescriptionId === order.id ? "Uploading..." : "Upload Another"}
                                        </label>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                items.map((item, idx) => (
                                  <div key={idx} className="order-item-summary-row">
                                    <span>{item.name} <span className="item-qty-lbl">x {item.quantity}</span></span>
                                    <span className="item-price-val">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="order-card-meta">
                              <div className="meta-left">
                                <span className="meta-info-pill">Payment: {order.payment_mode}</span>
                                <span className={`meta-info-pill payment-${order.payment_status.toLowerCase()}`}>
                                  {order.payment_status}
                                </span>
                              </div>
                              <div className="meta-right">
                                <span className="meta-total-label">Total Amount:</span>
                                <span className="meta-total-amount">₹{Number(order.total_amount).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="pagination-wrapper">
                        <button
                          className="pagination-btn"
                          disabled={completedPage === 1}
                          onClick={() => setCompletedPage((p) => Math.max(1, p - 1))}
                        >
                          <FiChevronLeft /> Prev
                        </button>
                        <div className="pagination-pages-list">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`pagination-page-number ${completedPage === page ? "active" : ""}`}
                              onClick={() => setCompletedPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          className="pagination-btn"
                          disabled={completedPage === totalPages}
                          onClick={() => setCompletedPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next <FiChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : activeTab === "prescription" ? (
              // Prescription Orders Render
              <div className="orders-list">
                {orders.length === 0 ? (
                  <div className="orders-empty-state">
                    <FiPackage className="empty-state-icon" />
                    <h4>No Prescription Orders</h4>
                    <p>You have not uploaded any prescriptions yet.</p>
                  </div>
                ) : (
                  <>
                    {orders.map((order) => {
                      const items: OrderItem[] = typeof order.items === "string"
                        ? JSON.parse(order.items)
                        : order.items;

                      return (
                        <div key={order.id} className="order-history-card">
                          <div className="order-card-header">
                            <div>
                              <span className="order-id-label">Order #GOW-{order.id}</span>
                              <span className="order-date-text">{formatDate(order.createdAt)}</span>
                            </div>
                            <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                              {order.order_status}
                            </span>
                          </div>

                          <div className="order-card-body">
                            <div className="order-items-summary">
                              {items.length === 0 && order.prescription_image ? (
                                <div className="order-item-summary-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                    <img src={order.prescription_image} alt="Prescription" style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
                                    <span>
                                      {/* 📄 Prescription Upload */}
                                      <span className="item-qty-lbl" style={{ color: order.order_status === "PENDING" ? "#d97706" : "#16a34a" }}>
                                        ({order.order_status === "PENDING" ? "Awaiting Pharmacist Review" : `Pharmacist Reviewed - ${order.order_status}`})
                                      </span>
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <button
                                      onClick={() => setViewImage(order.prescription_image || null)}
                                      style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#334155", width: "100%" }}
                                    >
                                      View
                                    </button>
                                    {order.order_status === "PENDING" && (
                                      <>
                                        <input
                                          type="file"
                                          id={`upload-prescription-${order.id}`}
                                          style={{ display: "none" }}
                                          accept="image/*"
                                          onChange={(e) => handleUpdatePrescription(e, order.id)}
                                        />
                                        <label
                                          htmlFor={`upload-prescription-${order.id}`}
                                          style={{ padding: "6px 12px", background: "#0ea5e9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#fff", display: "inline-block", margin: 0, textAlign: "center", width: "84%" }}
                                        >
                                          {uploadingPrescriptionId === order.id ? "Uploading..." : "Replace Prescription"}
                                        </label>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                items.map((item, idx) => (
                                  <div key={idx} className="order-item-summary-row">
                                    <span>{item.name} <span className="item-qty-lbl">x {item.quantity}</span></span>
                                    <span className="item-price-val">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="order-card-meta">
                              <div className="meta-left">
                                <span className="meta-info-pill">Payment: {order.payment_mode}</span>
                                <span className={`meta-info-pill payment-${order.payment_status.toLowerCase()}`}>
                                  {order.payment_status}
                                </span>
                                {(order.order_status === "PLACED" || order.order_status === "PENDING" || order.order_status === "ACCEPTED") && (
                                  <button
                                    className="cancel-order-btn"
                                    onClick={() => setCancelOrderId(order.id)}
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                              <div className="meta-right">
                                <span className="meta-total-label">Total Amount:</span>
                                <span className="meta-total-amount">₹{Number(order.total_amount).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          disabled={prescriptionPage === 1}
                          onClick={() => setPrescriptionPage((p) => Math.max(1, p - 1))}
                        >
                          <FiChevronLeft /> Prev
                        </button>
                        <div className="pagination-pages-list">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`pagination-page-number ${prescriptionPage === page ? "active" : ""}`}
                              onClick={() => setPrescriptionPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          className="pagination-btn"
                          disabled={prescriptionPage === totalPages}
                          onClick={() => setPrescriptionPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next <FiChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelOrderId && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal-content">
            <div className="cancel-modal-header">
              <div className="cancel-modal-icon-bg">
                <FiXCircle className="cancel-modal-icon" />
              </div>
              <h3>Cancel Order</h3>
            </div>
            <p className="cancel-modal-body" style={{ marginBottom: "15px" }}>
              Are you sure you want to cancel Order #GOW-{cancelOrderId}? Please tell us why.
            </p>
            <textarea
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px" }}
              rows={3}
            />
            <div className="cancel-modal-actions">
              <button
                className="cancel-modal-btn-secondary"
                onClick={() => {
                  setCancelOrderId(null);
                  setCancelReason("");
                }}
                disabled={isCancelling}
              >
                Keep Order
              </button>
              <button
                className="cancel-modal-btn-danger"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewImage && (
        <div className="cancel-modal-overlay" onClick={() => setViewImage(null)}>
          <div className="cancel-modal-content" style={{ maxWidth: "800px", padding: "10px", backgroundColor: "transparent", boxShadow: "none" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <button onClick={() => setViewImage(null)} style={{ background: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "20px", color: "#333", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                &times;
              </button>
            </div>
            <img src={viewImage} alt="Prescription Full View" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px", backgroundColor: "#fff", padding: "10px" }} />
          </div>
        </div>
      )}

    </div>

  );
};

export default Profile;
