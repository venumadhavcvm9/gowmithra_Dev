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

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/buy-medicine" element={<BuyMedicine />} />
          <Route path="/supplements" element={<Supplements />} />
          <Route path="/first-aid" element={<FirstAid />} />
          <Route path="/feed-additives" element={<FeedAdditives />} />
        </Routes>
      </Layout>

      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;