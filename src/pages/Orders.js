/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Container,
  Box,
  Button,
  Stack,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../constants";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const { user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (!user || !getAccessTokenSilently) {
      return;
    }
    fetchOrders();
  }, [user, getAccessTokenSilently]);

  const fetchOrders = async () => {
    const accessToken = await getAccessTokenSilently({
      audience: "https://pern-commerce/api",
      scope: "read:current_user",
    });

    try {
      const response = await axios.get(
        `${BACKEND_URL}/orders/${user.email}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const formattedDateTime = (isoDateTime) => {
        if (isoDateTime) {
          const date = new Date(isoDateTime);
          return format(date, "yyyy-MM-dd HH:mm:ss");
        }
        return "TBA";
      };

      // Parse selectedProducts field in each order to an array of objects
      const parsedOrders = response.data.map((order) => ({
        ...order,
        selectedProducts: JSON.parse(order.selectedProducts),
        dateFulfilled: formattedDateTime(order.dateFulfilled),
        createdAt: formattedDateTime(order.createdAt),
      }));

      const ordersWithTBADate = parsedOrders.filter(
        (order) => order.dateFulfilled === "TBA"
      );
      const ordersWithFulfilledDate = parsedOrders.filter(
        (order) => order.dateFulfilled !== "TBA"
      );

      const finalOrders = [...ordersWithTBADate, ...ordersWithFulfilledDate];

      setOrders(finalOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleDelete = async (orderId) => {
    const accessToken = await getAccessTokenSilently({
      audience: "https://pern-commerce/api",
      scope: "read:current_user",
    });

    try {
      await axios.delete(`${BACKEND_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // After successful delete, refresh the orders list
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const navigate = useNavigate();

  // Function to navigate to checkout
  const handleCheckout = (selectedProducts, id) => {
    navigate("/checkout", {
      state: { orderItems: selectedProducts, orderId: id },
    });
  };

  return (
    <div className="App-header">
      <Container maxWidth="lg" style={{ marginTop: 50 }}>
        <Box mt={4} mb={4}>
          <Typography variant="h4" gutterBottom>
            Order Details
          </Typography>
          {orders.map((order) => (
            <Card key={order.id} style={{ marginBottom: "20px" }}>
              <CardContent>
                <Typography variant="h5">Order ID: #{order.id}</Typography>
                <Typography variant="subtitle1">
                  Order Status: {order.orderStatus}
                </Typography>
                <Typography variant="subtitle1">
                  Date Fulfilled: {order.dateFulfilled}
                </Typography>
                <Typography variant="subtitle1">
                  Created At: {order.createdAt}
                </Typography>
                <Typography variant="subtitle1">
                  Total Price: ${order.totalPrice}
                </Typography>

                {order.orderStatus === "Order placed, pending for checkout" && (
                  <Stack
                    direction="row"
                    justifyContent="center"
                    alignContent="center"
                    spacing={2}
                    margin={2}
                  >
                    <Button
                      variant="contained"
                      color="secondary"
                      endIcon={<AddShoppingCartIcon />}
                      onClick={() =>
                        handleCheckout(order.selectedProducts, order.id)
                      }
                    >
                      Checkout
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      endIcon={<DeleteIcon />}
                      onClick={() => handleDelete(order.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                )}

                <Typography variant="h6" gutterBottom marginTop={5}>
                  Products:
                </Typography>
                <Grid container spacing={2}>
                  {order.selectedProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card style={{ height: "100%" }}>
                        <CardMedia
                          component="img"
                          style={{ objectFit: "contain" }}
                          height="140"
                          image={product.image}
                          alt={product.productName}
                        />
                        <CardContent>
                          <Typography variant="subtitle1">
                            {product.productName}
                          </Typography>
                          <Typography variant="subtitle1">
                            ${product.productPrice}
                          </Typography>
                          <Typography variant="subtitle1">
                            Quantity: {product.quantity}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </div>
  );
};

export default OrderList;
