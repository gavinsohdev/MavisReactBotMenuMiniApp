import React from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import mavisLogo from './images/mavis_logo_red.png'
import bannerImage from './/images/branch-banner.jpg';

const RegistrationPendingPage = () => {
  const { userId } = useParams();
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6 relative">
      {/* Background Image */}
      <div
        className="absolute top-0 left-0 w-full h-[50vh] bg-cover bg-center z-10 opacity-65"
        style={{
          backgroundImage: `url(${bannerImage})`, // Access image from the public folder
        }}
      ></div>
      <img
        src={mavisLogo}
        alt="Hero Banner"
        className="w-full relative z-20 mt-6"
      />
      <div className="bg-white shadow-md rounded-xl p-6 max-w-md mx-auto text-center relative z-20">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Approval Pending
        </h1>
        <div className="flex flex-col items-center justify-center mb-6 space-y-2">
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <QRCodeSVG value={userId} size={150} className="rounded-md" />
          </div>
          <span className="text-sm font-medium text-gray-600">
            User ID: <span className="font-semibold">{userId}</span>
          </span>
        </div>
        <p className="text-base text-gray-600 leading-relaxed mb-4">
          Your registration as a <span className="font-semibold">Teacher</span>{" "}
          is under review. Please provide the QR Code or User ID to the Admin
          for approval.
        </p>
      </div>
    </div>
  );
};

export default RegistrationPendingPage;
