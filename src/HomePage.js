import React, { useEffect, useState } from "react";
import AdminPage from "./AdminPage";
import { useToast } from "./Toast";
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import {
  useShowPopup,
  useHapticFeedback,
  MainButton,
  BackButton,
  useInitData,
} from "@vkruglikov/react-telegram-web-app";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import MonetizationOnTwoToneIcon from "@mui/icons-material/MonetizationOnTwoTone";
import GradeTwoToneIcon from "@mui/icons-material/GradeTwoTone";
import mavisLogo from './images/mavis_logo_red.png'
import bannerImage from './/images/branch-banner.jpg';

const App = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const showPopup = useShowPopup();
  const [impactOccurred] = useHapticFeedback();
  const [InitDataUnsafe] = useInitData();

  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [userDisplayData, setUserDisplayData] = useState({});
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [role, setRole] = useState("Student");
  const [roleType, setRoleType] = useState("Student");
  const [page, setPage] = useState(1);
  const [coin, setCoin] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [coinToSend, setCoinToSend] = useState("");
  const [targetUserId, setTargetUserId] = useState(""); // For the user ID input
  const [retrievedCoins, setRetrievedCoins] = useState(null); // To store fetched user coins
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      setIsLoading(true); // Show loader before the request is sent
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setIsLoading(false); // Hide loader after the response is received
        return response;
      },
      (error) => {
        setIsLoading(false); // Hide loader even if an error occurs
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.isVerticalSwipesEnabled = false;
    tg.setHeaderColor("#ee1c25");
    const { photo_url, first_name, last_name, id, username, language_code } =
      InitDataUnsafe?.user || {};
    const ExtractedInitDataUnsafe = {
      photo_url,
      first_name,
      last_name,
      id: String(id),
      username,
      language_code,
    };

    // Only update profile data if it hasn't been set yet
    if (!profileData.id) {
      setProfileData(ExtractedInitDataUnsafe);
    }

    const fetchData = async (id) => {
      try {
        const response = await isUserRegistered(id); // Wait for the result
        if (response) {
          const dataChanged = hasDataChanged(ExtractedInitDataUnsafe, response);
          dataChanged && updateUser({ data: dataChanged, id });
          setRoleType(response.role);

          if (
            response.registration_status !== "Approved" &&
            response.role === "Teacher"
          ) {
            navigate(`/pending/${id}`); // Redirect to Pending page if Teacher and not approved
          }

          if (response.role === "Student") {
            const coin = await getUserCoins(id);
            if (coin !== null) {
              setCoin(coin);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    if (profileData.id) {
      fetchData(profileData.id); // Only call fetchData if profileData.id is available
    }
  }, [InitDataUnsafe, profileData]); // Add profileData to the dependency array to track changes

  useEffect(() => {
    // Fetch branches when the component mounts
    const fetchData = async () => {
      const branchesData = await getAllBranches();
      setBranches(branchesData);
    };
    fetchData();
  }, []);

  const getPayload = () => ({
    id: String(InitDataUnsafe?.user?.id),
    first_name: InitDataUnsafe?.user?.first_name,
    last_name: InitDataUnsafe?.user?.last_name,
    username: InitDataUnsafe?.user?.username,
    language_code: InitDataUnsafe?.user?.language_code,
    photo_url: InitDataUnsafe?.user?.photo_url,
    role,
    registration_status: role === "Teacher" ? "Pending" : "Approved",
    selectedBranches: selectedBranches,
  });

  const getUser = async (id) => {
    try {
      const token = localStorage.getItem("token"); // Retrieve token from storage
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/get-user",
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

  const initializeApp = async (id) => {
    try {
      const {
        data: { status = false, dataObj = {}, token },
      } = await axios.post(
        "/api/initialize-app",
        { id },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (status) {
        if (token) {
          localStorage.setItem("token", token);
        } else {
          console.error("Error setting token:");
        }
        return dataObj;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const hasDataChanged = (newData, oldData) => {
    const newClone = { ...newData };
    const oldClone = { ...oldData };

    // Initialize an object to store changed fields
    const changedFields = {};

    // Remove the keys we want to ignore
    delete newClone.role;
    delete oldClone.role;
    delete newClone.registration_status;
    delete oldClone.registration_status;

    Object.keys(newClone).forEach((key) => {
      if (newClone[key] !== oldClone[key]) {
        changedFields[key] = String(newClone[key]);
      }
    });

    // Return null if no changes are found, otherwise return the changed fields
    return Object.keys(changedFields).length > 0 ? changedFields : null;
  };

  const isUserRegistered = async (id) => {
    try {
      const response = await initializeApp(id);
      if (response) {
        if (JSON.stringify(response) !== JSON.stringify(userDisplayData)) {
          setUserDisplayData(response);
        }
        setIsRegistered(true);
        return response;
      } else {
        setIsRegistered(false);
        return false;
      }
    } catch (error) {
      setIsRegistered(false);
      console.error("Error | isUserRegistered | ", error);
    }
  };

  const registerUser = async () => {
    if (!selectedBranches.length) {
      toast("error", "Please select at least one branch!");
      return;
    }
    const getPayloadData = getPayload(); // Call getPayload separately

    const updatedPayload = {
      ...getPayloadData, // Spread the original object
      selectedBranches: selectedBranches.map((branch) => ({
        id: branch.id,
        name: branch.name,
      })), // Modify only selectedBranches
    };
    if (profileData?.username) {
      try {
        const response = await axios.post(
          "/api/register-user",
          updatedPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response?.status) {
          localStorage.setItem("token", response?.token);
          if (role === "Teacher") {
            navigate(`/pending/${profileData?.id}`); // Redirect to Pending page if Teacher and not approved
          }
          setUserDisplayData(getPayload());
          setRoleType(role);
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
          console.error("registerUser failed");
        }
      } catch (error) {
        console.error("Error | registerUser | ", error);
      }
    } else {
      toast("error", "Launch App from Telegram!");
    }
  };

  const updateUser = async (payload) => {
    const token = localStorage.getItem("token"); // Retrieve token from storage
    try {
      const response = await axios.post("/api/update-user", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response?.status) {
        setUserDisplayData(getPayload());
      } else {
        console.error("updateUser failed");
      }
    } catch (error) {
      console.error("Error | updateUser | ", error);
    }
  };

  const getUserCoins = async (id) => {
    try {
      const token = localStorage.getItem("token"); // Retrieve token from storage
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

  const handleRefreshCoins = async (id) => {
    if (!isNaN(id)) {
      try {
        const updatedCoins = await getUserCoins(id); // Assuming this function fetches updated coins
        console.log("updatedCoins " + JSON.stringify(updatedCoins));
        if (coin !== null) {
          setCoin(updatedCoins); // Update the coin state
        }
      } catch (error) {
        console.error("Error refreshing coins:", error);
        toast("error", "Error refreshing coins!");
      }
    } else {
      toast("error", "Error refreshing coins!");
    }
  };

  const handleGetUserCoins = async (userId) => {
    try {
      if (!userId) {
        toast("error", "Please input a User ID!");
        return;
      }
      if (isNaN(userId)) {
        toast("error", "User ID can only contain numbers!");
        return;
      }
      const coin = await getUserCoins(userId);
      if (coin == null) {
        toast("error", "User ID does not exist!");
      }
      if (!isNaN(coin)) {
        const { first_name, last_name, photo_url, username, role } =
          await getUser(userId);
        if (role === "Student") {
          setRetrievedCoins({
            coin: coin,
            first_name,
            last_name,
            photo_url,
            username,
          }); // Set retrieved coins
        }
      }
    } catch (error) {
      console.error("Error fetching user coins:", error);
    }
  };

  const handleUpdateUserCoins = async (id, coinAmount) => {
    try {
      const token = localStorage.getItem("token");
      const {
        data: { status = false, coin },
      } = await axios.post(
        "/api/update-coins",
        { id, coinAmount },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (status) {
        setCoin(coin);
        return true;
      } else {
        console.error("updateUserCoin failed");
        return false;
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handleUpdateUserCoinsSubmit = async (id) => {
    const coinSend = parseInt(coinToSend, 10);
    const coinCurrent = parseInt(retrievedCoins.coin, 10);

    // Validate input
    if (isNaN(coinSend) || coinSend === 0) {
      toast("error", "Please enter a valid number greater or less than 0!");
      return;
    }

    if (isNaN(coinCurrent)) {
      toast("error", "Current coin balance is invalid!");
      return;
    }

    const coinTotal = coinSend + coinCurrent;

    try {
      const response = await handleUpdateUserCoins(id, coinTotal);

      if (response) {
        // Update frontend state
        setRetrievedCoins((prevState) => ({
          ...prevState,
          coin: coinTotal,
        }));
        setCoinToSend(""); // Reset input field
        toast("success", "User's coins updated successfully!");
      } else {
        toast("error", "Failed to update user's coins!");
      }
    } catch (error) {
      console.error("Error updating coins:", error);
      toast("error", "An error occurred while updating coins.");
    }
  };

  const handleScanQR = () => {
    const tg = window.Telegram.WebApp;
    tg.showScanQrPopup({}, (qrText) => {
      if (qrText) {
        setTargetUserId(qrText); // Update target user ID with scanned text
        handleGetUserCoins(qrText);
        setShowScanner(false); // Close the scanner popup
        return true; // Close popup automatically
      }
      return false; // Keep the popup open
    });
  };

  const getAllBranches = async () => {
    try {
      const {
        data: { status = false, dataObj = [] },
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
        console.log("Branches fetched:", dataObj);
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

  const handleSelectBranch = (branch) => {
    if (!selectedBranches.some((item) => item.id === branch.id)) {
      setSelectedBranches((prev) => [...prev, branch]);
    }
  };

  const handleRemoveBranch = (branchId) => {
    setSelectedBranches((prev) =>
      prev.filter((branch) => branch.id !== branchId)
    );
  };

  const handleCloseScanner = () => {
    const tg = window.Telegram.WebApp;
    tg.closeScanQrPopup(); // Close the scanner manually
    setShowScanner(false);
  };

  // const verifySignature = async (payload) => {
  //   try {
  //     const response = await axios.post("/api/verify-signature", payload, {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     console.log('response: ' + JSON.stringify(response))
  //   } catch (error) {
  //     console.error("Error | updateUser | ", error);
  //   }
  // }

  // Handle the back button click
  const handleBackButtonClick = () => {
    if (page === 1) {
      // Close the app if on the first page
      window.Telegram.WebApp.close();
    } else {
      // Go back a page otherwise
      setPage((prevPage) => prevPage - 1);
    }
  };

  // Handle the back button click
  const handleMainButtonClick = () => {
    showPopup({
      message: "Hello, I am main button popup",
    });
  };

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleSubmit = async () => {
    const payload = {
      chatId: InitDataUnsafe?.user?.id,
      message: "hi",
    };
    try {
      const response = await axios.post("/api/test", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Response:", response.data);
      const tg = window.Telegram.WebApp;
      tg.close();
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handlePopup = ({
    title = "Default Title",
    message = "Default Message",
  }) => {
    showPopup({
      title,
      message,
    });
  };

  const renderPageContent = () => {
    switch (page) {
      case 1:
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Welcome to Page 1</h2>
            <p>This is the first page of the app.</p>
          </>
        );
      case 2:
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Welcome to Page 2</h2>
            <p>This is the second page of the app.</p>
          </>
        );
      case 3:
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Welcome to Page 3</h2>
            <p>This is the third page of the app.</p>
          </>
        );
      default:
        return (
          <>
            <h2 className="text-2xl font-bold mb-4">Unknown Page</h2>
            <p>You're on an undefined page.</p>
          </>
        );
    }
  };

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="flex space-x-2">
        <div className="w-6 h-6 bg-[#e22028] animate-bounce delay-100"></div>
        <div className="w-6 h-6 bg-[#e22028] animate-bounce delay-200"></div>
        <div className="w-6 h-6 bg-[#e22028] animate-bounce delay-300"></div>
      </div>
    </div>
  );

  return (
    <div>
      {isLoading && <LoadingOverlay />}
      {isRegistered ? (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 text-gray-800 p-6 relative">
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
            className="w-full relative z-20 mt-3"
          />
          <div className="w-full max-w-3xl p-1 relative z-20">
            <div className="space-y-6">
              {/* User Data List */}
              <ul className="space-y-6 bg-white p-2 rounded-lg shadow-md max-w-md mx-auto">
                <div className="flex flex-col items-center space-y-4 p-6 relative">
                  {/* Header */}
                  <header className="flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                      <span className="text-red-600">
                        {roleType === "Teacher"
                          ? "Teacher"
                          : roleType === "Admin"
                          ? "Admin"
                          : "Student"}{" "}
                      </span>
                      Page
                    </h1>
                  </header>
                  {/* Profile Picture */}
                  <div className="relative">
                    <img
                      src={userDisplayData.photo_url}
                      alt={`${userDisplayData.first_name}'s avatar`}
                      className="w-32 h-32 rounded-full border-4 border-gray-300 shadow-lg"
                    />
                  </div>
                  {/* Buttons Section (Only for Students) */}
                  {roleType === "Student" && (
                    <div className="flex flex-col items-center space-y-4 bg-gray-50 p-6 rounded-lg shadow-md max-w-md mx-auto w-full">
                      {/* Coin Badge */}
                      <button
                        onClick={() => handleRefreshCoins(profileData.id)}
                        className="flex items-center justify-center text-center bg-yellow-400 border-4 border-yellow-500 shadow-lg text-white text-md font-medium rounded-full px-6 py-2 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-transform duration-300 transform hover:scale-105"
                      >
                        Coins: {coin} <MonetizationOnTwoToneIcon />
                      </button>
                      {/* Claim Rewards Button */}
                      <Link
                        to={{
                          pathname: "/shop",
                          search: `?id=${InitDataUnsafe?.user?.id}`,
                        }}
                        className="flex items-center justify-center text-center bg-red-400 border-4 border-red-500 shadow-lg text-white text-md font-medium rounded-full px-6 py-2 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300 transition-transform duration-300 transform hover:scale-105"
                        aria-label="Claim Rewards"
                      >
                        Claim Rewards <GradeTwoToneIcon />
                      </Link>
                    </div>
                  )}
                  {/* Display other details */}
                  <ul className="space-y-4 bg-gray-50 p-6 rounded-lg shadow-md max-w-md mx-auto w-full">
                    {["first_name", "last_name", "username", "id"].map(
                      (key) => (
                        <li
                          key={key}
                          className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0"
                        >
                          <span className="font-semibold text-gray-600 capitalize">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="text-gray-800 break-words">
                            {userDisplayData[key]}
                          </span>
                        </li>
                      )
                    )}
                    {/* Conditionally render selectedBranches as badges */}
                    {userDisplayData?.selectedBranches?.length > 0 && (
                      <li className="flex items-center space-x-6 border-b border-gray-200 pb-4 last:border-b-0">
                        <span className="font-semibold text-gray-600 capitalize w-36">
                          Branches:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {userDisplayData.selectedBranches.map((branch) => (
                            <span
                              key={branch.id}
                              className="px-3 py-1 text-xs font-semibold text-white bg-amber-500 rounded-full truncate mb-2"
                            >
                              {branch.name}
                            </span>
                          ))}
                        </div>
                      </li>
                    )}
                    {/* Student QR Code */}
                    {profileData?.id && roleType === "Student" && (
                      <li className="flex items-center space-x-6 border-b bg-gray-50 last:border-b-0">
                        <span className="font-semibold text-gray-600 capitalize w-36">
                          QR Code for Receiving Coins:
                        </span>
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                          <QRCodeSVG value={profileData.id} size={120} />
                        </div>
                      </li>
                    )}
                  </ul>
                  {roleType === "Teacher" && (
                    <div className="p-2 border-1 bg-gray-50 shadow-md rounded-lg max-w-md mx-auto">
                      <h1 className="text-3xl font-extrabold text-gray-900 text-center mt-4 mb-4 tracking-tight relative">
                        Update <span className="text-red-600">User Coins</span>
                      </h1>
                      <div className="flex w-full relative">
                        <input
                          type="text"
                          placeholder="Enter User ID"
                          value={targetUserId}
                          onChange={(e) => setTargetUserId(e.target.value)}
                          className="w-[80%] px-4 py-2 text-xs border border-gray-300 rounded-l-lg rounded-r-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          onClick={handleScanQR}
                          className="px-4 py-2 bg-gray-200 border border-gray-300 font-semibold rounded-r-none hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          aria-label="Scan QR Code"
                        >
                          Scan QR
                        </button>
                        <button
                          onClick={() => handleGetUserCoins(targetUserId)}
                          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          Get
                        </button>
                      </div>
                      {/* Display retrieved user details and coins */}
                      {retrievedCoins !== null && (
                        <div className="mt-4 p-4 bg-white rounded-lg shadow-md w-full">
                          <div className="flex items-center space-x-4">
                            {retrievedCoins.photo_url && (
                              <img
                                src={retrievedCoins.photo_url}
                                alt="User Profile"
                                className="w-16 h-16 rounded-full border-4 border-gray-300 shadow-lg"
                              />
                            )}
                            <div>
                              <p className="text-lg font-bold text-gray-800">
                                {retrievedCoins.first_name}{" "}
                                {retrievedCoins.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                @{retrievedCoins.username}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-lg text-gray-800">
                            Coins:{" "}
                            {coinToSend && parseInt(coinToSend, 10) !== 0 ? (
                              <>
                                <span className="font-bold text-yellow-600 line-through">
                                  {retrievedCoins.coin}
                                  <MonetizationOnTwoToneIcon />
                                </span>{" "}
                                <span
                                  className={`font-bold ${
                                    parseInt(coinToSend, 10) < 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {retrievedCoins.coin +
                                    parseInt(coinToSend, 10)}
                                  <MonetizationOnTwoToneIcon />
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-yellow-600">
                                {retrievedCoins.coin}
                                <MonetizationOnTwoToneIcon />
                              </span>
                            )}
                          </p>

                          {/* Input and Button for Coin Update */}
                          <div className="flex flex-col space-y-2 w-full">
                            <label
                              htmlFor="coinInput"
                              className="text-xs font-medium text-gray-600"
                            >
                              Enter coins to add or subtract:
                            </label>
                            <div className="flex items-center">
                              <button
                                onClick={() =>
                                  setCoinToSend((prev) =>
                                    prev.startsWith("-")
                                      ? prev.slice(1)
                                      : `-${prev}`
                                  )
                                }
                                className="px-2 py-1 bg-gray-300 rounded-lg mr-2"
                              >
                                +/-
                              </button>
                              <input
                                id="coinInput"
                                type="text"
                                value={coinToSend}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^-?\d*$/.test(value)) {
                                    // Allow only numbers with optional "-" sign
                                    setCoinToSend(value);
                                  }
                                }}
                                placeholder="Enter coins"
                                className="w-full max-w-full px-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            </div>

                            <button
                              onClick={() =>
                                handleUpdateUserCoinsSubmit(targetUserId)
                              }
                              className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {roleType === "Admin" && (
                    <div className="flex items-center justify-center space-x-4 w-full max-w-3xl mt-8">
                      <AdminPage adminData={InitDataUnsafe?.user} />
                    </div>
                  )}
                </div>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 relative">
          <BackButton onClick={handleBackButtonClick} />
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
            className="w-full relative z-20"
          />
          {/* <MainButton onClick={handleMainButtonClick} text="Main Button" /> */}
          <div className="bg-white shadow-xl rounded-lg w-full max-w-md p-8 relative z-20">
            {/* Header */}
            <header className="flex flex-col items-center justify-center">
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-6">
                <span className="text-red-600">Registration </span>
                Page
              </h1>
            </header>
            {profileData.photo_url && (
              <div className="flex justify-center mb-6">
                <img
                  src={profileData.photo_url}
                  alt="User Profile"
                  className="w-32 h-32 rounded-full border-4 border-gray-300 shadow-lg"
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">
                {profileData.first_name} {profileData.last_name}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="mb-4">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full appearance-none bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    {/* <option value="Admin">Admin</option> */}
                  </select>
                  <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500">
                    ▼
                  </span>
                </div>
              </div>

              {/* Branch Selection */}
              <div className="mb-4">
                <label
                  htmlFor="branch"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                        handleSelectBranch(selectedBranch);
                      }
                    }}
                    className="block w-full appearance-none bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a branch
                    </option>
                    {branches.map((branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                        disabled={selectedBranches.some(
                          (item) => item.id === branch.id
                        )}
                      >
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500">
                    ▼
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {selectedBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between border border-gray-300 rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="text-gray-800">{branch.name}</span>
                      <button
                        onClick={() => handleRemoveBranch(branch.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={registerUser}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg text-lg font-semibold shadow-md hover:bg-pink-600 transition duration-200"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
