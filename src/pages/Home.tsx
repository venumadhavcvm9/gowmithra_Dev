import React from "react";

import Slider from "../components/Slider.tsx";
import MedicineSection from "../components/MedicineSection.tsx";

const Home: React.FC = () => {
  return (
    <>
      <Slider />
      <MedicineSection />
    </>
  );
};

export default Home;