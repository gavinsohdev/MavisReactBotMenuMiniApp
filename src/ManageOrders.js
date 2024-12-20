import React, { useState } from "react";
import MonetizationOnTwoToneIcon from '@mui/icons-material/MonetizationOnTwoTone';

const ManageOrders = ({
  adminData,
  handleUpdateOrder,
  handleCancelOrder,
  data,
}) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date_ordered", // Default sorting by date ordered
    direction: "desc", // Default descending order
  });

  // Function to sort the data based on the sortConfig state
  const sortedData = [...data].sort((a, b) => {
    const { key, direction } = sortConfig;
    const orderA = key === "status" ? a.order.status : a.order[key];
    const orderB = key === "status" ? b.order.status : b.order[key];

    if (key === "date_ordered") {
      const dateA = new Date(orderA);
      const dateB = new Date(orderB);
      return direction === "asc" ? dateA - dateB : dateB - dateA;
    }

    if (key === "user") {
      const userA = a.user ? `${a.user.first_name} ${a.user.last_name}` : "";
      const userB = b.user ? `${b.user.first_name} ${b.user.last_name}` : "";
      return direction === "asc"
        ? userA.localeCompare(userB)
        : userB.localeCompare(userA);
    }

    if (key === "items") {
      const itemCountA = a.order.items.length;
      const itemCountB = b.order.items.length;
      return direction === "asc"
        ? itemCountA - itemCountB
        : itemCountB - itemCountA;
    }

    if (key === "status") {
      return direction === "asc"
        ? orderA.localeCompare(orderB)
        : orderB.localeCompare(orderA);
    }

    return 0;
  });

  // Sorting handler function
  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({
        key,
        direction: "asc",
      });
    }
  };

  const openOrderModal = (orderWithUser) => {
    setSelectedOrder(orderWithUser);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
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

  return (
    <div className="m-0 p-0">
      {data?.length === 0 ? (
        <p className="text-gray-600">No orders available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse table-auto">
            <thead>
              <tr className="bg-red-500">
                <th
                  className="border-b border-gray-300 p-1 text-xs text-left cursor-pointer text-white"
                  onClick={() => handleSort("status")}
                >
                  Status{" "}
                  {sortConfig.key === "status" && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th
                  className="border-b border-gray-300 p-1 text-xs text-left cursor-pointer text-white"
                  onClick={() => handleSort("date_ordered")}
                >
                  Date Ordered{" "}
                  {sortConfig.key === "date_ordered" && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th
                  className="border-b border-gray-300 p-1 text-xs text-left cursor-pointer text-white"
                  onClick={() => handleSort("user")}
                >
                  User{" "}
                  {sortConfig.key === "user" && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th
                  className="border-b border-gray-300 p-1 text-xs text-left cursor-pointer text-white"
                  onClick={() => handleSort("items")}
                >
                  Items{" "}
                  {sortConfig.key === "items" && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData?.map((orderWithUser, index) => {
                const { order, user } = orderWithUser;
                return (
                  <tr
                    key={index}
                    onClick={() => openOrderModal(orderWithUser)}
                    className={`cursor-pointer ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100`}
                  >
                    <td className="border-b border-gray-300 p-1 text-center text-xs">
                      {renderStatus(order.status)}
                    </td>
                    <td className="border-b border-gray-300 p-1 text-xs">
                      {new Date(order.date_ordered)
                        .toLocaleString()
                        .replace(",", "")}
                    </td>
                    <td className="border-b border-gray-300 p-1 text-xs">
                      {user
                        ? `${user.first_name} ${user.last_name}`
                        : "User not found"}
                    </td>
                    <td className="border-b border-gray-300 p-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="border-t border-gray-200 pb-2 first:border-t-0 text-xs"
                        >
                          {item.name} x{item.quantity}
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
  
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg shadow-lg w-4/5 md:w-1/2 overflow-y-auto relative flex flex-col max-h-[90%]"
            style={{ maxHeight: "90vh" }}
          >
            <button
              onClick={closeOrderModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold"
              aria-label="Close Modal"
            >
              &times;
            </button>
            <div className="p-6 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-center">
                Order Details
              </h2>
  
              {/* User Details */}
              <div className="flex items-center mb-4">
                {selectedOrder.user?.photo_url && (
                  <img
                    src={selectedOrder.user.photo_url}
                    alt={`${selectedOrder.user.first_name}'s avatar`}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                )}
                <p className="text-gray-700 text-xs">
                  <strong>User:</strong>{" "}
                  {selectedOrder.user
                    ? `${selectedOrder.user.first_name} ${selectedOrder.user.last_name}`
                    : "User details not found"}
                </p>
              </div>
  
              {/* Order Information */}
              <p className="mb-2 text-xs">
                <strong>Order ID:</strong> {selectedOrder.order.id}
              </p>
              <div className="text-xs">
                <strong>Status:</strong>{" "}
                {renderStatus(selectedOrder.order.status)}
              </div>
              <p className="mb-4 text-xs">
                <strong>Date Ordered:</strong>{" "}
                {new Date(selectedOrder.order.date_ordered).toLocaleString()}
              </p>
  
              {/* Items */}
              <div
                className={`${
                  selectedOrder.order.items.length > 3
                    ? "h-48 overflow-y-auto"
                    : "h-auto"
                } border border-gray-200 rounded-lg p-4 flex-grow`}
              >
                <ul className="space-y-4">
                  {selectedOrder.order.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center border-t border-gray-200 pb-2 first:border-t-0 text-xs"
                    >
                      {item.photo_url && (
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg mr-4"
                        />
                      )}
                      <div>
                        <p>
                          <strong>Item:</strong> {item.name}
                        </p>
                        <p>
                          <strong>Quantity Available:</strong> {item.quantity}
                        </p>
                        <p>
                          <strong>Price:</strong> {item.price} <MonetizationOnTwoToneIcon />
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
  
              <h3 className="font-semibold text-sm mt-4">
                Total Price: {selectedOrder.order.total_price} <MonetizationOnTwoToneIcon />
              </h3>
  
              {/* Conditionally Render Confirm and Cancel Buttons */}
              {selectedOrder.order.status === "Pending" && (
                <>
                  {/* Confirm Button */}
                  <button
                    onClick={async () => {
                      await handleUpdateOrder(
                        selectedOrder.order.id,
                        adminData
                      );
                      closeOrderModal(); // Close the modal after updating the order
                    }}
                    className="mt-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-md w-full text-center font-semibold"
                  >
                    Confirm
                  </button>
  
                  {/* Cancel Button */}
                  <button
                      onClick={async () => {
                        // Confirmation popup before proceeding with delete
                        const confirmCancel = window.confirm(
                          "Are you sure you want to cancel this order? The coins associated with this order will be refunded to the user"
                        );
                        if (confirmCancel) {
                          await handleCancelOrder(
                            selectedOrder.order.id,
                            selectedOrder.order.total_price,
                            adminData
                          ); // Call handleCancelOrder with the order ID
                          closeOrderModal(); // Close the modal after canceling the order
                        }
                      }}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white py-3 rounded-md w-full text-center font-semibold"
                  >
                    Cancel
                  </button>
                </>
              )}
  
              {/* Completed Order Info */}
              {!(selectedOrder.order.status === "Pending") &&
                selectedOrder.order.date_completed && (
                  <p className="mt-4 text-xs text-gray-600">
                    Completed by{" "}
                    <strong>
                      {selectedOrder.order.date_completed.completed_by}
                    </strong>{" "}
                    on{" "}
                    <strong>
                      {new Date(
                        selectedOrder.order.date_completed.date
                      ).toLocaleString()}
                    </strong>
                  </p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );  
};

export default ManageOrders;
