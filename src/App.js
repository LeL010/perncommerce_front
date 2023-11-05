/* eslint-disable react-hooks/exhaustive-deps */
import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRoutes, Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { BACKEND_URL } from "./constants";

import ResponsiveAppBar from "./pages/components/Navbar";
import Homepage from "./pages/Homepage";
import About from "./pages/About";
import NoMatch from "./pages/NoMatch";
import Products from "./pages/Products";
import ProductList from "./pages/components/ProductsList";
import Product from "./pages/Product";
import Cart from "./pages/components/Cart";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Checkout from "./pages/Checkout";
import OrderList from "./pages/Orders";

import { Link as MUILink } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import Fab from "@mui/material/Fab";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import styled from "@mui/material/styles/styled";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px",
  },
}));

function Copyright() {
  return (
    <AppBar
      position="static"
      color="primary"
      elevation={0}
      sx={{
        position: "fixed",
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        bottom: 0,
        width: "100%",
      }}
    >
      <Toolbar>
        {" "}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", width: "100%" }}
        >
          {"Copyright © "}
          <MUILink color="inherit" component={RouterLink} to="/about">
            PERNCommerce
          </MUILink>{" "}
          {new Date().getFullYear()}
          {"."}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

function PrivateRoute({ element }) {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  if (!isLoading) {
    return isAuthenticated ? element : loginWithRedirect();
  }
}

function Routes({
  products,
  setProducts,
  refreshProducts,
  error,
  loading,
  addCartItem,
}) {
  const element = useRoutes([
    { path: "/", element: <Homepage /> },
    {
      path: "/products",
      element: (
        <Products products={products} refreshProducts={refreshProducts} />
      ),
      children: [
        {
          index: true,
          element: (
            <ProductList
              products={products}
              error={error}
              loading={loading}
              setSearchedProducts={setProducts}
            />
          ),
        },
        {
          path: ":slug",
          element: <Product products={products} addCartItem={addCartItem} />,
        },
      ],
    },
    { path: "/about", element: <About /> },
    { path: "/profile", element: <PrivateRoute element={<Profile />} /> },
    { path: "/onboarding", element: <PrivateRoute element={<Onboarding />} /> },
    { path: "/checkout", element: <PrivateRoute element={<Checkout />} /> },
    { path: "/orders", element: <PrivateRoute element={<OrderList />} /> },
    { path: "*", element: <NoMatch /> },
  ]);
  return element;
}

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuth0();

  const fetchProductsData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/products`);

      const products = response.data;
      const productsWithCleanKeys = [];

      products.forEach((product) => {
        const key = product.productName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
          .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
        productsWithCleanKeys[key] = product;
      });

      setProducts(productsWithCleanKeys);
      setLoading(false);
    } catch (err) {
      setError("An error occurred while fetching data.");
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    setLoading(true);
    setError("");
    fetchProductsData();
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const checkUserRole = async () => {
        try {
          const response = await axios.get(
            `${BACKEND_URL}/users/${user.email}`
          );
          const currentUser = response.data;
          if (currentUser?.userRole === null) {
            navigate("/onboarding");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Handle errors (e.g., display an error message or redirect the user)
        }
      };
      checkUserRole();
    }
  }, [isAuthenticated, user, navigate]);

  const getTotalItems = (items) => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  };

  const addCartItem = (newItem) => {
    setCartItems((prevItems) => {
      const isItemInCart = prevItems.find((item) => item.id === newItem.id);

      if (isItemInCart) {
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeCartItem = (itemId) => {
    setCartItems((prevItems) =>
      prevItems.reduce((acc, item) => {
        if (item.id === itemId) {
          if (item.quantity === 1) return acc;
          return [...acc, { ...item, quantity: item.quantity - 1 }];
        } else {
          return [...acc, item];
        }
      }, [])
    );
  };

  // Function to update parent state
  const updateDrawerState = (newValue) => {
    setCartOpen(newValue);
  };

  return (
    <div className="App">
      <ResponsiveAppBar />
      <header>
        <Drawer
          anchor="right"
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          PaperProps={{
            sx: {
              color: "rgba(225,249,27,1)",
              backgroundColor: "rgba(30, 139, 195, 0.8)",
            },
          }}
        >
          <Cart
            cartItems={cartItems}
            addCartItem={addCartItem}
            removeCartItem={removeCartItem}
            setCartOpen={updateDrawerState}
            setCartItems={setCartItems}
          />
        </Drawer>
        <Fab
          color="primary"
          aria-label="shoppingCart"
          style={{ right: 20, bottom: 85, position: "fixed" }}
          onClick={() => {
            setCartOpen(true);
          }}
        >
          <StyledBadge
            badgeContent={getTotalItems(cartItems)}
            color="secondary"
          >
            <ShoppingCartIcon />
          </StyledBadge>
        </Fab>
        <Routes
          products={products}
          setProducts={setProducts}
          error={error}
          loading={loading}
          addCartItem={addCartItem}
          refreshProducts={refreshProducts}
        />
        <Copyright />
      </header>
    </div>
  );
}

export default App;
