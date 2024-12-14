import React from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const RegistrationPendingPage = () => {
  const { userId } = useParams();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-300 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg text-center">
        <h1 className="text-4xl font-extrabold text-red-600 mb-6">
          Approval Pending
        </h1>
        <div className="flex flex-col items-center justify-center mb-4">
                <QRCodeSVG value={userId} size={150} />
                <span>User ID: {userId}</span>
              </div>
              
        <p className="text-lg text-gray-700 mb-4">
          Your registration as a Teacher is under review.
        </p>
        {/* <p className="text-md text-gray-600">
          Please wait for Admin approval. You will be notified once the process
          is complete.
        </p> */}
        {/* <div className="mt-8">
        <button
          className="px-6 py-3 text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300 transition"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div> */}
      </div>
    </div>
  );
};

export default RegistrationPendingPage;
