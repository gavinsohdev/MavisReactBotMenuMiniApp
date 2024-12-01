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
  const [page, setPage] = useState(1); // Tracks the current page for navigation
  const [loading, setLoading] = useState(true); // Tracks loading state

  const [impactOccurred, notificationOccurred, selectionChanged] =
    useHapticFeedback();
  const [InitDataUnsafe, InitData] = useInitData();

  useEffect(() => {
    setTimeout(() => {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setLoading(false);
      const { photo_url, first_name, last_name } = InitDataUnsafe?.user || {};
      setUserData({ photo_url, first_name, last_name });

      tg.onEvent("mainButtonClicked", function () {
        const dataToSend = { status: "clicked", timestamp: Date.now() };
        tg.sendData(JSON.stringify(dataToSend));
        tg.close();
      });
    }, 500);
  }, [InitDataUnsafe]);

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
      chatId: InitDataUnsafe?.user?.id || "defaultChatId",
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

  const handleUpload = async () => {
    impactOccurred("light");
    const payload = {
      id: InitDataUnsafe?.user?.id || "defaultChatId",
      firstName: InitDataUnsafe?.user?.first_name || "defaultFirstName",
      lastName: InitDataUnsafe?.user?.last_name || "defaultLastName",
      username: InitDataUnsafe?.user?.username || "defaultUsername",
      language: InitDataUnsafe?.user?.language_code || "defaultLanguageCode",
      photoUrl: InitDataUnsafe?.user?.photo_url || "defaultPhotoUrl",
    };
    try {
      const response = await axios.post("/api/test-upload", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      response
        ? handlePopup("Info", 'Success')
        : handlePopup("Info", "Failure");
    } catch (error) {
      console.error("Error submitting data:", error);
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

  // If the app is loading, show the loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="loader rounded-full border-t-4 border-blue-500 w-16 h-16 animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
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
            Test Upload
          </button>
          <div>
            <p className="w-4/5 mx-auto text-center text-gray-700 text-lg">
              {JSON.stringify(InitDataUnsafe)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
