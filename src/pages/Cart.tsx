import React from "react";
import "./Cart.css";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaShoppingCart } from "react-icons/fa";

const Cart = () => {
  const { state, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  if (state.items.length === 0) {
    return (
      <div className="cart-empty">
        <FaShoppingCart className="empty-icon" />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <button className="shop-btn" onClick={() => navigate("/buy-medicine")}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Cart</h1>
      
      <div className="cart-layout">
        {/* Cart Items List */}
        <div className="cart-items-section">
          <div className="cart-header">
            <span>Product</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Total</span>
            <span></span>
          </div>

          <div className="cart-list">
            {state.items.map((item) => (
              <div className="cart-item" key={item.medicine_id}>
                
                <div className="item-info">
                  <div className="item-img-box">
                    <img src={`${item.thumbnail}`} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-price">₹{item.price}</p>
                  </div>
                </div>

                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}>+</button>
                </div>

                <div className="item-price-unit">
                  ₹{item.price}
                </div>

                <div className="item-total">
                  ₹{item.price * item.quantity}
                </div>

                <div className="item-remove">
                  <button onClick={() => removeItem(item.medicine_id)}>
                    <FaTrash />
                  </button>
                </div>
                
              </div>
            ))}
          </div>
          
          <div className="cart-actions">
            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
            <button className="continue-btn" onClick={() => navigate("/buy-medicine")}>
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="cart-summary-section">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items ({totalItems})</span>
            <span>₹{totalPrice}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>₹{(totalPrice * 0.05).toFixed(2)}</span>
          </div>
          <hr />
          <div className="summary-total">
            <span>Total</span>
            <span>₹{(totalPrice * 1.05).toFixed(2)}</span>
          </div>
          <button
            className="checkout-btn"
            onClick={() => {
              if (!localStorage.getItem("token")) {
                navigate("/login");
              } else {
                navigate("/checkout");
              }
            }}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
