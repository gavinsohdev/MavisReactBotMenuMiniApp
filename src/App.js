import React, { useEffect, useState } from "react";
import {
  useShowPopup,
  useHapticFeedback,
  MainButton,
  BackButton,
  useInitData,
} from "@vkruglikov/react-telegram-web-app";
import axios from "axios";

const App = () => {
  // Hooks for various states
  const showPopup = useShowPopup();
  const [impactOccurred ] = useHapticFeedback();
  const [InitDataUnsafe ] = useInitData();
  
  const [profileData, setProfileData] = useState({});
  const [userFirebaseData, setUserFirebaseData] = useState({});
  const [page, setPage] = useState(1);
  const [coin, setCoin] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [newCoinAmount, setNewCoinAmount] = useState("");

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();
  
    const { photo_url, first_name, last_name, id, username, language_code } = InitDataUnsafe?.user || {};
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
          const dataChanged = hasDataChanged(InitDataUnsafe?.user, response);
          dataChanged && updateUser(dataChanged);
        }
        handleGetUserCoins();
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
  });

  const getUser = async (id) => {
    try {
      const { data: { status = false, dataObj = {} } } = await axios.post("/api/get-user", { id }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("dataObj: " + JSON.stringify(dataObj))
      if (status) {
        // Only set state if dataObj is different from current state
        if (JSON.stringify(dataObj) !== JSON.stringify(userFirebaseData)) {
          setUserFirebaseData(dataObj);
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
    // Clone the objects and remove keys to ignore
    const newClone = { ...newData };
    const oldClone = { ...oldData };

    // Remove ignored keys from the clones
    delete newClone.allows_write_to_pm;
    delete oldClone.allows_write_to_pm;

    // Initialize an object to store changed fields
    const changedFields = {};

    // Compare newClone and oldClone for changes
    Object.keys(newClone).forEach((key) => {
      if (newClone[key] !== oldClone[key]) {
        changedFields[key] = String(newClone[key]);
      }
    });

    // Return null if no changes are found, otherwise return the changed fields
    return Object.keys(changedFields).length > 0 ? changedFields : null;
  }

  const isUserRegistered = async (id) => {
    try {
      const response = await getUser(id);
      if (response) {
        setIsRegistered(true);
        return response
      } else {
        setIsRegistered(false)
        return false
      }
    } catch (error) {
      setIsRegistered(false);
      console.error("Error | isUserRegistered | ", error);     
    }
  }

  const registerUser = async () => {
    try {
      const response = await axios.post("/api/register-user", getPayload(), {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response?.status) {
        setUserFirebaseData(getPayload());
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
        console.error("registerUser failed");
      }
    } catch (error) {
      console.error("Error | registerUser | ", error);
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
        setUserFirebaseData(getPayload());
      } else {
        console.error("updateUser failed");
      }
    } catch (error) {
      console.error("Error | updateUser | ", error);
    }
  };

  const handleGetUserCoins = async () => {
    const payload = {
      id: String(InitDataUnsafe?.user?.id),
    };
    if (payload.id) {
      try {
        const response = await axios.post("/api/get-coins", payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const coin = response?.data?.coin;
        console.log("coin: " + coin)
        if (coin !== undefined) {
          setCoin(coin);
          return coin;
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error submitting data:", error);
        return null;
      }
    } else {
      console.error("ID is invalid");
    }
  };

  const handleUpdateUserCoins = async (new_coin_amt) => {
    const payload = {
      id: String(InitDataUnsafe?.user?.id),
      coinAmount: new_coin_amt,
    };
    if (payload.id) {
      try {
        const response = await axios.post("/api/update-coins", payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(`handleUpdateUserCoins: ` + JSON.stringify(response));
        setCoin(new_coin_amt);
      } catch (error) {
        console.error("Error submitting data:", error);
      }
    } else {
      console.error("ID is invalid");
    }
  };

  const handleUpdateUserCoinsSubmit = async () => {
    const coinValue = parseInt(newCoinAmount, 10);
    if (!isNaN(coinValue)) {
      await handleUpdateUserCoins(coinValue);
    } else {
      console.error("Invalid coin amount");
    }
  };

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

  return isRegistered ? (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {profileData?.first_name}
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          We're glad to see you again!
        </p>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
        <div className="space-y-8">
          {/* User Data List */}
          <ul className="space-y-4">
            {[
              "photo_url",
              "first_name",
              "last_name",
              "username",
              "language_code",
              "id",
            ].map((key) => (
              <li key={key} className="flex items-center space-x-4">
                <span className="font-medium text-gray-600 capitalize w-32">
                  {key.replace(/_/g, " ")}:
                </span>
                {key === "photo_url" ? (
                  <img
                    src={userFirebaseData[key]}
                    alt={`${userFirebaseData.first_name}'s avatar`}
                    className="w-16 h-16 rounded-full border border-gray-300"
                  />
                ) : (
                  <span className="text-gray-800">{userFirebaseData[key]}</span>
                )}
              </li>
            ))}
          </ul>

          {/* Coin Display */}
          <div className="flex items-center justify-center space-x-4 bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg shadow-lg">
            <div className="relative">
              {/* Animated Coin */}
              <div className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-yellow-700 flex items-center justify-center text-yellow-100 font-bold animate-spin-slow">
                💰
              </div>
            </div>
            {/* Coin Count */}
            <div className="text-gray-800 text-lg font-semibold">
              Coins: <span className="text-yellow-600 font-bold">{coin}</span>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4 p-4 bg-white shadow-lg rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-700">
              Update User Coins
            </h2>
            <div className="flex flex-col space-y-2 w-full">
              <label
                htmlFor="coinInput"
                className="text-sm font-medium text-gray-600"
              >
                Enter new coin amount:
              </label>
              <input
                id="coinInput"
                type="number"
                value={newCoinAmount}
                onChange={(e) => setNewCoinAmount(e.target.value)}
                placeholder="Enter coins"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <button
              onClick={handleUpdateUserCoinsSubmit}
              className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              Update Coins
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
      <BackButton onClick={handleBackButtonClick} />
      <MainButton onClick={handleMainButtonClick} text="Main Button" />
      <div className="bg-white shadow-xl rounded-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Telegram Mini App</h1>

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
          <p className="mt-2 text-gray-500">Current Page: {page}</p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Render dynamic page content */}
          {renderPageContent()}

          {page < 3 && ( // Only show the Next Page button if not on the last page
            <button
              onClick={handleNextPage}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-purple-600 transition duration-200"
            >
              Next Page
            </button>
          )}

          <button
            onClick={() =>
              showPopup({
                title: "Info",
                message: `You're on page ${page}.`,
              })
            }
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-blue-600 transition duration-200"
          >
            Show Popup
          </button>
          <button
            onClick={handleSubmit}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-green-600 transition duration-200"
          >
            Send-to-Bot
          </button>
          <button
            onClick={registerUser}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-pink-600 transition duration-200"
          >
            Register
          </button>
          <button
            onClick={getUser(profileData.id)}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-orange-600 transition duration-200"
          >
            Test Get User
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
