import React from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <Navbar />

      <main style={{ minHeight: "70vh" }}>
        {children}
      </main>

      <Footer />
    </>
  );
};

export default Layout;