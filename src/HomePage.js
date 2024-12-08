import React, { useEffect, useState } from "react";
import AdminPage from "./AdminPage";
import { useToast } from "./Toast";
import { Link } from "react-router-dom"; // Import Link for navigation
import {
  useShowPopup,
  useHapticFeedback,
  MainButton,
  BackButton,
  useInitData,
} from "@vkruglikov/react-telegram-web-app";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";

const App = () => {
  const toast = useToast();
  const showPopup = useShowPopup();
  const [impactOccurred] = useHapticFeedback();
  const [InitDataUnsafe] = useInitData();

  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [userDisplayData, setUserDisplayData] = useState({});
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

  const getPayload = () => ({
    id: String(InitDataUnsafe?.user?.id),
    first_name: InitDataUnsafe?.user?.first_name,
    last_name: InitDataUnsafe?.user?.last_name,
    username: InitDataUnsafe?.user?.username,
    language_code: InitDataUnsafe?.user?.language_code,
    photo_url: InitDataUnsafe?.user?.photo_url,
    role,
  });

  const getUser = async (id) => {
    try {
      const {
        data: { status = false, dataObj = {} },
      } = await axios.post(
        "/api/get-user",
        { id },
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
  };

  const hasDataChanged = (newData, oldData) => {
    const newClone = { ...newData };
    const oldClone = { ...oldData };

    // Initialize an object to store changed fields
    const changedFields = {};

    // Remove the keys we want to ignore
    delete newClone.role;
    delete oldClone.role;

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
      const response = await getUser(id);
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
    if (profileData?.username) {
      try {
        const response = await axios.post("/api/register-user", getPayload(), {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response?.status) {
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
    try {
      const response = await axios.post("/api/update-user", payload, {
        headers: {
          "Content-Type": "application/json",
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
      toast("error", "This is an error message!");
    }
  };

  const handleUpdateUserCoins = async (id, coinAmount) => {
    try {
      const {
        data: { status = false, coin },
      } = await axios.post(
        "/api/update-coins",
        { id, coinAmount },
        {
          headers: {
            "Content-Type": "application/json",
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
    const coinCurrent = parseInt(retrievedCoins.coin);
    if (!isNaN(coinSend) && coinSend !== 0 && !isNaN(coinCurrent)) {
      const coinTotal = coinSend + coinCurrent;
      const response = await handleUpdateUserCoins(id, coinTotal);
      response &&
        setRetrievedCoins((prevState) => ({
          ...prevState,
          coin: coinTotal,
        }));
      setCoinToSend("");
    } else {
      toast("error", "Please enter an amount which is more or less than 0!");
    }
  };

  const handleScanQR = () => {
    const tg = window.Telegram.WebApp;
    tg.showScanQrPopup({}, (qrText) => {
      if (qrText) {
        // setTargetUserId(qrText); // Update target user ID with scanned text
        handleGetUserCoins(qrText);
        setShowScanner(false); // Close the scanner popup
        return true; // Close popup automatically
      }
      return false; // Keep the popup open
    });
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
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
          <div className="text-center py-6 px-4">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome back,{" "}
              {roleType === "Teacher"
                ? "Teacher"
                : roleType === "Admin"
                ? "Admin"
                : "Student"}{" "}
              <span className="text-red-600">{profileData?.first_name}</span>
            </h1>
            <p className="text-lg text-gray-600">
              We're glad to see you again! 🎉
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
            {profileData?.id && roleType === "Student" && (
              <div className="flex flex-col items-center justify-center mb-4">
                <QRCodeSVG value={profileData.id} size={150} />
              </div>
            )}
            <div className="space-y-8">
              {/* User Data List */}
              <ul className="space-y-6 bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                {[
                  "photo_url",
                  "first_name",
                  "last_name",
                  "username",
                  "language_code",
                  "id",
                ].map((key) => (
                  <li
                    key={key}
                    className="flex items-center space-x-6 border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <span className="font-semibold text-gray-600 capitalize w-36">
                      {key.replace(/_/g, " ")}:
                    </span>
                    {key === "photo_url" ? (
                      <img
                        src={userDisplayData[key]}
                        alt={`${userDisplayData.first_name}'s avatar`}
                        className="w-16 h-16 rounded-full border-2 border-gray-300 shadow-md"
                      />
                    ) : (
                      <span className="text-gray-800 break-words">
                        {userDisplayData[key]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {roleType === "Student" && (
                <>
                  <div className="flex items-center justify-center space-x-4 p-5 rounded-lg shadow-xl bg-white">
                    {/* Coin Value */}
                    <div className="text-gray-900 text-lg font-medium">
                      Coins:{" "}
                      <span className="text-yellow-600 font-bold text-lg">
                        {coin} 🪙
                      </span>
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={() => handleRefreshCoins(profileData.id)}
                      className="flex items-center justify-center h-10 px-4 rounded-full bg-blue-200 border-2 border-blue-400 hover:bg-blue-300 text-gray-800 font-medium transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Refresh Coins"
                    >
                      <div className="text-gray-600 text-sm font-semibold mx-2">
                        🔄
                      </div>
                    </button>
                  </div>

                  {/* Go to Shop Button */}
                  <Link
                    to={{
                      pathname: "/shop",
                      search: `?id=${InitDataUnsafe?.user?.id}`, // Adding a query parameter to the URL
                    }}
                    className="flex items-center justify-center space-x-4 p-5 rounded-lg shadow-lg bg-green-200 border-2 border-green-400 hover:bg-green-300 text-gray-800 font-medium transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <span className="text-lg">Redeem Coins 🛍️</span>
                  </Link>
                </>
              )}
              {roleType === "Teacher" && (
                <div className="p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
                  <h1 className="text-xl font-semibold text-center m-3">
                    Update User Coins 🪙
                  </h1>
                  <div className="flex w-full relative">
                    <input
                      type="text"
                      placeholder="Enter User ID"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="w-[80%] px-4 py-2 border border-gray-300 rounded-l-lg rounded-r-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      onClick={handleScanQR}
                      className="px-4 py-2 bg-gray-200 border border-gray-300 rounded-r-none hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-md w-full">
                      <div className="flex items-center space-x-4">
                        {retrievedCoins.photo_url && (
                          <img
                            src={retrievedCoins.photo_url}
                            alt="User Profile"
                            className="w-16 h-16 rounded-full shadow-md"
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
                              {retrievedCoins.coin}🪙
                            </span>{" "}
                            <span
                              className={`font-bold ${
                                parseInt(coinToSend, 10) < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {retrievedCoins.coin + parseInt(coinToSend, 10)}🪙
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-yellow-600">
                            {retrievedCoins.coin}🪙
                          </span>
                        )}
                      </p>

                      {/* Input and Button for Coin Update */}
                      <div className="flex flex-col space-y-2 w-full">
                        <label
                          htmlFor="coinInput"
                          className="text-sm font-medium text-gray-600"
                        >
                          Enter coins to add or subtract:
                        </label>
                        <input
                          id="coinInput"
                          type="number"
                          value={coinToSend}
                          onChange={(e) => setCoinToSend(e.target.value)}
                          placeholder="Enter coins"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          onClick={() =>
                            handleUpdateUserCoinsSubmit(targetUserId)
                          }
                          className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          Update User's Coins
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {roleType === "Admin" && (
                <>
                  <div className="flex items-center justify-center space-x-4">
                    <AdminPage adminData={InitDataUnsafe?.user} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
          <BackButton onClick={handleBackButtonClick} />
          {/* <MainButton onClick={handleMainButtonClick} text="Main Button" /> */}
          <div className="bg-white shadow-xl rounded-lg w-full max-w-md p-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              Mavis Tutorial Web App
            </h1>

            {profileData.photo_url && (
              <div className="flex justify-center mb-6">
                <img
                  src={profileData.photo_url}
                  alt="User Profile"
                  className="w-20 h-20 rounded-full shadow-md"
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">
                {profileData.first_name} {profileData.last_name}
              </p>
              {/* <p className="mt-2 text-gray-500">Current Page: {page}</p> */}
            </div>

            <div className="mt-8 space-y-4">
              <div className="mb-4">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Student">Student 🧑‍🎓</option>
                  <option value="Teacher">Teacher 👩‍🏫</option>
                  <option value="Admin">Admin 👨‍💼</option>
                </select>
              </div>
              {/* {renderPageContent()}

              {page < 3 && (
                <button
                  onClick={handleNextPage}
                  className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-purple-600 transition duration-200"
                >
                  Next Page
                </button>
              )} */}

              {/* <button
                onClick={() =>
                  showPopup({
                    title: "Info",
                    message: `You're on page ${page}.`,
                  })
                }
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-blue-600 transition duration-200"
              >
                Show Popup
              </button> */}
              {/* <button
                onClick={handleSubmit}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-green-600 transition duration-200"
              >
                Send-to-Bot
              </button> */}
              <button
                onClick={registerUser}
                className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-pink-600 transition duration-200"
              >
                Register
              </button>
              {/* <button
                onClick={() => getUser(profileData.id)}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-orange-600 transition duration-200"
              >
                Test Get User
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
