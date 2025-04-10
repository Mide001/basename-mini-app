"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OwnerDetails = {
  address: string;
  expiryDate: string;
};

const BasenameDetailsPage = () => {
  const router = useRouter();
  const { name } = router.prefetch;
  const [loading, setLoading] = useState(true);
  const [ownerDetails, setOwnerDetails] = useState<OwnerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!name) return;

      try {
        setLoading(true);
        // For testing purposes, mock API response
        // Replace this with your actual API call in production
        setTimeout(() => {
          setOwnerDetails({
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            expiryDate: "2025-03-15",
          });
          setLoading(false);
        }, 1000);

        // Uncomment for real API usage:
        // const response = await fetch(`/api/basename-details?name=${name}`);
        // if (!response.ok) {
        //   throw new Error("Failed to fetch basename details");
        // }
        // const data = await response.json();
        // setOwnerDetails(data.ownerDetails);
      } catch (err) {
        console.error("Error fetching basename details:", err);
        setError("Failed to load basename details. Please try again later.");
        setLoading(false);
      }
    };

    if (name) {
      fetchDetails();
    }
  }, [name]);

  // Helper function to truncate Ethereum address
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        {/* Back button */}
        <div className="p-4 border-b border-gray-200">
          <Link
            href="/"
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Search
          </Link>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              Basename Details
            </div>
            <h2 className="mt-2 text-xl font-bold text-gray-900">
              {name}.base.eth
            </h2>
            <p className="mt-1 text-sm text-red-500">
              This basename is already registered
            </p>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Owner Information
              </h3>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {truncateAddress(ownerDetails?.address || "")}
                    </p>
                    <a
                      href={`https://basescan.org/address/${ownerDetails?.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      View on Basescan →
                    </a>
                  </div>
                </div>

                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Expires On
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(ownerDetails?.expiryDate || "")}
                  </dd>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                onClick={() => alert("This feature is coming soon!")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Set Availability Alert
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasenameDetailsPage;
