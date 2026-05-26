import React, { useEffect, useState } from "react";
import API from "../services/api";
import { CATEGORY_MAP } from "../constants/categories";
import "./CategoryPage.css";

const PAGE_SIZE = 30;

const CategoryPage = ({ type }: { type: string }) => {
  const subcategories = CATEGORY_MAP[type as keyof typeof CATEGORY_MAP];

  const [selectedSub, setSelectedSub] = useState(
    subcategories[0]?.value
  );

  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [selectedSub, page]);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/medicines/user");

      const filtered = (res.data || []).filter(
        (item: any) =>
          item.category === type &&
          item.sub_category === selectedSub &&
          item.is_active &&
          item.show_to_users
      );

      setProducts(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="category-container">

  {/* LEFT PANEL */}
  <div className="left-panel">

    {/* SEARCH */}
    <input className="search" placeholder="Search medicines..." />

    {/* UPLOAD */}
    <div className="upload-box">
      <p>Upload Prescription</p>
      <button>Upload</button>
    </div>

    {/* CATEGORIES */}
    <div className="category-box">
      <h4>Categories</h4>

      {subcategories.map((sub) => (
        <div
          key={sub.value}
          className={`nav-pill ${
            selectedSub === sub.value ? "active" : ""
          }`}
          onClick={() => {
            setSelectedSub(sub.value);
            setPage(1);
          }}
        >
          {sub.label}
        </div>
      ))}
    </div>

  </div>

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
                <img src={`/uploads/${item.thumbnail}`} alt={item.name} />
                </div>

                <h4>{item.name}</h4>
                <p className="price">₹{item.price}</p>

                {item.requires_prescription ? (
                <span className="rx">Prescription Required</span>
                ) : (
                <button className="cart-btn">Add to Cart</button>
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
    <img src="https://www.alicantovetcare.com/wp-content/uploads/2025/02/Veterinary-Medicine-Manufacturer.jpg" />
    <img src="https://www.zenley.in/photos/image/1747660353_blogimg.jpg" />
  </div>

</div>
  );
};

export default CategoryPage;