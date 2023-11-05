import React from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import { BACKEND_URL } from "../../constants";

const cartStyles = {
  fontFamily: "Arial, Helvetica, sans-serif",
  width: 500,
  padding: 20,
};

const wrapperStyles = {
  flex: 1,
  display: "flex",
  justifyContent: "space-between",
  fontFamily: "Arial, Helvetica, sans-serif",
  borderBottom: "1px solid lightblue",
  paddingBottom: "20px",
};

const divStyles = {
  flex: 1,
};

const informationStyles = {
  display: "flex",
  justifyContent: "space-between",
  flex: 1,
};

const buttonsStyles = {
  display: "flex",
  justifyContent: "space-between",
  flex: 1,
};

const imgStyles = {
  maxWidth: "80px",
  objectFit: "cover",
  marginLeft: "40px",
};

export default function Cart({
  cartItems,
  addCartItem,
  removeCartItem,
  setCartOpen,
  setCartItems,
}) {
  const { isAuthenticated, user, loginWithRedirect, getAccessTokenSilently } =
    useAuth0();

  const navigate = useNavigate();

  // Function to calculate the total price of items in the cart
  const calculateTotalPrice = (items) => {
    const totalPrice = items.reduce(
      (acc, item) => acc + item.quantity * item.productPrice,
      0
    );
    return totalPrice;
  };

  const handleProceedToCheckout = async () => {
    // Log the updated cartItems
    console.log("Updated cartItems:", cartItems);

    if (!isAuthenticated) {
      loginWithRedirect();
    } else {
      try {
        // Retrieve access token
        const accessToken = await getAccessTokenSilently({
          audience: "https://pern-commerce/api",
          scope: "read:current_user",
        });

        // Make a POST request to your backend endpoint
        const response = await axios.post(
          `${BACKEND_URL}/orders`,
          {
            totalPrice: calculateTotalPrice(cartItems).toFixed(2),
            userEmail: user.email,
            selectedProducts: JSON.stringify(cartItems),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 201) {
          // Handle a successful response, e.g., display a success message to the user
          console.log("Checkout successful:", response.data);
          navigate("/checkout", { state: { orderItems: cartItems, orderId: response.data.id } });
          setCartItems([]);
        } else {
          // Handle other response statuses or errors
          console.log("Error:", response.data);
        }
      } catch (error) {
        // Handle network errors or other issues
        console.error("Error during checkout:", error);
      }

      // Close the cart
      setCartOpen(false);
    }
  };

  return (
    <div style={cartStyles}>
      <h2>Shopping Cart</h2>

      {cartItems.length === 0 ? <p>No items in cart.</p> : null}
      {cartItems.map((item) => (
        <div key={item.id} style={wrapperStyles}>
          <div style={divStyles}>
            <h3>{item.title}</h3>
            <div className="information" style={informationStyles}>
              <p>Price: ${item.productPrice}</p>
              <p>Total: ${(item.quantity * item.productPrice).toFixed(2)}</p>
            </div>
            <div className="buttons" style={buttonsStyles}>
              <Button
                size="small"
                disableElevation
                variant="contained"
                onClick={() => removeCartItem(item.id)}
              >
                -
              </Button>
              <p>{item.quantity}</p>
              <Button
                size="small"
                disableElevation
                variant="contained"
                onClick={() => addCartItem(item)}
              >
                +
              </Button>
            </div>
          </div>
          <img src={item.image} alt={item.productName} style={imgStyles} />
        </div>
      ))}

      <h2>Total Price: ${calculateTotalPrice(cartItems).toFixed(2)}</h2>
      <Button
        variant="contained"
        style={{
          width: "93%",
          bottom: 0,
          position: "absolute",
          textAlign: "center",
        }}
        onClick={() => handleProceedToCheckout()}
      >
        Proceed to checkout
      </Button>
    </div>
  );
}
