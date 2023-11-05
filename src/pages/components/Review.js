import React from "react";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";

export default function Review({ products, formData }) {
  const {
    address1,
    city,
    zip,
    cardName,
    cardNumber,
    expDate,
    firstName,
    lastName
  } = formData;

  // Calculate the total cost
  const totalCost = products.reduce((total, product) => {
    return total + product.productPrice * product.quantity;
  }, 0);

  function censorCreditCardNumber(creditCardNumber) {
      const visiblePart = creditCardNumber.slice(-4);
      const censoredPart = "X".repeat(12);
      return censoredPart.replace(/(.{4})/g, "$1-") + visiblePart;
  }

  const addresses = [address1, zip, city];
  const payments = [
    { name: "Card holder", detail: cardName },
    { name: "Card number", detail: censorCreditCardNumber(cardNumber) },
    { name: "Expiry date", detail: expDate },
  ];
  const buyerName = `${firstName} ${lastName}`;

  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        Order summary
      </Typography>
      <List disablePadding>
        {products.map((product) => (
          <ListItem key={product.id} sx={{ py: 1, px: 0 }}>
            <ListItemText
              primary={product.productName}
              secondary={`x ${product.quantity}`}
            />
            <Typography variant="body2">{`$${product.productPrice.toFixed(
              2
            )}`}</Typography>
          </ListItem>
        ))}
        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Total" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {`$${totalCost}`}
          </Typography>
        </ListItem>
      </List>
      <Grid container spacing={2} >
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Delivery
          </Typography>
          <Typography gutterBottom>{buyerName}</Typography>
          <Typography gutterBottom>{addresses.join(", ")}</Typography>
        </Grid>
        <Grid item container direction="column" xs={12} sm={6}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Payment details
          </Typography>
          <Grid container>
            {payments.map((payment) => (
              <React.Fragment key={payment.name}>
                <Grid item xs={6}>
                  <Typography gutterBottom>{payment.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography gutterBottom>{payment.detail}</Typography>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
