import React, { useEffect, useState } from "react";
import API from "../services/api";
import { CATEGORY_MAP } from "../constants/categories";
import { useCart } from "../context/CartContext";
import "./CategoryPage.css";

const PAGE_SIZE = 30;

const CategoryPage = ({ type }: { type: string }) => {
  const subcategories = CATEGORY_MAP[type as keyof typeof CATEGORY_MAP];

  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const { state, addItem, updateQuantity } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [selectedSub, page]);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/medicines/user");

      const filtered = (res.data || []).filter(
        (item: any) =>
          item.category === type &&
          (!selectedSub || item.sub_category === selectedSub) &&
          item.is_active &&
          item.show_to_users
      );

      setProducts(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const getQty = (id: string) => state.items.find((i) => i.medicine_id === id)?.quantity || 0;

  const handleAdd = (item: any) => {
    addItem({
      medicine_id: item.medicine_id,
      name: item.name,
      price: item.price,
      thumbnail: item.thumbnail,
      quantity: 1,
    });
  };

  const handleIncrease = (item: any) => {
    updateQuantity(item.medicine_id, getQty(item.medicine_id) + 1);
  };

  const handleDecrease = (item: any) => {
    updateQuantity(item.medicine_id, getQty(item.medicine_id) - 1);
  };

  return (
    <div className="category-container">

      {/* MIDDLE PRODUCTS */}
      <div className="products-section">

        <h2 className="section-title">Products</h2>

        {products.length === 0 ? (
          <div className="empty-state">

            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              alt="No medicines"
            />

            <h3>No medicines available</h3>

            <p>
              Looks like no products are added in this category yet.
              Please check back later or explore other categories.
            </p>

          </div>
        ) : (
          <div className="grid">
            {products.map((item) => (
              <div className="card" key={item.medicine_id}>
                <div className="img-wrap">
                  <img src={`${item.thumbnail}`} alt={item.name} />
                </div>

                <h4>{item.name}</h4>
                <p className="price">₹{item.price}</p>

                {item.requires_prescription ? (
                  <span className="rx">Prescription Required</span>
                ) : !getQty(item.medicine_id) ? (
                  <button className="cart-btn" onClick={() => handleAdd(item)}>Add to Cart</button>
                ) : (
                  <div className="qty-control" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '5px 10px', borderRadius: '20px', border: '1px solid #e9ecef', marginTop: '10px' }}>
                    <button style={{ border: 'none', background: '#22c55e', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleDecrease(item)}>-</button>
                    <span style={{ fontWeight: '600', color: 'black' }}>{getQty(item.medicine_id)}</span>
                    <button style={{ border: 'none', background: '#22c55e', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleIncrease(item)}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {products.length >= PAGE_SIZE && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              ← Prev
            </button>

            <span>Page {page}</span>

            <button onClick={() => setPage(page + 1)}>
              Next →
            </button>
          </div>
        )}

      </div>

      {/* RIGHT ADS */}
      <div className="right-panel">
        <img className="img1" src="https://www.alicantovetcare.com/wp-content/uploads/2025/02/Veterinary-Medicine-Manufacturer.jpg" />
        <img className="img2" src="https://www.zenley.in/photos/image/1747660353_blogimg.jpg" />
      </div>

    </div>
  );
};

export default CategoryPage;