import React, { useEffect, useState, useCallback } from "react";
import "./Orders.css";
import API from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiCheckCircle, FiClock, FiChevronRight, FiChevronLeft, FiXCircle, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

const Orders: React.FC = () => {
  const navigate = useNavigate();

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
  
  const [updateModalOrder, setUpdateModalOrder] = useState<any>(null);
  const [updatePrescriptionImages, setUpdatePrescriptionImages] = useState<string[]>([]);

  const getPrescriptionImages = (imageStr: string | undefined): string[] => {
    if (!imageStr) return [];
    try {
      const parsed = JSON.parse(imageStr);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [imageStr];
    }
    return [];
  };

  // Generate Invoice PDF
  const generateInvoice = (order: Order) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(8, 145, 178); // #0891B2
      doc.text("GowMithra - Order Invoice", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Order ID: #GOW-${order.id}`, 14, 32);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 38);
      doc.text(`Payment Mode: ${order.payment_mode}`, 14, 44);
      doc.text(`Payment Status: ${order.payment_status}`, 14, 50);

      // Customer Details
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Customer Details:", 14, 62);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(order.full_name || "N/A", 14, 68);
      doc.text(`Mobile: ${order.mobile || "N/A"}`, 14, 74);
      
      const addressLines = doc.splitTextToSize(`Address: ${order.address || "N/A"}`, 180);
      doc.text(addressLines, 14, 80);

      // Items Table
      const items: OrderItem[] = typeof order.items === "string" ? JSON.parse(order.items || "[]") : (order.items || []);
      
      if (items.length > 0) {
        const tableData = items.map(item => [
          item.name,
          item.quantity.toString(),
          `Rs. ${Number(item.price).toFixed(2)}`,
          `Rs. ${(Number(item.price) * item.quantity).toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: 95,
          head: [['Item Name', 'Quantity', 'Unit Price', 'Total']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [8, 145, 178] },
        });
        
        // Total Amount
        const finalY = (doc as any).lastAutoTable?.finalY || 95;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Grand Total: Rs. ${Number(order.total_amount).toFixed(2)}`, 140, finalY + 15);
      } else if (order.prescription_image) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Prescription Order: No explicit items list available.", 14, 100);
        doc.text(`Grand Total: Rs. ${Number(order.total_amount).toFixed(2)}`, 14, 110);
      }

      doc.save(`GowMithra_Invoice_GOW-${order.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate invoice. Check console for details.");
    }
  };

  // Initialize and verify login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast.error("Please login to access your orders");
      navigate("/login");
      return;
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

  const openUpdateModal = (order: Order) => {
    setUpdateModalOrder(order);
    setUpdatePrescriptionImages(getPrescriptionImages(order.prescription_image));
  };

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (updatePrescriptionImages.length + files.length > 3) {
      toast.error("Maximum 3 prescription pages allowed.");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdatePrescriptionImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeUpdateImage = (index: number) => {
    setUpdatePrescriptionImages(prev => prev.filter((_, i) => i !== index));
  };

  const saveUpdatedPrescriptions = async () => {
    if (!updateModalOrder) return;
    if (updatePrescriptionImages.length === 0) {
      toast.error("Please upload at least one prescription page.");
      return;
    }
    setUploadingPrescriptionId(updateModalOrder.id);
    try {
      await API.patch(`/orders/${updateModalOrder.id}/prescription`, {
        prescription_image: updatePrescriptionImages
      });
      toast.success("Prescription updated successfully!");
      setUpdateModalOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update prescription");
    } finally {
      setUploadingPrescriptionId(null);
    }
  };

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
    <div className="orders-page-container">
      <div className="orders-content-centered">
        
        <h2 className="orders-page-title">My Orders</h2>

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
                            {items.length === 0 && getPrescriptionImages(order.prescription_image).length > 0 ? (
                              <div className="order-item-summary-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                    {getPrescriptionImages(order.prescription_image).map((img, idx) => (
                                      <img key={idx} src={img} alt={`Prescription ${idx + 1}`} onClick={() => setViewImage(img)} style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer" }} />
                                    ))}
                                  </div>
                                  <span>
                                    📄 Prescription Upload
                                    <span className="item-qty-lbl" style={{ color: order.order_status === "PENDING" ? "#d97706" : "#16a34a" }}>
                                      ({order.order_status === "PENDING" ? "Awaiting Pharmacist Review" : `Pharmacist Reviewed - ${order.order_status}`})
                                    </span>
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {order.order_status === "PENDING" && (
                                    <button
                                      onClick={() => openUpdateModal(order)}
                                      style={{ padding: "6px 12px", background: "#0ea5e9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#fff", display: "inline-block", margin: 0, textAlign: "center", width: "100%" }}
                                    >
                                      Update Prescription
                                    </button>
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
                            {items.length === 0 && getPrescriptionImages(order.prescription_image).length > 0 ? (
                              <div className="order-item-summary-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                    {getPrescriptionImages(order.prescription_image).map((img, idx) => (
                                      <img key={idx} src={img} alt={`Prescription ${idx + 1}`} onClick={() => setViewImage(img)} style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer" }} />
                                    ))}
                                  </div>
                                  <span>
                                    📄 Prescription Upload
                                    <span className="item-qty-lbl" style={{ color: order.order_status === "PENDING" ? "#d97706" : "#16a34a" }}>
                                      ({order.order_status === "PENDING" ? "Awaiting Pharmacist Review" : `Pharmacist Reviewed - ${order.order_status}`})
                                    </span>
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {order.order_status === "PENDING" && (
                                    <button
                                      onClick={() => openUpdateModal(order)}
                                      style={{ padding: "6px 12px", background: "#0ea5e9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#fff", display: "inline-block", margin: 0, textAlign: "center", width: "100%" }}
                                    >
                                      Update Prescription
                                    </button>
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
                              {order.order_status === "DELIVERED" && order.payment_status === "PAID" && (
                                <button
                                  className="download-invoice-btn"
                                  onClick={() => generateInvoice(order)}
                                >
                                  <FiDownload /> Download Invoice
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
                            {items.length === 0 && getPrescriptionImages(order.prescription_image).length > 0 ? (
                              <div className="order-item-summary-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                    {getPrescriptionImages(order.prescription_image).map((img, idx) => (
                                      <img key={idx} src={img} alt={`Prescription ${idx + 1}`} onClick={() => setViewImage(img)} style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer" }} />
                                    ))}
                                  </div>
                                  <span>
                                    <span className="item-qty-lbl" style={{ color: order.order_status === "PENDING" ? "#d97706" : "#16a34a" }}>
                                      ({order.order_status === "PENDING" ? "Awaiting Pharmacist Review" : `Pharmacist Reviewed - ${order.order_status}`})
                                    </span>
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {order.order_status === "PENDING" && (
                                    <button
                                      onClick={() => openUpdateModal(order)}
                                      style={{ padding: "6px 12px", background: "#0ea5e9", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#fff", display: "inline-block", margin: 0, textAlign: "center", width: "100%" }}
                                    >
                                      Update Prescription
                                    </button>
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
                              {order.order_status === "DELIVERED" && order.payment_status === "PAID" && (
                                <button className="invoice-btn" onClick={() => generateInvoice(order)}>
                                  Download Invoice
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
                    <div className="pagination-wrapper">
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

      {/* Update Prescription Modal */}
      {updateModalOrder && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal-content" style={{ maxWidth: "500px" }}>
            <div className="cancel-modal-header">
              <h3>Update Prescription Pages</h3>
            </div>
            <p style={{ marginBottom: "15px", fontSize: "14px", color: "#64748b" }}>
              You can upload up to 3 pages for your prescription.
            </p>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpdateFileChange}
              disabled={updatePrescriptionImages.length >= 3}
              style={{ marginBottom: "15px", width: "100%", padding: "10px", background: "#f8fafc", borderRadius: "8px", opacity: updatePrescriptionImages.length >= 3 ? 0.5 : 1 }}
            />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
              {updatePrescriptionImages.map((imgSrc, idx) => (
                <div key={idx} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd", width: "100px", height: "100px" }}>
                  <img src={imgSrc} alt={`Page ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeUpdateImage(idx)}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", padding: 0 }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="cancel-modal-actions">
              <button
                className="cancel-modal-btn-secondary"
                onClick={() => setUpdateModalOrder(null)}
                disabled={uploadingPrescriptionId !== null}
              >
                Cancel
              </button>
              <button
                className="cancel-modal-btn-danger"
                style={{ background: "#0ea5e9" }}
                onClick={saveUpdatedPrescriptions}
                disabled={uploadingPrescriptionId !== null}
              >
                {uploadingPrescriptionId !== null ? "Saving..." : "Save Changes"}
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

export default Orders;
