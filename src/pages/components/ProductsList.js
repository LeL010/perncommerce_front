import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { CardActionArea } from "@mui/material";
import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import axios from "axios";
import { Link } from "react-router-dom";
import { BACKEND_URL } from "../../constants";

export default function ProductList({
  products,
  loading,
  error,
  setSearchedProducts,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const filterData = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.get(
        `${BACKEND_URL}/products/search`,
        {
          params: { query: searchQuery },
        }
      );

      if (response.data.length === 0) {
        // No products found for the search query
        setSearchedProducts(["No Products Found"]); // Set a string message as a single-item array
      } else {
        const productsWithCleanKeys = [];

        response.data.forEach((product) => {
          const key = product.productName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
          productsWithCleanKeys[key] = product;
        });
        setSearchedProducts(productsWithCleanKeys); // Set the searched products
      }
    } catch (error) {
      console.error("Error fetching searched products:", error);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignSelf: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 20,
        }}
      >
        <form onSubmit={filterData}>
          <TextField
            id="search-bar"
            className="text"
            onChange={handleInputChange}
            label="Enter a product name or description"
            variant="outlined"
            placeholder="Search..."
            size="medium"
          />
          <IconButton type="submit" aria-label="search">
            <SearchIcon style={{ fill: "blue" }} />
          </IconButton>
        </form>
        <div style={{ padding: 3 }}></div>
      </div>
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          <Grid
            container
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            align="center"
          >
            {Object.keys(products).map((key) => {
              const product = products[key];
              return (
                <Grid
                  item
                  justifyContent="center"
                  style={{ display: "flex" }}
                  key={product.id}
                >
                  <Card
                    raised
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexDirection: "column",
                      width: 300, // Fixed width for the Card
                      height: 350, // Fixed height for the Card
                    }}
                    sx={{ width: "100%", height: 350 }}
                  >
                    <CardActionArea
                      component={Link}
                      to={`/products/${encodeURIComponent(key)}`}
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardMedia
                        component="img"
                        height={250}
                        width="100%"
                        sx={{ objectFit: "contain" }}
                        image={product.image}
                        alt={product.productName}
                      />
                      <CardContent style={{ height: 100, overflow: "hidden" }}>
                        <Typography
                          gutterBottom
                          variant="h5"
                          component="div"
                          style={{ height: 30 }}
                        >
                          {`$${product.productPrice}`}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          style={{
                            height: 60,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {product.productName}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </div>
  );
}
