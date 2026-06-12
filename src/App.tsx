import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Layout from "./layouts/Layout";

import Home from "./pages/Home";
import Login from "./components/Auth/Login";
import BuyMedicine from "./pages/BuyMedicine";
import Supplements from "./pages/Supplements";
import FirstAid from "./pages/FirstAid";
import FeedAdditives from "./pages/FeedAdditives";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import { CartProvider } from "./context/CartContext";
const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/buy-medicine" element={<BuyMedicine />} />
            <Route path="/supplements" element={<Supplements />} />
            <Route path="/first-aid" element={<FirstAid />} />
            <Route path="/feed-additives" element={<FeedAdditives />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </CartProvider>
  );
};

export default App;