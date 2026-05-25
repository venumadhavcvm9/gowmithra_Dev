import React, { useEffect, useState } from "react";
import "./Slider.css";

const slides = [
  {
    id: 1,
    image : "https://goedegebuur.nl/wp-content/themes/vallonic-goedegebuur/public/images/vallonic__goedegebuur-nl__koeien-bg.3c2c66.png",
    title: "Buy Medicines Online",
    subtitle: "Fast delivery at your doorstep",
  },
  {
    id: 2,
    image: "https://static.vecteezy.com/system/resources/thumbnails/041/289/794/small/ai-generated-white-chicken-group-animal-in-farm-photo.jpg",
    title: "Healthcare Made Easy",
    subtitle: "Trusted & affordable products",
  },
  {
    id: 3,
    image: "https://static.vecteezy.com/system/resources/previews/048/621/359/non_2x/sheep-and-goats-grazing-together-nature-background-free-photo.jpg",
    title: "Nutritional Supplements",
    subtitle: "Stay healthy every day",
  },
];

const Slider = () => {
  const [current, setCurrent] = useState(0);

  // 🔄 Auto Slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slider-container">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === current ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="overlay">
            <h2>{slide.title}</h2>
            <p>{slide.subtitle}</p>
          </div>
        </div>
      ))}

      {/* DOTS */}
      <div className="dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={current === index ? "dot active" : "dot"}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;