import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Rating from "@mui/material/Rating";
import StarIcon from "@mui/icons-material/Star";
import Chip from "@mui/material/Chip";
import { Button } from "@mui/material";
import { useAuth0 } from "@auth0/auth0-react";
import { BACKEND_URL } from "../constants";

export default function Product({ products, addCartItem }) {
  let { slug } = useParams();
  const initialProductState = products[slug];

  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(-1);

  const [count, setCount] = useState(0);
  //const [statRates, setStatRates] = useState();
  const [stateRatings, setStateRatings] = useState();

  const { getAccessTokenSilently, user, isAuthenticated, loginWithRedirect } =
    useAuth0();

  // Define a function to get or set the product state in local storage
  const getSetProductFromLocalStorage = (product) => {
    if (product) {
      // Store the product state in local storage
      localStorage.setItem("productState", JSON.stringify(product));
    } else {
      // Retrieve the product state from local storage
      const storedProduct = JSON.parse(localStorage.getItem("productState"));
      return storedProduct || null;
    }
  };

  // Initialize the product state using the URL slug or local storage
  const [product] = useState(
    initialProductState || getSetProductFromLocalStorage()
  );

  const fetchRatings = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/ratings/${product.id}`
      );

      const matchingRatings = response.data;
      setStateRatings(matchingRatings);

      const sumRatings = matchingRatings.reduce(
        (total, rating) => total + rating.ratings,
        0
      );
      setCount(matchingRatings.length);

      const valueRatings = Number(
        (sumRatings / matchingRatings.length).toFixed(2)
      );

      setValue(valueRatings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  }, [product.id]);

  useEffect(() => {
    if (product) {
      getSetProductFromLocalStorage(product);
      fetchRatings();
    }
  }, [product, fetchRatings]);

  if (!product) {
    return <span>The product page you've requested doesn't exist.</span>;
  }

  // Create a function to update the rating
  const updateRating = async (newValue) => {
    const filteredRatings = stateRatings.filter(
      (rating) => rating.user.userEmail === user.email
    );

    if (filteredRatings.length === 0) {
      try {
        // Define the data to be sent in the request body
        const data = {
          productId: product.id,
          ratings: hover,
          userEmail: user.email,
        };

        const accessToken = await getAccessTokenSilently({
          audience: "https://pern-commerce/api",
          scope: "read:current_user",
        });

        // Send a POST request to update the rating
        const response = await axios.post(
          `${BACKEND_URL}/ratings`,
          data,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          // Handle a successful response, if needed
          console.log("Rating updated successfully");
          setValue(newValue);
          await fetchRatings();
        }
      } catch (error) {
        // Handle errors, e.g., show an error message to the user
        console.error("Error updating rating:", error);
      }
    } else {
      alert("You have already given a rating!");
      setHover(-1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "start",
        height: "75vh",
        margin: 100,
      }}
    >
      <Card
        sx={{
          display: "flex",
          width: "75%",
          height: 400,
        }}
      >
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Typography component="h2" variant="h5">
            {product.productName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {`$${product.productPrice}`}
          </Typography>
          <Typography variant="subtitle1" paragraph>
            {product.productDesc}
          </Typography>

          <Rating
            name="hover-feedback"
            value={value}
            precision={0.5}
            onChange={(event, newValue) => {
              updateRating(newValue);
            }}
            onChangeActive={(event, newHover) => {
              setHover(newHover);
            }}
            emptyIcon={
              <StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />
            }
          />
          {value !== null && (
            <Typography variant="subtitle1" paragraph>
              {hover !== -1
                ? `${hover} Stars`
                : `${value} Stars out of ${count} ratings`}
            </Typography>
          )}
          {product.categories.map((category) => (
            <Chip
              key={category.id}
              label={category.categoryName}
              variant="outlined"
            />
          ))}
          <Button
            style={{
              display: "flex",
              flexWrap: "wrap",
              margin: 20,
            }}
            variant="contained"
            onClick={() =>
              !isAuthenticated ? loginWithRedirect() : addCartItem(product)
            }
          >
            Add to cart
          </Button>
        </CardContent>
        <CardMedia
          component="img"
          sx={{
            width: "25%",
            objectFit: "contain",
            display: { xs: "none", sm: "block" },
          }}
          image={product.image}
          alt={product.title}
        />
      </Card>
    </div>
  );
}
