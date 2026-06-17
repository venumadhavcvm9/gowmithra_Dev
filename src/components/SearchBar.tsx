import React, { useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const { addItem, state, updateQuantity } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await API.get("/medicines/user");
        setMedicines(res.data || []);
      } catch (err) {
        console.error("Error fetching medicines for search", err);
      }
    };
    fetchMedicines();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const filtered = medicines.filter(
      (m) =>
        m.is_active &&
        m.show_to_users &&
        (m.name.toLowerCase().includes(lowerQuery) ||
          (m.category && m.category.toLowerCase().includes(lowerQuery)))
    );

    setResults(filtered.slice(0, 6));
    setShowDropdown(true);
  }, [debouncedQuery, medicines]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getQty = (id: string) => state.items.find((i) => i.medicine_id === id)?.quantity || 0;

  const handleAdd = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    addItem({
      medicine_id: item.medicine_id,
      name: item.name,
      price: item.price,
      thumbnail: item.thumbnail,
      quantity: 1,
    });
  };

  const handleIncrease = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    updateQuantity(item.medicine_id, getQty(item.medicine_id) + 1);
  };

  const handleDecrease = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    updateQuantity(item.medicine_id, getQty(item.medicine_id) - 1);
  };

  const handleItemClick = (item: any) => {
    // Navigate to details if implemented, else to its category page for now
    let catPath = "";
    if (item.category === "Medicines") catPath = "/buy-medicine";
    else if (item.category === "Supplements") catPath = "/supplements";
    else if (item.category === "First Aid") catPath = "/first-aid";
    else if (item.category === "Feed Additives") catPath = "/feed-additives";
    
    if (catPath) {
      navigate(catPath);
      setShowDropdown(false);
      setQuery("");
    }
  };

  return (
    <div className={`premium-search-container ${className || ""}`} ref={dropdownRef}>
      <div className="search-box-inner">
        <input
          type="text"
          placeholder="Search medicines..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() !== "") setShowDropdown(true);
          }}
        />
        <span className="search-icon">🔍</span>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((item) => (
            <div className="search-item" key={item.medicine_id} onClick={() => handleItemClick(item)}>
              <img src={item.thumbnail} alt={item.name} className="search-thumb" />
              <div className="search-info">
                <h4>{item.name}</h4>
                <p>₹{item.price}</p>
              </div>
              <div className="search-action">
                {item.requires_prescription ? (
                  <span className="rx-badge">Rx</span>
                ) : !getQty(item.medicine_id) ? (
                  <button className="add-btn" onClick={(e) => handleAdd(e, item)}>Add</button>
                ) : (
                  <div className="qty-control-small">
                    <button onClick={(e) => handleDecrease(e, item)}>-</button>
                    <span>{getQty(item.medicine_id)}</span>
                    <button onClick={(e) => handleIncrease(e, item)}>+</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && query.trim() !== "" && results.length === 0 && (
        <div className="search-dropdown empty-search">
          <p>No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
