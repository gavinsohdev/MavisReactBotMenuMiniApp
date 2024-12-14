import React, { useState } from "react";
import { useToast } from "./Toast";
import axios from "axios";

const ApproveUser = () => {
  const [userId, setUserId] = useState(""); // State to hold input User ID
  const toast = useToast();

// Function to call the approve-user API
const handleApproveUser = async () => {
    try {
      if (!userId) {
        toast("error", "Please input a User ID!");
        return;
      }
  
      const token = localStorage.getItem("token"); // Retrieve token from local storage
      const response = await axios.post(
        "/api/approve-user",
        { userId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const { status, message } = response.data;
      if (status) {
        setUserId("")
        toast("success", "User approved successfully!");
      } else if (message === "User is already approved.") {
        toast("info", "User is already approved!");
      } else if (message === "User is a student.") {
        toast("info", "User is a student.");
      } else {
        toast("error", message || "User approval failed!");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast("error", "An error occurred while approving the user.");
    }
  };  

  // QR Code scanning function
  const handleScanQR = () => {
    const tg = window.Telegram.WebApp;
    tg.showScanQrPopup({}, (qrText) => {
      if (qrText) {
        setUserId(qrText); // Update userId with scanned text
        toast("success", "QR Code scanned successfully!");
        return true; // Close popup automatically
      }
      toast("error", "Failed to scan QR Code. Please try again.");
      return false; // Keep the popup open
    });
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-4 rounded-md">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Approve Teacher</h1>
      <div className="w-full max-w-md">
        {/* Input and Buttons */}
        <div className="flex w-full relative">
          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-[70%] px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleScanQR}
            className="px-4 py-2 bg-gray-200 border border-gray-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Scan QR Code"
          >
            Scan QR
          </button>
          <button
            onClick={handleApproveUser}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-r-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveUser;