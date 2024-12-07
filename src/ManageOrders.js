import React, { useState } from "react";

const ManageOrders = ({ data }) => {
  const [selectedOrder, setSelectedOrder] = useState(null); // State to store the currently selected order for the modal

  const openOrderModal = (orderWithUser) => {
    setSelectedOrder(orderWithUser); // Set the selected order for the modal
  };

  const closeOrderModal = () => {
    setSelectedOrder(null); // Clear the selected order
  };

  const handleConfirmOrder = () => {
    // Logic for confirming the order
    console.log("Order confirmed:", selectedOrder);
    closeOrderModal();
  };

  const renderStatus = (status) => {
    if (status === "Pending") {
      return <div className="text-center">Pending 🔴</div>;
    } else if (status === "Completed") {
      return <div className="text-center">Completed 🟢</div>;
    }
    return status; // Fallback for any other status
  };

  return (
    <div>
      {data?.length === 0 ? (
        <p>No orders available.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f1f1" }}>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                Status
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                Date Ordered
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                User
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  textAlign: "left",
                }}
              >
                Items
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.map((orderWithUser, index) => {
              const { order, user } = orderWithUser;
              return (
                <tr
                  key={index}
                  onClick={() => openOrderModal(orderWithUser)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                  }}
                >
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {renderStatus(order.status)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {new Date(order.date_ordered)
                      .toLocaleString()
                      .replace(",", "")}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {user
                      ? `${user.first_name} ${user.last_name}`
                      : "User not found"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {order.items.map((item, idx) => (
                      <div
                        className="border-t border-gray-200 pb-4 first:border-t-0"
                        key={idx}
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
      )}

      {/* Modal */}
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "80%",
              maxHeight: "90%",
              overflowY: "auto",
            }}
          >
            <h2>Order Details</h2>
            <p>
              <strong>Order ID:</strong> {selectedOrder.order.id}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {renderStatus(selectedOrder.order.status)}
            </p>
            <p>
              <strong>Date Ordered:</strong>{" "}
              {new Date(selectedOrder.order.date_ordered).toLocaleString()}
            </p>
            <p>
              <strong>User:</strong>{" "}
              {selectedOrder.user
                ? `${selectedOrder.user.first_name} ${selectedOrder.user.last_name}`
                : "User details not found"}
            </p>

            <h3>Items</h3>
            <ul>
              {selectedOrder.order.items.map((item, idx) => (
                <li key={idx}>
                  <p>
                    <strong>Item:</strong> {item.name}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {item.quantity}
                  </p>
                  <p>
                    <strong>Price:</strong> ${item.price}
                  </p>
                  <p>
                    <strong>Total:</strong> ${item.total_price}
                  </p>
                </li>
              ))}
            </ul>

            <h3>Total Price: ${selectedOrder.order.total_price}</h3>

            <button
              onClick={handleConfirmOrder}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
            <button
              onClick={closeOrderModal}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginLeft: "10px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
