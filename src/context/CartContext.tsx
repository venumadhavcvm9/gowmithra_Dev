import React, { createContext, useContext, useReducer, useEffect } from "react";

export interface CartItem {
  medicine_id: string;
  name: string;
  price: number;
  thumbnail: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { medicine_id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { medicine_id: string; quantity: number } }
  | { type: "CLEAR_CART" };

let savedItems = [];
try {
  savedItems = JSON.parse(localStorage.getItem("gowmithra_cart") || "[]");
} catch (e) {
  console.error("Failed to parse cart from local storage", e);
}

const initialState: CartState = {
  items: savedItems,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.medicine_id === action.payload.medicine_id
      );
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return { ...state, items: updatedItems };
      } else {
        return { ...state, items: [...state.items, action.payload] };
      }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.medicine_id !== action.payload.medicine_id
        ),
      };
    case "UPDATE_QUANTITY": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.medicine_id === action.payload.medicine_id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case "CLEAR_CART":
      return { ...state, items: [] };
    default:
      return state;
  }
};

interface CartContextProps {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (medicine_id: string) => void;
  updateQuantity: (medicine_id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("gowmithra_cart", JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeItem = (medicine_id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { medicine_id } });
  };

  const updateQuantity = (medicine_id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(medicine_id);
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { medicine_id, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
