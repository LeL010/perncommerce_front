import React, { useEffect, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import AddressForm from "./components/AddressForm";
import PaymentForm from "./components/PaymentForm";
import Review from "./components/Review";
import SuccessPage from "./SuccessPage";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import moment from "moment";
import { BACKEND_URL } from "../constants";

const steps = ["Delivery address", "Payment details", "Review your order"];

export default function Checkout() {
  const { isAuthenticated, user, getAccessTokenSilently, loginWithRedirect } =
    useAuth0();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "", // Add more fields from AddressForm
    city: "",
    state: "",
    zip: "",
    country: "",
    saveAddress: false, // Assuming saveAddress is a boolean

    cardName: "",
    cardNumber: "",
    expDate: "",
    cvv: "",
    saveCard: false, // Add more fields from PaymentForm
  });

  const [accessToken, setAccessToken] = useState(null);

  const formatPostgresDate = (postgresDate) => {
    // Create a Date object from the PostgreSQL date string
    const date = new Date(postgresDate);

    // Get the month, day, and year from the Date object
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Add 1 because months are zero-indexed
    //const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();

    // Format the date as desired (e.g., MM/DD)
    const formattedDate = `${month}/${year.toString().slice(-2)}`;
    return formattedDate;
  };

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const token = await getAccessTokenSilently({
          audience: "https://pern-commerce/api",
          scope: "read:current_user",
        });
        setAccessToken(token);
      } catch (error) {
        console.error("Error getting access token:", error);
      }
    };
    fetchAccessToken();

    const checkSaveInfo = async () => {
      if (isAuthenticated && user && user.email) {
        const accessToken = await getAccessTokenSilently({
          audience: "https://pern-commerce/api",
          scope: "read:current_user",
        });
        try {
          const response = await axios.get(
            `${BACKEND_URL}/checkouts/${user.email}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (response.status === 200) {
            const rawData = response.data;
            const checkoutInfo = rawData.find(
              (info) => info.user.userEmail === user.email
            );

            //console.log(checkoutInfo);
            if (Object.keys(checkoutInfo).length !== 0) {
              if (checkoutInfo.saveAddress && checkoutInfo.saveCard) {
                setFormData({
                  ...formData,
                  firstName: checkoutInfo.firstName,
                  lastName: checkoutInfo.lastName,
                  address1: checkoutInfo.address1,
                  address2: checkoutInfo.address2,
                  city: checkoutInfo.city,
                  state: checkoutInfo.state,
                  zip: checkoutInfo.zip,
                  country: checkoutInfo.country,
                  saveAddress: true,
                  cardName: checkoutInfo.cardName,
                  cardNumber: checkoutInfo.cardNumber,
                  expDate: formatPostgresDate(checkoutInfo.expDate),
                  cvv: checkoutInfo.cvv,
                  saveCard: true,
                });
              } else if (checkoutInfo.saveAddress) {
                setFormData({
                  ...formData,
                  firstName: checkoutInfo.firstName,
                  lastName: checkoutInfo.lastName,
                  address1: checkoutInfo.address1,
                  address2: checkoutInfo.address2,
                  city: checkoutInfo.city,
                  state: checkoutInfo.state,
                  zip: checkoutInfo.zip,
                  country: checkoutInfo.country,
                  saveAddress: true,
                });
              } else if (checkoutInfo.saveCard) {
                setFormData({
                  ...formData,
                  cardName: checkoutInfo.cardName,
                  cardNumber: checkoutInfo.cardNumber,
                  expDate: formatPostgresDate(checkoutInfo.expDate),
                  cvv: checkoutInfo.cvv,
                  saveCard: true,
                });
              }
            }
          } else {
            console.error("Invalid response status:", response.status);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    checkSaveInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const handleFormChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: typeof value === "boolean" ? value : value,
    });
  };

  const products = useLocation().state.orderItems;
  const orderId = useLocation().state.orderId;

  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const formComponents = [
    <AddressForm formData={formData} onFormChange={handleFormChange} />,
    <PaymentForm formData={formData} onFormChange={handleFormChange} />,
    <Review products={products} formData={formData} />,
  ];

  const convertMMYYToDateOnly = (mmYY) => {
    const [month, year] = mmYY.split("/");
    const dateOnly = moment(`${year}-${month}-01`, "YYYY-MM-DD").format(
      "YYYY-MM-DD"
    );
    return dateOnly;
  };

  const handleFormSubmit = async () => {
    // Handle the form submission logic here
    //console.log("Checkout Object submitted : ", formData);

    if (!isAuthenticated) {
      loginWithRedirect();
    } else {
      const checkExistingResponse = await axios.get(
        `${BACKEND_URL}/checkouts/${user.email}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (Object.keys(checkExistingResponse.data).length === 0) {
        try {
          const postResponse = await axios.post(
            `${BACKEND_URL}/checkouts`,
            {
              ...formData,
              userEmail: user.email,
              expDate: convertMMYYToDateOnly(formData.expDate),
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (postResponse.status === 201) {
            console.log("Saved checkout info : ", postResponse.data);
            handleNext();
          } else {
            // Handle other response statuses or errors
            console.log("Error:", postResponse.data);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      } else {
        try {
          const updateResponse = await axios.put(
            `${BACKEND_URL}/checkouts`,
            {
              ...formData,
              userEmail: user.email,
              expDate: convertMMYYToDateOnly(formData.expDate),
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (updateResponse.status === 200) {
            console.log(
              "Checkout info successfully updated:",
              updateResponse.data
            );
            handleNext();
          } else {
            console.error(
              `Error updating checkout info. Status ${updateResponse.status}:`,
              updateResponse.data
            );
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
      try {
        const updateOrderResponse = await axios.put(
          `${BACKEND_URL}/orders/${orderId}`,
          { userEmail: user.email, selectedProducts: JSON.stringify(products) },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (updateOrderResponse.status === 200) {
          console.log("Order successfully updated:", updateOrderResponse.data);
          handleNext();
        } else {
          console.error(
            `Error updating order info. Status ${updateOrderResponse.status}:`,
            updateOrderResponse.data
          );
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="App-header">
      <React.Fragment>
        <CssBaseline />
        <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
          <Paper
            variant="outlined"
            sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}
          >
            <Typography component="h1" variant="h4" align="center">
              Checkout
            </Typography>
            <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {activeStep === steps.length ? (
              <React.Fragment>
                <SuccessPage products={products} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                {formComponents[activeStep]}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  {activeStep !== 0 && (
                    <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                      Back
                    </Button>
                  )}
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleFormSubmit}
                      sx={{ mt: 3, ml: 1 }}
                    >
                      Place order
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 3, ml: 1 }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </React.Fragment>
            )}
          </Paper>
        </Container>
      </React.Fragment>
    </div>
  );
}
