import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./MedicineSection.css";

const categories = [
  { key: "Supplements", label: "Supplements", route: "/supplements" },
  { key: "First Aid", label: "First Aid", route: "/first-aid" },
  { key: "Feed Additives", label: "Feed Additives", route: "/feed-additives" },
];

export interface Medicine {
  medicine_id: string;
  name: string;
  price: number;
  thumbnail: string;
  category: string;
  is_active: boolean;
  show_to_users: boolean;
}

const MedicineSection = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const { state, addItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await API.get("/medicines/user");

      const filtered = (res.data || []).filter(
        (m: Medicine) => m.is_active && m.show_to_users
      );

      setMedicines(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // Convert cart to a dictionary for O(1) lookup
  const cartMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    state.items.forEach(item => {
      map[item.medicine_id] = item.quantity;
    });
    return map;
  }, [state.items]);

  const getQty = (id: string) => cartMap[id] || 0;

  const handleAdd = (med: Medicine) => {
    addItem({
      medicine_id: med.medicine_id,
      name: med.name,
      price: med.price,
      thumbnail: med.thumbnail,
      quantity: 1,
    });
  };

  const handleIncrease = (med: Medicine) => {
    updateQuantity(med.medicine_id, getQty(med.medicine_id) + 1);
  };

  const handleDecrease = (med: Medicine) => {
    updateQuantity(med.medicine_id, getQty(med.medicine_id) - 1);
  };

  return (
    <div className="medicine-section">

      {categories.map((cat) => {
        const items = medicines
          .filter((m) => m.category?.toLowerCase() === cat.key.toLowerCase())
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
                      <div className="card" key={med.medicine_id} style={{ textAlign: 'center' }}>

                        {/* IMAGE */}
                        <div className="img-box">
                          <img src={`${med.thumbnail}`} alt={med.name} />
                        </div>

                        {/* CONTENT */}
                        <h4 className="title">{med.name}</h4>
                        <p className="price" style={{ margin: '8px 0' }}>₹{med.price}</p>

                        {/* ACTION */}
                        {!getQty(med.medicine_id) ? (
                          <button
                            className="cart-btn"
                            style={{ width: '100%', padding: '8px', border: 'none', background: '#22c55e', color: 'white', borderRadius: '6px', cursor: 'pointer', marginTop: '5px' }}
                            onClick={() => handleAdd(med)}
                          >
                            Add to cart
                          </button>
                        ) : (
                          <div className="qty-control" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '5px 10px', borderRadius: '20px', border: '1px solid #e9ecef', marginTop: '10px' }}>
                            <button style={{ border: 'none', background: '#22c55e', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleDecrease(med)}>-</button>
                            <span style={{ fontWeight: '600', color: 'black' }}>{getQty(med.medicine_id)}</span>
                            <button style={{ border: 'none', background: '#22c55e', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleIncrease(med)}>+</button>
                          </div>
                        )}
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