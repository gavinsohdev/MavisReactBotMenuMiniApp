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
  const showPopup = useShowPopup();
  const [userData, setUserData] = useState({});
  const [userFirebaseData, setUserFirebaseData] = useState("");
  const [page, setPage] = useState(1);
  const [coin, setCoin] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);

  const [impactOccurred, notificationOccurred, selectionChanged] =
    useHapticFeedback();
  const [InitDataUnsafe, InitData] = useInitData();

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    const { photo_url, first_name, last_name } = InitDataUnsafe?.user || {};
    setUserData({ photo_url, first_name, last_name });
    fetchAndUpdateUserData();

    tg.onEvent("mainButtonClicked", function () {
      const dataToSend = { status: "clicked", timestamp: Date.now() };
      tg.sendData(JSON.stringify(dataToSend));
      tg.close();
    });
  }, [InitDataUnsafe]);

  const handleGetUserCoins = async () => {
    impactOccurred("light");
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
        setCoin(response?.data?.coin);
      } catch (error) {
        console.error("Error submitting data:", error);
      }
    } else {
      console.error("ID is invalid");
    }
  };

  async function fetchAndUpdateUserData() {
    const { status = false, dataArr = [] } = await handleGetUser();
    if (status) {
      handleGetUserCoins();
      setIsRegistered(status);
      const dataChanged = hasDataChanged(InitDataUnsafe.user, dataArr[0]);
      console.log("Old: " + JSON.stringify(InitDataUnsafe.user));
      console.log("New: " + JSON.stringify(dataArr[0]));
      console.log("dataChanged: " + dataChanged);
      dataChanged && handleUpload();
    } else {
      setIsRegistered(status);
    }
  }

  function hasDataChanged(newData, oldData) {
    // Clone the objects to avoid modifying the original data
    const newClone = { ...newData };
    const oldClone = { ...oldData };

    // Remove the keys to ignore
    delete newClone.allows_write_to_pm;

    console.log("newClone: " + JSON.stringify(newClone));
    console.log("oldClone: " + JSON.stringify(oldClone));

    // Deep comparison of objects
    const areObjectsEqual = (obj1, obj2) => {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      // Check if both objects have the same keys
      if (keys1.length !== keys2.length) return false;

      // Check each key-value pair
      for (const key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
      }

      return true;
    };

    return !areObjectsEqual(newClone, oldClone);
  }

  // Handle the back button click
  const handleBackButtonClick = () => {
    if (page === 1) {
      // Close the app if on the first page
      window.Telegram.WebApp.close();
    } else {
      // Go back a page otherwise
      setPage((prevPage) => prevPage - 1);
      impactOccurred("light");
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
    impactOccurred("light");
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

  function getPayload(InitDataUnsafe) {
    return {
      id: String(InitDataUnsafe?.user?.id),
      first_name: InitDataUnsafe?.user?.first_name,
      last_name: InitDataUnsafe?.user?.last_name,
      username: InitDataUnsafe?.user?.username,
      language_code: InitDataUnsafe?.user?.language_code,
      photo_url: InitDataUnsafe?.user?.photo_url,
    };
  }

  const handleUpload = async () => {
    impactOccurred("light");
    const payload = getPayload(InitDataUnsafe);
    try {
      const response = await axios.post("/api/test-upload", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response?.status) {
        setUserFirebaseData(getPayload(InitDataUnsafe));
        setIsRegistered(true);
      } else {
        handlePopup({ title: "Info", message: "Failure" });
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handleGetUser = async () => {
    impactOccurred("light");
    const payload = {
      id: String(InitDataUnsafe?.user?.id),
    };
    if (payload.id) {
      try {
        const response = await axios.post("/api/test-get", payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response?.data?.status) {
          setUserFirebaseData(response.data.dataArr[0]);
          return response.data;
        } else {
          return { status: false };
        }
      } catch (error) {
        console.error("Error submitting data:", error);
      }
    } else {
      console.error("ID is invalid");
    }
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
          Welcome back, {userData?.first_name}
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
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
      <BackButton onClick={handleBackButtonClick} />
      <MainButton onClick={handleMainButtonClick} text="Main Button" />
      <div className="bg-white shadow-xl rounded-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Telegram Mini App</h1>

        {userData.photo_url && (
          <div className="flex justify-center mb-6">
            <img
              src={userData.photo_url}
              alt="User Profile"
              className="w-20 h-20 rounded-full shadow-md"
            />
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">
            {userData.first_name} {userData.last_name}
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
            onClick={handleUpload}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-pink-600 transition duration-200"
          >
            Register
          </button>
          <button
            onClick={handleGetUser}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg text-lg font-medium shadow-md hover:bg-orange-600 transition duration-200"
          >
            Test Get User
          </button>
        </div>
        <div>
          <h2>Firebase Data: </h2>
          <ul>{JSON.stringify(userFirebaseData)}</ul>
        </div>
      </div>
    </div>
  );
};

export default App;
