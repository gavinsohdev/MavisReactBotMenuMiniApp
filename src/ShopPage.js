import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

// Fetch rewards data from API
const getAllRewards = async () => {
  try {
    const {
      data: { status = false, dataObj = [] },
    } = await axios.post("/api/get-all-rewards", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (status) {
      console.log("dataObj:", dataObj);
      return dataObj; // Returning the rewards data array
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }
};

// Fetch user's coin balance
const getUserCoins = async (id) => {
  try {
    const {
      data: { coin: coin },
    } = await axios.post(
      "/api/get-coins",
      { id },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!isNaN(coin)) {
      return coin;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error submitting data:", error);
    return null;
  }
};

const Shop = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id"); // Accessing the 'id' query parameter

  const [rewards, setRewards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [coins, setCoins] = useState(0); // User's coins state
  const itemsPerPage = 2; // Number of items per page

  // Fetch all rewards when the component mounts
  useEffect(() => {
    const fetchRewards = async () => {
      const rewardsData = await getAllRewards();
      // Sort rewards by date_added (newest to oldest) before setting the state
      const sortedRewards = rewardsData.sort(
        (a, b) => new Date(b.date_added) - new Date(a.date_added)
      );
      setRewards(sortedRewards); // Store the sorted rewards in state
    };

    const fetchUserCoins = async () => {
      const userId = id; // Replace with the actual user ID
      const userCoins = await getUserCoins(userId);
      setCoins(userCoins); // Set the user's coins in the state
    };

    fetchRewards();
    fetchUserCoins();
  }, []);

  const handleAddToCart = async (id, reward) => {
    try {
      const response = await addToCart(id, reward);
    } catch (error) {
      console.error("Error refreshing coins:", error);
    }
  };

  const addToCart = async (id, reward) => {
    try {
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/add-to-cart",
        { id, reward },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (status) {
        return dataObj;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }    
  }

  // Calculate the start and end index of items to display for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRewards = rewards.slice(startIndex, endIndex); // Rewards for the current page

  // Calculate the total number of pages
  const totalPages = Math.ceil(rewards.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
      {/* Navbar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <nav className="flex space-x-4">
          <Link
            to="/order"
            className="text-gray-800 font-semibold hover:text-green-600"
          >
            Orders
          </Link>
          <Link
            to="/cart"
            className="text-gray-800 font-semibold hover:text-green-600"
          >
            Cart
          </Link>
        </nav>
        <div className="text-gray-800 font-semibold">
          <span>Coins: {coins}</span>
        </div>
      </div>

      {/* Flex container to center the title */}
      <div className="flex items-center justify-center w-full max-w-4xl mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Rewards Catalogue</h1>
      </div>

      {/* Link Button */}
      <div className="flex justify-end w-full max-w-4xl mb-4">
        <Link
          to="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 border-2 border-green-300 hover:bg-green-300 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        >
          <div className="text-xl font-semibold">←</div>
        </Link>
      </div>

      {/* Rewards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginatedRewards.map((reward) => (
          <div key={reward.id} className="bg-white p-4 rounded-lg shadow-lg">
            <img
              src={reward.photo_url}
              alt={`Reward ${reward.id}`}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
            <h2 className="text-lg font-semibold text-gray-800">
              Name: {reward.name}
            </h2>
            <p className="text-gray-600">Price: ${reward.price}</p>
            <p className="text-gray-600">Quantity: {reward.quantity}</p>
            <button
              onClick={async () => handleAddToCart(id, reward)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex justify-center items-center w-24 h-10 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <p className="text-sm text-center">
            Page
            <br />
            {currentPage} of {totalPages}
          </p>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="flex justify-center items-center w-24 h-10 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
