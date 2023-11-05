import React from "react";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Recommend from "./components/Recommend";

export default function SuccessPage({ products }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" align="center" gutterBottom>
        Order Placed Successfully
      </Typography>
      <Typography variant="body1" align="center">
        Thank you for your order. Your order has been successfully placed. We
        will send you an order confirmation and update when your order has
        shipped.
      </Typography>
      <br />
      <Recommend products={products} />
    </Container>
  );
}
