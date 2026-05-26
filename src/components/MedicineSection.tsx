import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "./MedicineSection.css";

const categories = [
  { key: "SUPPLEMENTS", label: "Supplements", route: "/supplements" },
  { key: "FIRST_AID", label: "First Aid", route: "/first-aid" },
  { key: "FEED_ADDITIVES", label: "Feed Additives", route: "/feed-additives" },
];

const MedicineSection = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await API.get("/medicines/user");

      const filtered = (res.data || []).filter(
        (m: any) => m.is_active && m.show_to_users
      );

      setMedicines(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const increaseQty = (id: string) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const decreaseQty = (id: string) => {
    setCart((prev) => {
      const qty = (prev[id] || 0) - 1;
      if (qty <= 0) {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      }
      return { ...prev, [id]: qty };
    });
  };

  return (
    <div className="medicine-section">

      {categories.map((cat) => {
        const items = medicines
          .filter((m) => m.category === cat.key)
          .slice(0, 8); // ✅ max 8 products

        return (
          <div key={cat.key} className="category-block">

            {/* HEADER */}
            <div className="section-header">
              <h2>{cat.label}</h2>
            </div>

            <div className="category-layout">

              {/* PRODUCTS */}
              <div className="products">

                {items.length === 0 ? (
                  <div className="empty-state">
                    <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" />
                    <p>No products available</p>
                  </div>
                ) : (
                  <div className="grid">

                    {items.map((med) => (
                        <div className="card" key={med.medicine_id}>
  
                          {/* IMAGE */}
                          <div className="img-box">
                            <img src={`/uploads/${med.thumbnail}`} alt={med.name} />
                          </div>

                          {/* CONTENT */}
                          <div className="card-content">
                            <h4 className="title">{med.name}</h4>

                            <div className="bottom-row">
                              
                              {/* PRICE */}
                              <span className="price">₹{med.price}</span>

                              {/* ACTION */}
                              {!cart[med.medicine_id] ? (
                                <button
                                  className="add-btn"
                                  onClick={() => increaseQty(med.medicine_id)}
                                >
                                  + Add
                                </button>
                              ) : (
                                <div className="qty-control">
                                  <button onClick={() => decreaseQty(med.medicine_id)}>-</button>
                                  <span>{cart[med.medicine_id]}</span>
                                  <button onClick={() => increaseQty(med.medicine_id)}>+</button>
                                </div>
                              )}

                            </div>
                          </div>
                        </div>
                    ))}

                    {/* VIEW MORE (ALWAYS LAST) */}
                    <div
                      className="card view-more"
                      onClick={() => navigate(cat.route)}
                    >
                      <span>View More →</span>
                      <p>{cat.label}</p>
                    </div>

                  </div>
                )}

              </div>

              {/* ADS */}
              <div className="ads">
                <img src="https://www.alicantovetcare.com/wp-content/uploads/2025/02/Veterinary-Medicine-Manufacturer.jpg" />
                <img src="https://www.zenley.in/photos/image/1747660353_blogimg.jpg" />
              </div>

            </div>

          </div>
        );
      })}
    </div>
  );
};

export default MedicineSection;