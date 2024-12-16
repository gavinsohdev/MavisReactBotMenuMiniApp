import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "./Toast";
import axios from "axios";

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
    <div className="flex space-x-2">
      <div className="w-6 h-6 bg-[#e22028] animate-bounce delay-100"></div>
      <div className="w-6 h-6 bg-[#e22028] animate-bounce delay-200"></div>
      <div className="w-6 h-6 bg-[#e22028] animate-bounce delay-300"></div>
    </div>
  </div>
);

// Fetch rewards data from API
const getAllRewards = async () => {
  try {
    const token = localStorage.getItem("token");
    const {
      data: { status = false, dataObj = [] },
    } = await axios.post(
      "/api/get-all-rewards", // POST data (body of the request)
      {}, // You can pass the empty object or any data you need to send in the body here
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (status) {
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
    const token = localStorage.getItem("token");
    const {
      data: { coin: coin },
    } = await axios.post(
      "/api/get-coins",
      { id },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

const renderStatus = (status) => {
  if (status === "Pending") {
    return <span>Pending 🔴</span>;
  } else if (status === "Completed") {
    return <span>Completed 🟢</span>;
  } else if (status === "Canceled") {
    return <span>Canceled ⚪</span>;
  }
  return status;
};

const CartModal = ({ userId, cartData, onClose, onDeleteItem, onCheckout }) => {
  const [view, setView] = useState("cart"); // Track the current view

  // Check if cartData exists and contains items
  const hasItems = cartData && cartData.items && cartData.items.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[90%]">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {view === "cart" ? "Your Cart 🛒" : "Order Summary 🧾"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            ✖️
          </button>
        </div>

        {/* Cart View */}
        {view === "cart" && (
          <>
            <div className="max-h-[400px] overflow-y-auto space-y-4">
              {hasItems ? (
                cartData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm"
                  >
                    {/* Item Details */}
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg border border-gray-300"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Price:{" "}
                          <span className="font-medium">{item.price} 🪙</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity:{" "}
                          <span className="font-medium">{item.quantity}</span>
                        </p>
                        {/* Branches Display */}
                        {item.selectedBranches &&
                          item.selectedBranches.length > 0 && (
                            <div>
                              <span className="text-gray-600 text-sm">
                                {item.selectedBranches.length > 1
                                  ? "Branches: "
                                  : "Branch: "}
                              </span>
                              <span className="text-gray-800 text-xs font-medium">
                                {item.selectedBranches
                                  .map((branch) => branch.name)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onDeleteItem(userId, item.id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">
                  Your cart is empty 🛒
                </p>
              )}
            </div>

            {/* Footer */}
            {hasItems && (
              <div className="mt-6 flex justify-between items-center border-t pt-4">
                <p className="text-lg font-bold text-gray-800">
                  Total:{" "}
                  <span className="text-green-600">
                    {cartData.total_price} 🪙
                  </span>
                </p>
                <button
                  onClick={() => setView("orderSummary")}
                  className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all"
                >
                  Checkout
                </button>
              </div>
            )}
          </>
        )}

        {/* Order Summary View */}
        {view === "orderSummary" && hasItems && (
          <>
            <div className="max-h-[400px] overflow-y-auto space-y-4">
              {cartData.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-sm"
                >
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-gray-500">x{item.quantity}</p>
                  <p className="text-gray-500">{item.price} 🪙</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4 space-y-4">
              <p className="text-lg font-bold text-gray-800">
                Total:{" "}
                <span className="text-green-600">
                  {cartData.total_price} 🪙
                </span>
              </p>
              <button
                onClick={() => onCheckout(userId)}
                className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
              >
                Submit Order
              </button>
              <button
                onClick={() => setView("cart")}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-all"
              >
                Back to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const OrdersModal = ({ orders, onClose }) => {
  // Ensure orders is an array, default to an empty array if not
  const validOrders = Array.isArray(orders) ? orders : [];

  // Sort orders by date_ordered, newest first
  const sortedOrders = [...validOrders].sort(
    (a, b) => new Date(b.date_ordered) - new Date(a.date_ordered)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[90%] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Your Orders 📃</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            ✖️
          </button>
        </div>

        {sortedOrders.length === 0 ? (
          <p className="text-center text-gray-500">You have no orders yet 🛒</p>
        ) : (
          sortedOrders.map((order, index) => (
            <div key={index} className="mb-6">
              <p className="text-lg font-semibold text-gray-800">
                Order Date: {new Date(order.date_ordered).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Status: {renderStatus(order.status)}
              </p>
              <div className="mt-4 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg border border-gray-300"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Price: {item.price} 🪙
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-gray-500 border-t border-gray-200">
                  Total Coins: {order.total_price} 🪙
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Shop = () => {
  const toast = useToast();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id"); // Accessing the 'id' query parameter

  const [rewards, setRewards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [coins, setCoins] = useState(0); // User's coins state
  const [loading, setLoading] = useState(true); // Loading state
  const itemsPerPage = 2; // Number of items per page

  const [showCart, setShowCart] = useState(false);
  const [cartData, setCartData] = useState({
    items: [],
    total_price: 0,
  });

  const [orders, setOrders] = useState([]); // State for storing user orders
  const [showOrders, setShowOrders] = useState(false); // Modal visibility state

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      setLoading(true); // Show loader before the request is sent
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setLoading(false); // Hide loader after the response is received
        return response;
      },
      (error) => {
        setLoading(false); // Hide loader even if an error occurs
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

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

    const fetchData = async () => {
      await Promise.all([fetchRewards(), fetchUserCoins()]);
      setLoading(false); // Data fetched, set loading to false
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async (id, reward) => {
    try {
      const response = await addToCart(id, reward);
      toast("success", "Successfully added to cart!");
    } catch (error) {
      console.error("Error refreshing coins:", error);
    }
  };

  const addToCart = async (id, reward) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/add-to-cart",
        { id, reward },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
  };

  const handleGetAllCart = async (id) => {
    try {
      const data = await getAllCart(id);
      setCartData(data);
      setShowCart(true);
    } catch (error) {
      console.error("Error refreshing coins:", error);
    }
  };

  const getAllCart = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/get-all-cart",
        { id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
  };

  const handleOnDeleteItem = async (id, itemId) => {
    try {
      const response = await onDeleteItem(id, itemId);
      toast("success", "Successfully removed one item!");
      // Refresh cart data after deletion
      const updatedCartData = await getAllCart(id);
      setCartData(updatedCartData);
    } catch (error) {
      console.error("Error refreshing coins:", error);
    }
  };

  const onDeleteItem = async (id, itemId) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/delete-from-cart",
        { id, itemId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
  };

  const handlePlaceOrder = async (id) => {
    try {
      const response = await placeOrder(id);
      console.log("handlePlaceOrder response:", response);

      if (response === "INSUFFICIENT_COINS") {
        // Case for insufficient coins
        toast("error", "Insufficient Coins! Please add more coins to proceed.");
      } else if (response === "REWARD_NOT_AVAILABLE_IN_ONE_OR_MORE_BRANCHES") {
        toast(
          "error",
          "One or more rewards not available at the branch(es) that you go to!"
        );
      } else if (response === null) {
        // This case is for other failure scenarios (e.g., unexpected errors)
        toast("error", "Order placement failed. Please try again later.");
      } else if (typeof response === "number") {
        // Success case: the response is the new coin balance
        setCoins(response);
        setShowCart(false);
        toast(
          "success",
          `Order placed successfully! Your new balance is ${response} coins.`
        );
      } else {
        // Handle unexpected response from placeOrder (just in case)
        setShowCart(false);
        toast(
          "error",
          "An unexpected error occurred while placing the order. Please try again."
        );
      }
    } catch (error) {
      console.error("Error in handlePlaceOrder:", error);
      toast("error", "An error occurred while placing the order.");
    }
  };

  const placeOrder = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, message = "", newCoinBalance },
      } = await axios.post(
        "/api/place-order",
        { id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (status && message === "ORDER SUCCESSFUL") {
        // Return the new coin balance if the order is successful
        return newCoinBalance;
      } else if (!status && message === "INSUFFICIENT_COINS") {
        // Return 'INSUFFICIENT_COINS' specifically when coins are insufficient
        return "INSUFFICIENT_COINS";
      } else if (
        !status &&
        message === "REWARD_NOT_AVAILABLE_IN_ONE_OR_MORE_BRANCHES"
      ) {
        return "REWARD_NOT_AVAILABLE_IN_ONE_OR_MORE_BRANCHES";
      } else {
        // Return null for other failure scenarios
        return null;
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      // Return null to indicate failure when there is an exception in placeOrder
      return null;
    }
  };

  const handleGetAllOrders = async (id) => {
    try {
      const data = await getAllOrders(id);
      setOrders(data);
      setShowOrders(true);
    } catch (error) {
      console.error("Error refreshing coins:", error);
    }
  };

  const getAllOrders = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/get-all-orders",
        { id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
  };

  // Calculate the start and end index of items to display for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRewards = rewards.slice(startIndex, endIndex); // Rewards for the current page

  // Calculate the total number of pages
  const totalPages = Math.ceil(rewards.length / itemsPerPage);

  return (
    <>
      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}
  
      {/* Navbar */}
      <div className="w-full max-w-4xl flex justify-between items-center py-4 px-6 bg-[#333333] shadow-md">
        <nav className="flex space-x-8">
          <button
            onClick={() => handleGetAllOrders(id)}
            className="text-white text-lg font-semibold hover:text-green-400 transition-all duration-300"
          >
            Orders 📃
          </button>
          <button
            onClick={() => handleGetAllCart(id)}
            className="text-white text-lg font-semibold hover:text-green-400 transition-all duration-300"
          >
            Cart 🛒
          </button>
        </nav>
        <div className="text-white font-semibold">
          <span>Coins: {coins} 🪙</span>
        </div>
      </div>
  
      {/* Cart Modal */}
      {showCart && (
        <CartModal
          userId={id}
          cartData={cartData}
          onClose={() => setShowCart(false)}
          onDeleteItem={handleOnDeleteItem}
          onCheckout={handlePlaceOrder}
        />
      )}
  
      {/* Orders Modal */}
      {showOrders && (
        <OrdersModal orders={orders} onClose={() => setShowOrders(false)} />
      )}
  
      {/* Main Content Area */}
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4 relative">
        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-4 right-4 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
        >
          🔙
        </Link>
  
        {/* Centered Title */}
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight text-center mb-8">
          Rewards ⭐
        </h1>
  
        {/* Rewards List */}
        {rewards.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No rewards available at the moment. Please check back later! 🙁</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <img
                  src={reward.photo_url}
                  alt={`Reward ${reward.id}`}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-xl text-center font-semibold text-gray-800 mb-2">
                  {reward.name}
                </h2>
                <p className="text-gray-600 text-center text-sm mb-2">
                  Price:{" "}
                  <span className="font-semibold text-gray-800">
                    {reward.price}
                  </span>{" "}
                  🪙
                </p>
                <p className="text-gray-600 text-center text-sm mb-2">
                  Quantity:{" "}
                  <span className="font-semibold text-gray-800">
                    {reward.quantity}
                  </span>
                </p>
  
                {/* Conditionally render selectedBranches */}
                {reward.selectedBranches && reward.selectedBranches.length > 0 && (
                  <div className="text-center mb-4">
                    <span className="text-gray-600 text-sm mb-2 block">
                      {reward.selectedBranches.length > 1
                        ? "Branches:"
                        : "Branch:"}
                    </span>
                    <div className="flex flex-wrap justify-center space-x-2 mt-2">
                      {reward.selectedBranches.map((branch) => (
                        <span
                          key={branch.id}
                          className="px-3 py-1 text-xs font-semibold text-white bg-amber-500 rounded-full truncate mb-2"
                        >
                          {branch.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
  
                <button
                  onClick={async () => handleAddToCart(id, reward)}
                  className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-all duration-300"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
  
        {/* Pagination Controls */}
        {totalPages > 1 && rewards.length > 0 && (
          <div className="mt-8 flex justify-center items-center space-x-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex justify-center items-center w-28 h-12 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              Previous
            </button>
            <p className="text-sm text-center">
              Page <br />
              {currentPage} of {totalPages}
            </p>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex justify-center items-center w-28 h-12 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );  
};

export default Shop;
