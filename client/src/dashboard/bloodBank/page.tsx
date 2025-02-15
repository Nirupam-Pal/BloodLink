import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { toast } from "react-toastify";
import { Spinner } from "@/components/ui/spinner"; // Assuming you have a Spinner component

// Helper function to decode JWT token
function decodeToken(token: string) {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload));
}

// Blood types list
const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const BloodBankDashboard: React.FC = () => {
  const [bloodQuantities, setBloodQuantities] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [bloodBankName, setBloodBankName] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false); // Track submission status
  const [isLoading, setIsLoading] = useState<boolean>(false); // Track loading status
  const navigate = useNavigate(); // For navigation

  // Verify token and user type on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    if (!token || userType !== "bloodbank") {
      toast.error("Access denied. Only blood banks are allowed to access this page.");
      navigate("/login"); // Redirect to login page if userType is not "bloodbank"
      return;
    }

    try {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.name) {
        setBloodBankName(decodedToken.name);
      } else {
        setError("Invalid token data.");
        navigate("/login"); // Redirect if token is invalid
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("Invalid token format.");
      navigate("/login"); // Redirect if token cannot be decoded
    }
  }, [navigate]);

  // Handle blood units submission
  const handleSubmitBloodUnits = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No token found. Please log in.");
      return;
    }

    const data = {
      token,
      A_positive: bloodQuantities["A+"] || 0,
      A_negative: bloodQuantities["A-"] || 0,
      B_positive: bloodQuantities["B+"] || 0,
      B_negative: bloodQuantities["B-"] || 0,
      O_positive: bloodQuantities["O+"] || 0,
      O_negative: bloodQuantities["O-"] || 0,
      AB_positive: bloodQuantities["AB+"] || 0,
      AB_negative: bloodQuantities["AB-"] || 0,
    };

    setIsLoading(true); // Show loading spinner

    try {
      const response = await axios.post("http://localhost:3000/bloodbank/add-bloods", data, {
        headers: {
          token,
        },
      });

      console.log("Server Response:", response.data);
      toast.success("Blood quantities updated successfully!");

      // Set hasSubmitted to true to indicate that the submission is complete
      setHasSubmitted(true);

      // Navigate to the home page immediately and refresh
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Error submitting blood units:", error);
      toast.error("Failed to update blood units. Please try again later.");
    } finally {
      setIsLoading(false); // Hide loading spinner once the process is done
    }
  };

  return (
    <div className="container mx-auto p-4">
      {error && <p className="text-red-500">{error}</p>}
      {bloodBankName && <h1 className="text-2xl font-bold mb-4">Welcome, {bloodBankName}</h1>}

      <h2 className="text-xl font-semibold mb-2">Update Blood Units</h2>
      <ul className="space-y-2">
        {bloodTypes.map((type) => (
          <li key={type}>
            <Card className="flex justify-between items-center p-2 border rounded shadow hover:shadow-lg">
              <div className="flex items-center">
                <Droplet className="h-5 w-5 text-red-600 mr-2" />
                <span>{type}</span>
              </div>
              <input
                title="number"
                type="number"
                value={bloodQuantities[type] || 0}
                onChange={(e) =>
                  setBloodQuantities({ ...bloodQuantities, [type]: Number(e.target.value) })
                }
                className="border rounded p-1 w-20"
              />
            </Card>
          </li>
        ))}
      </ul>

      <Button
        className="mt-4 bg-red-600 hover:bg-red-700"
        onClick={handleSubmitBloodUnits}
        disabled={hasSubmitted || isLoading} // Disable button if already submitted or in loading state
      >
        {isLoading ? (
          <Spinner size="sm" /> // Show a spinner when loading
        ) : (
          "Submit Blood Units"
        )}
      </Button>
    </div>
  );
};

export default BloodBankDashboard;
