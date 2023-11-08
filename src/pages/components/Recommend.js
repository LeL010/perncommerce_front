/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { BACKEND_URL } from "../../constants";
const brain = require("brain.js");

function Recommend({ products }) {
  const { user, isLoading, getAccessTokenSilently } = useAuth0();
  const [productIndex, setProductIndex] = useState({});
  const [ordersHistory, setOrdersHistory] = useState();
  const [trainingSet, setTrainingSet] = useState(null);
  const [trainedNetwork, setTrainedNetwork] = useState(null); // State to store the trained network
  const [testCart, setTestCart] = useState([]);
  const [mappedRecommendations, setMappedRecommendations] = useState([]);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!isLoading && user) {
        try {
          const accessToken = await getAccessTokenSilently({
            audience: "https://pern-commerce/api",
            scope: "read:current_user",
          });

          const [ordersResponse, productsResponse] = await Promise.all([
            axios.get(`${BACKEND_URL}/orders/${user.email}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }),
            axios.get(`${BACKEND_URL}/products`),
          ]);

          const orders = ordersResponse.data;
          const listOfProducts = productsResponse.data;

          const distinctItems = new Set(
            listOfProducts.map((product) => product.productName)
          );
          console.log(
            distinctItems.size + " unique items found in sales history"
          );
          setItemCount(distinctItems.size);
          console.log(listOfProducts);
          const productIndexMap = {};
          listOfProducts.forEach((product, index) => {
            productIndexMap[product.productName] = index; // Index starts from 1
          });
          console.log(productIndexMap);
          setProductIndex(productIndexMap);

          if (products) {
            const productNamesArray = products.map(
              (product) => product.productName
            );

            // Mapping product names to their indices
            const productIndexArray = productNamesArray.map((productName) => {
              return productIndexMap[productName] || -1; // Get the index or return -1 if the product name is not found
            });

            setTestCart(productIndexArray);
          }
          //console.log(orders);
          // Check if orders exist before mapping them
          if (orders && Array.isArray(orders)) {
            const mappedOrders = orders.map((order) => {
              // Check if order.selectedProducts is a valid JSON string
              const products =
                typeof order.selectedProducts === "string"
                  ? JSON.parse(order.selectedProducts)
                  : [];
              const productNames = Array.isArray(products)
                ? products.map(
                    (product) => productIndexMap[product.productName]
                  )
                : [];
              return productNames;
            });
            console.log(mappedOrders);
            setOrdersHistory(mappedOrders);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          // Handle errors: Show a message to the user or attempt recovery
        }
      }
    }

    fetchData();
  }, [isLoading, user, getAccessTokenSilently]);

  useEffect(() => {
    if (ordersHistory && itemCount > 0) {
      const training = createTrainingSet(ordersHistory, itemCount);
      setTrainingSet(training);
    }
  }, [ordersHistory]);

  useEffect(() => {
    if (trainingSet) {
      trainNeuralNetwork(trainingSet);
    }
  }, [trainingSet]);

  function convertToBinaryArray(cart, itemCount, outputSize) {
    const a = new Array(itemCount).fill(0);
    cart.forEach((item) => {
      a[item - 1] = 1; // Adjust to 0-based index
    });

    // Pad the array to match the output size
    if (a.length < outputSize) {
      const diff = outputSize - a.length;
      for (let i = 0; i < diff; i++) {
        a.push(0);
      }
    }

    return a;
  }

  function createTrainingSet(ordersHistory, itemCount) {
    const trainingSet = [];
    const outputSize = itemCount; // Adjust as needed

    ordersHistory.forEach((cart) => {
      cart.forEach((item, index) => {
        const input = convertToBinaryArray([item], itemCount, outputSize);
        const output = convertToBinaryArray(
          cart.filter((_, i) => i !== index),
          itemCount,
          outputSize
        );
        trainingSet.push({ input, output });
      });
    });

    console.log("Created Training Set : ", trainingSet);
    return trainingSet;
  }

  function trainNeuralNetwork(trainingSet) {
    let config = {
      binaryThresh: 0.33,
      hiddenLayers: [15, 10],
      activation: "sigmoid",
    };

    let net = new brain.NeuralNetwork(config);

    console.log("Beginning training");
    net.train(trainingSet, { log: true, iterations: 2000 });
    console.log("Training complete");

    setTrainedNetwork(net);
  }

  function generateRecommendations(inputCart, itemCount) {
    if (!trainedNetwork) {
      console.error("The neural network is not trained yet.");
      return null;
    }

    const recommendations = trainedNetwork.run(
      convertToBinaryArray(inputCart, itemCount)
    );

    inputCart.forEach((item) => {
      recommendations[item - 1] = 0; // Adjust to 0-based index
    });

    console.log("Recommendations", recommendations);

    // Get the keys of the recommendations object and sort them based on the values in descending order
    const sortedRecommendations = Object.keys(recommendations).sort(
      (a, b) => recommendations[b] - recommendations[a]
    );

    // Extract the top 3 product indices
    const top3Recommendations = sortedRecommendations.slice(0, 3);

    // Extract the top 3 product indices as numbers
    const top3RecommendationsAsNumbers = top3Recommendations.map((index) =>
      parseInt(index, 10)
    );

    console.log("Top 3 Recommendations:", top3RecommendationsAsNumbers);

    return top3RecommendationsAsNumbers;
  }

  function mapRecommendationsToProducts(top3Recommendations) {
    const recommendationsMapped = top3Recommendations.map((index) => {
      const productName = Object.keys(productIndex).find(
        (key) => productIndex[key] === index
      );
      return { [productName]: index };
    });

    console.log(
      "Top 3 Recommendations Mapped to Products:",
      recommendationsMapped
    );

    return recommendationsMapped;
  }

  useEffect(() => {
    if (trainedNetwork && ordersHistory && itemCount > 0) {
      const top3Recommendations = generateRecommendations(
        testCart,
        itemCount
      );
      const recommendationsMapped =
        mapRecommendationsToProducts(top3Recommendations);
      setMappedRecommendations(recommendationsMapped);
      // Use recommendationsMapped as needed (display to the user, etc.)
    }
  }, [trainedNetwork, ordersHistory, testCart, itemCount]);

  return (
    <Container>
      <Typography variant="h4">You may be interested in</Typography>
      {ordersHistory && itemCount > 0 && mappedRecommendations.length > 0 ? (
        mappedRecommendations.map((recommendation, index) => {
          const productName = Object.keys(recommendation)[0]; // Extract product name

          return (
            <Typography variant="body1" key={index}>
              {index + 1}: {productName}
            </Typography>
          );
        })
      ) : (
        <Typography variant="body1">
          Loading or no valid recommendations
        </Typography>
      )}
    </Container>
  );
}

export default Recommend;
