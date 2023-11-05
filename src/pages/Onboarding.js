import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { TextField, Button, Typography, Container, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { BACKEND_URL } from "../constants";


const Onboarding = () => {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      const checkFirstTimeLogin = async () => {
        if (user) {
          const response = await axios.get(
            `${BACKEND_URL}/users/${user.email}`
          );
          const currentUser = response.data;
          if (currentUser !== null) {
            const currentUser = response.data;
            if (currentUser.userRole !== null) {
              navigate("/");
            }
          }
        }
      };
      checkFirstTimeLogin();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    // User is not authenticated, show a loading indicator or message
    return <div>Loading...</div>;
  }

  const handleUserRoleChange = (event) => {
    setUserRole(event.target.value);
  };

  const handleUserNameChange = (event) => {
    setUserName(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // You can handle form submission here, such as sending the data to your server.
    // Example: axios.post("/api/onboarding", { userRole, userName });
    const signup = async () => {
      try {
        const response = await axios.post(`${BACKEND_URL}/users`, {
          userRole: userRole,
          userName: userName,
          userEmail: user.email,
        });
        console.log("User created: ", response);
      } catch (error) {
        console.log("Error : ", error);
      }
    };
    signup();
    navigate("/");

    // Reset the form fields after submission (if needed)
    setUserRole("");
    setUserName("");
  };

  const userRoles = ["Buyer", "Seller"];

  return (
    <div className="App-header">
      <Container sx={{ marginTop: 4 }}>
        <Typography variant="h4">Onboarding Page</Typography>
        <form
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <div>
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
              <InputLabel id="user-role-label">User Role</InputLabel>
              <Select
                labelId="user-role-label"
                value={userRole}
                onChange={handleUserRoleChange}
                label="User Role"
                required
              >
                {userRoles.map((role, index) => (
                  <MenuItem key={index} value={role} disabled={role !== 'Buyer'}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div>
            <TextField
              label="User Name"
              variant="outlined"
              type="text"
              value={userName}
              onChange={handleUserNameChange}
              required
            />
          </div>
          <Button variant="contained" type="submit">
            Submit
          </Button>
        </form>
      </Container>
    </div>
  );
};

export default Onboarding;
