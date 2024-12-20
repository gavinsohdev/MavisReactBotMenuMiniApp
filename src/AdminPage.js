import React, { useEffect, useState } from "react";
import { useToast } from "./Toast";
import RewardsList from "./RewardsList";
import ManageOrders from "./ManageOrders";
import ApproveUser from "./ApproveUser";
import Modal from "./Modal"; // Import the Modal component
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useShowPopup } from "@vkruglikov/react-telegram-web-app";
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';

const AdminPage = ({ adminData }) => {
  const toast = useToast();
  const showPopup = useShowPopup();
  const [branches, setBranches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [newReward, setNewReward] = useState({
    id: "",
    name: "",
    photo_url: "",
    price: "",
    quantity: "",
    date_added: "",
    selectedBranches: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [activeTab, setActiveTab] = useState("rewards"); // State to track the active tab

  const [ordersWithUsers, setOrdersWithUsers] = useState([]);
  const [lastVisibleDocId, setLastVisibleDocId] = useState(null); // Tracks the last document ID
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Tracks if more pages are available

  useEffect(() => {
    // Fetch all rewards when the component mounts
    const fetchData = async () => {
      const rewardsData = await getAllRewards();
      setRewards(rewardsData);
      const branchesData = await getAllBranches();
      setBranches(branchesData);
    };
    fetchData();
    fetchOrdersWithUsers();
  }, []);

  // Handle input change for new or updating reward
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReward((prev) => ({
      ...prev,
      [name]: name === "price" || name === "quantity" ? Number(value) : value,
    }));
  };

  const handleBranchSelection = (branch) => {
    setNewReward((prev) => {
      if (prev.selectedBranches.some((selected) => selected.id === branch.id)) {
        return prev; // Do nothing if branch already selected
      }
      return {
        ...prev,
        selectedBranches: [...prev.selectedBranches, branch],
      };
    });
    setShowDropdown(false); // Close dropdown after selection
  };

  const handleRemoveBranch = (branchId) => {
    setNewReward((prev) => ({
      ...prev,
      selectedBranches: prev.selectedBranches.filter(
        (branch) => branch.id !== branchId
      ),
    }));
  };

  const getAllBranches = async () => {
    try {
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/get-all-branches", // URL of the API
        {}, // Request body (empty if no additional data is needed)
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (status) {
        console.log("dataObj: " + JSON.stringify(dataObj));
        return dataObj;
      } else {
        console.warn("Failed to fetch branches");
        return [];
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  };

  // Handle adding a new reward
  const handleAddReward = async () => {
    const { name, photo_url, price, quantity, selectedBranches } = newReward;

    if (
      !name ||
      !photo_url ||
      price <= 0 ||
      quantity <= 0 ||
      selectedBranches.length === 0
    ) {
      showPopup({ message: "Please fill all fields with valid values." }).then(
        (buttonId) => console.log(buttonId)
      );
      return;
    }

    const rewardWithId = {
      ...newReward,
      id: uuidv4(),
      date_added: new Date().toISOString(),
      // Send only the branch IDs in the payload
      selectedBranches: selectedBranches.map((branch) => ({
        id: branch.id,
        name: branch.name,
      })),
    };

    try {
      await uploadReward(rewardWithId);
      setNewReward({
        id: "",
        name: "",
        photo_url: "",
        price: "",
        quantity: "",
        date_added: "",
        selectedBranches: [],
      });
      const rewardsData = await getAllRewards();
      setRewards(rewardsData);
      setIsModalOpen(false);
      toast(
        "success",
        "Reward added successfully!"
      );      
    } catch (error) {
      console.error("Error adding reward:", error);
      toast(
        "error",
        "Failed to add reward!"
      );   
    }
  };

  const getAllRewards = async () => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/get-all-rewards", // URL of the API
        {}, // Request body, can be replaced with any required data (empty if no data is needed)
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (status) {
        console.log("dataObj " + JSON.stringify(dataObj));
        return dataObj;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  };

  const uploadReward = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/upload-reward",
        { payload },
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

  const updateReward = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/update-reward",
        { payload },
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

  const deleteReward = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/delete-reward",
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

  const handleUpdateReward = async (updatedReward) => {
    console.log('updatedReward: ' + JSON.stringify(updatedReward))
    try {
      await updateReward({
        ...updatedReward,
        date_added: new Date().toISOString(),
      });
      const refreshedRewards = await getAllRewards();
      setRewards(refreshedRewards);
    } catch (error) {
      console.error("Error updating reward:", error);
    }
  };

  const handleDeleteReward = async (id) => {
    try {
      const isDeleted = await deleteReward(id); // Call your deleteReward function
      if (isDeleted) {
        const refreshedRewards = await getAllRewards();
        setRewards(refreshedRewards); // Refresh the list
      } else {
        console.log("Failed to delete the reward.");
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  };

  // Fetch orders with user details
  // const fetchOrdersWithUsers = async () => {
  //   try {
  //     const data = await getAllOrdersWithUsers(); // Call the API function
  //     if (data) {
  //       setOrdersWithUsers(data);
  //     } else {
  //       console.error("No orders with users found");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching orders with users:", error);
  //   }
  // };

  // const getAllOrdersWithUsers = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const {
  //       data: { status = false, dataObj = {} },
  //     } = await axios.get("/api/get-all-orders-with-users", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     return status ? dataObj : null;
  //   } catch (error) {
  //     console.error("Error submitting data:", error);
  //   }
  // };

  const fetchOrdersWithUsers = async (isNextPage = false) => {
    if (loading) return; // Prevent multiple calls
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const params = {
        limit: 5,
        startAfterDocId: isNextPage ? lastVisibleDocId : null, // Pass last doc ID for pagination
      };

      const {
        data: { status, dataObj },
      } = await axios.get("/api/get-all-orders-with-users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      if (status) {
        const { orders, lastVisible } = dataObj;
        setOrdersWithUsers((prev) =>
          isNextPage ? [...prev, ...orders] : orders
        ); // Append or replace
        setLastVisibleDocId(lastVisible);
        setHasMore(Boolean(lastVisible)); // Update hasMore based on availability
      } else {
        console.error("No orders with users found");
      }
    } catch (error) {
      console.error("Error fetching orders with users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (orderId, adminData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/update-order",
        { orderId, adminData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Return the actual data from the response
    } catch (error) {
      console.error("Error submitting data:", error);
      return {
        status: false,
        message:
          error.response?.data?.message || "An unexpected error occurred.",
      };
    }
  };

  const handleUpdateOrder = async (orderId, adminData) => {
    try {
      const dataResponse = await updateOrder(orderId, adminData);

      if (dataResponse?.status) {
        // Update the local state for the selected order
        setOrdersWithUsers((prevOrders) =>
          prevOrders.map((orderWithUser) =>
            orderWithUser.order.id === orderId
              ? {
                  ...orderWithUser,
                  order: {
                    ...orderWithUser.order,
                    status: "Completed",
                    date_completed: {
                      date: new Date().toISOString(),
                      completed_by: `${adminData.first_name} ${adminData.last_name}`,
                    },
                  },
                }
              : orderWithUser
          )
        );
        toast(
          "success",
          dataResponse.message || "Order successfully confirmed!"
        );
      } else {
        // Handle error cases with detailed messages
        const errorMessage =
          dataResponse?.message || "Something went wrong confirming the order!";
        toast("error", errorMessage);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast(
        "error",
        error.response?.data?.message || "An unexpected error occurred."
      );
    }
  };

  const cancelOrder = async (orderId, totalPrice, adminData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/cancel-order",
        { orderId, totalPrice, adminData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling order:", error);
      return {
        status: false,
        message:
          error.response?.data?.message || "An unexpected error occurred.",
      };
    }
  };

  const handleCancelOrder = async (orderId, totalPrice, adminData) => {
    try {
      const dataResponse = await cancelOrder(orderId, totalPrice, adminData);

      if (dataResponse?.status) {
        // Update local state to reflect the cancellation
        setOrdersWithUsers((prevOrders) =>
          prevOrders.map((orderWithUser) =>
            orderWithUser.order.id === orderId
              ? {
                  ...orderWithUser,
                  order: {
                    ...orderWithUser.order,
                    status: "Canceled",
                    date_completed: {
                      date: null,
                      completed_by: null,
                    },
                  },
                }
              : orderWithUser
          )
        );
        toast(
          "success",
          dataResponse.message || "Order successfully canceled!"
        );
      } else {
        const errorMessage =
          dataResponse?.message || "Something went wrong canceling the order!";
        toast("error", errorMessage);
      }
    } catch (error) {
      console.error("Error canceling order:", error);
      toast(
        "error",
        error.response?.data?.message || "An unexpected error occurred."
      );
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 bg-gray-50 p-6 rounded-lg shadow-md max-w-md mx-auto w-full">
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            activeTab === "rewards"
              ? "bg-gray-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("rewards")}
        >
          Manage Rewards
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            activeTab === "orders"
              ? "bg-gray-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Manage Orders
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            activeTab === "approve"
              ? "bg-gray-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("approve")}
        >
          Approve Teacher Registration
        </button>
      </div>
      {/* Content for each Tab */}
      {activeTab === "rewards" && (
        <div className="space-y-4">
          <RewardsList
            rewards={rewards}
            branches={branches}
            handleUpdateReward={handleUpdateReward}
            handleDeleteReward={handleDeleteReward}
          />
        </div>
      )}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <ManageOrders
            adminData={adminData}
            data={ordersWithUsers}
            handleUpdateOrder={handleUpdateOrder}
            handleCancelOrder={handleCancelOrder}
          />
          {hasMore && !loading && (
            <button
              className="w-full bg-gray-500 text-white py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-500 transition duration-200"
              onClick={() => fetchOrdersWithUsers(true)}
            >
              Load More
            </button>
          )}
          {loading && (
            <div className="flex space-x-2 items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-gray-500 animate-bounce delay-200"></div>
              <div className="w-3 h-3 bg-gray-500 animate-bounce delay-300"></div>
            </div>
          )}
        </div>
      )}
      {activeTab === "approve" && (
        <div className="w-full">
          <ApproveUser />
        </div>
      )}
      {/* Floating Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300"
      >
        <AddTwoToneIcon/>
      </button>
      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-4">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            <span className="text-red-600">Add New&nbsp;</span>
            Reward
          </h1>
        </header>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              name="name"
              value={newReward.name}
              onChange={handleInputChange}
              placeholder="Name"
              className="w-full px-4 py-2 border text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="photo_url"
              className="text-sm font-semibold text-gray-700"
            >
              Photo URL
            </label>
            <input
              type="text"
              name="photo_url"
              value={newReward.photo_url}
              onChange={handleInputChange}
              placeholder="Photo URL"
              className="w-full px-4 py-2 border text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="text-sm font-semibold text-gray-700"
            >
              Price
            </label>
            <input
              type="number"
              name="price"
              value={newReward.price}
              onChange={handleInputChange}
              placeholder="Price"
              className="w-full px-4 py-2 border text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="quantity"
              className="text-sm font-semibold text-gray-700"
            >
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={newReward.quantity}
              onChange={handleInputChange}
              placeholder="Quantity"
              className="w-full px-4 py-2 border text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        {/* Branch Selection */}
        <div className="mb-6 mt-4">
          <label
            htmlFor="branch"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Select Branches
          </label>
          <div className="relative">
            <select
              id="branch"
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedBranch = branches.find(
                  (branch) => branch.id === selectedId
                );
                if (selectedBranch) {
                  handleBranchSelection(selectedBranch);
                }
              }}
              className="block w-full appearance-none bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm focus:ring-green-500 focus:border-green-500 transition duration-150"
              defaultValue=""
            >
              <option value="" disabled>
                Select a branch
              </option>
              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  disabled={newReward.selectedBranches.some(
                    (item) => item.id === branch.id
                  )}
                >
                  {branch.name}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
              ▼
            </span>
          </div>

          {/* Display Selected Branches */}
          <div className="mt-4 space-y-2">
            {newReward.selectedBranches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition"
              >
                <span className="text-gray-800 text-sm">{branch.name}</span>
                <button
                  onClick={() => handleRemoveBranch(branch.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleAddReward}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-md font-semibold shadow-md hover:bg-green-600 transition duration-200"
          >
            Add
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;
