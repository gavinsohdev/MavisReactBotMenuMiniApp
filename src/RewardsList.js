import React, { useState } from "react";
import { formatISODate } from "./helpers";

const RewardsList = ({ rewards, branches, handleUpdateReward, handleDeleteReward }) => {
  const [editingId, setEditingId] = useState(null);
  const [editableFields, setEditableFields] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const itemsPerPage = 2;

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

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditableFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Sort rewards by latest date first
  const sortedRewards = rewards
    ? [...rewards].sort(
        (a, b) => new Date(b.date_added) - new Date(a.date_added)
      )
    : [];

  // Pagination logic
  const totalPages =
    sortedRewards.length > 0
      ? Math.ceil(sortedRewards.length / itemsPerPage)
      : 1;

  const currentRewards =
    sortedRewards.length > 0
      ? sortedRewards.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )
      : [];

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6">
        {currentRewards.length > 0 ? (
          currentRewards.map((reward) => (
            <div
              key={reward.id}
              className="p-4 bg-white shadow-lg rounded-lg border"
            >
              <img
                src={reward.photo_url}
                alt={reward.id}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              {editingId === reward.id ? (
                <div className="space-y-4 p-6 bg-white rounded-lg shadow-md w-full max-w-md mx-auto">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={
                        editableFields.name !== undefined
                          ? editableFields.name
                          : reward.name
                      }
                      onChange={handleFieldChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="Name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="photo_url"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Photo URL
                    </label>
                    <input
                      type="text"
                      name="photo_url"
                      id="photo_url"
                      value={
                        editableFields.photo_url !== undefined
                          ? editableFields.photo_url
                          : reward.photo_url
                      }
                      onChange={handleFieldChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="Photo URL"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="price"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      value={
                        editableFields.price !== undefined
                          ? editableFields.price
                          : reward.price
                      }
                      onChange={handleFieldChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="Price"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quantity"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      value={
                        editableFields.quantity !== undefined
                          ? editableFields.quantity
                          : reward.quantity
                      }
                      onChange={handleFieldChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="Quantity"
                    />
                  </div>
                  {/* Branch Selection */}
                  <div>
                    <label
                      htmlFor="branch"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Branches
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
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select a branch
                        </option>
                        {branches.map((branch) => (
                          <option
                            key={branch.id}
                            value={branch.id}
                            disabled={selectedBranches?.some(
                              (item) => item.id === branch.id
                            )}
                          >
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="flex items-center justify-between border border-gray-300 rounded-lg p-2 bg-gray-100"
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
                  <div className="flex justify-between gap-4">
                    <button
                      onClick={() => {
                        handleUpdateReward({
                          ...reward,
                          ...editableFields,
                          selectedBranches: selectedBranches
                        });
                        setEditingId(null);
                        setEditableFields({});
                      }}
                      className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditableFields({});
                      }}
                      className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
                  <p className="text-lg font-semibold text-center text-gray-800">
                    {reward.name}
                  </p>
                  <p className="text-sm text-center text-gray-600">
                    Price:{" "}
                    <span className="font-bold text-gray-800">
                      {reward.price} 🪙
                    </span>
                  </p>
                  <p className="text-sm text-center text-gray-600">
                    Quantity:{" "}
                    <span className="font-bold text-gray-800">
                      {reward.quantity}
                    </span>
                  </p>
                  <p className="text-sm text-center text-gray-600">
                    Date Added:{" "}
                    <span className="font-semibold text-gray-800">
                      {formatISODate(reward.date_added)}
                    </span>
                  </p>
                  {/* Conditionally render selectedBranches */}
                  {reward.selectedBranches && reward.selectedBranches.length > 0 && (
                    <div className="text-center mb-4">
                      <span className="text-gray-600 text-sm mb-2 block">
                        {reward.selectedBranches.length > 1 ? "Branches:" : "Branch:"}
                      </span>
                      <div className="flex flex-wrap justify-center space-x-2 mt-2">
                        {reward.selectedBranches.map((branch) => (
                          <span
                            key={branch.id}
                            className="px-3 py-1 text-xs font-semibold text-white bg-amber-500 rounded-full truncate mb-2"
                          >
                            {branch.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setEditingId(reward.id);
                        setEditableFields({
                          name: reward.name,
                          photo_url: reward.photo_url,
                          price: reward.price,
                          quantity: reward.quantity,
                        });
                        setSelectedBranches(reward.selectedBranches);
                      }}
                      className="w-full bg-yellow-500 text-white rounded-lg py-2 px-4 hover:bg-yellow-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      Edit Reward
                    </button>
                    <button
                      onClick={() => {
                        // Confirmation popup before proceeding with delete
                        const confirmDelete = window.confirm(
                          "Are you sure you want to delete this reward?"
                        );
                        if (confirmDelete) {
                          handleDeleteReward(reward.id); // Proceed with deletion if confirmed
                        }
                      }}
                      className="w-full bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Delete Reward
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No rewards available.</p>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center space-x-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="flex justify-center items-center w-24 h-10 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <p className="text-sm text-center">
          Page
          <br />
          {currentPage} of {totalPages}
        </p>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="flex justify-center items-center w-24 h-10 bg-gray-300 text-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RewardsList;
