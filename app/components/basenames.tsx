import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";

// Define types for position and profile
type Position = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

type Profile = {
  name: string;
  position: Position;
  imagePath: string;
};

const Basenames = () => {
  const [value, setValue] = useState("");
  const [searchResults, setSearchResults] = useState<{
    name: string;
    isAvailable?: boolean;
    owner?: string;
    expiry?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setIsClientReady(true);
    }

    if (typeof window !== "undefined") {
      handleResize();

      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const checkNameAvailability = async (name: string) => {
    if (!name) {
      setSearchResults(null);
      return;
    }

    if (name.length < 3) {
      setErrorMessage("Name is too short. Minimum 3 characters required.");
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/check-basename?name=${name}`);
      if (!response.ok) {
        throw new Error("Failed to check name availability");
      }
      const data = await response.json();
      console.log("Data: ", data);

      setSearchResults({
        name: `${name}.base.eth`,
        isAvailable: data.isAvailable,
        owner: data.owner,
        expiry: data.expiry,
      });
    } catch (error) {
      console.error("Error checking name availability:", error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedCheck = useCallback(
    debounce((name: string) => {
      if (name.trim()) {
        const nameToCheck = name.trim().toLowerCase();
        checkNameAvailability(nameToCheck);
      } else {
        setSearchResults(null);
        setErrorMessage(null);
      }
    }, 500),
    [],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\./g, "");
    setValue(newValue);

    if (newValue.trim()) {
      setIsLoading(true);
      if (newValue.length < 3) {
        setErrorMessage("Name is too short. Minimum 3 characters required.");
      } else {
        setErrorMessage(null);
      }
    } else {
      setErrorMessage(null);
    }

    debouncedCheck(newValue);
  };

  const handleResultClick = async () => {
    if (!searchResults) return;
    if (errorMessage) return;

    const nameWithoutSuffix = searchResults.name.replace(".base.eth", "");

    if (nameWithoutSuffix.length < 3) {
      setErrorMessage("Name is too short. Minimum 3 characters required.");
      return;
    }

    console.log("Searching for name:", nameWithoutSuffix);

    if (searchResults.isAvailable) {
      console.log(`Routing to purchase page for: ${nameWithoutSuffix}`);
      router.push(
        `/basename/purchase/${encodeURIComponent(nameWithoutSuffix)}`,
      );
    } else {
      const params = new URLSearchParams();
      if (searchResults.owner) params.append("owner", searchResults.owner);
      if (searchResults.expiry) params.append("expiry", searchResults.expiry);

      const queryString = params.toString();
      router.push(
        `/basename/${encodeURIComponent(nameWithoutSuffix)}${queryString ? "?" + queryString : ""}`,
      );
    }
  };

  const isMobile = windowSize.width < 640;
  const isVerySmall = windowSize.width < 360;

  const baseProfiles: Profile[] = [
    {
      name: "jesse.base.eth",
      position: { top: "15%", left: "10%" },
      imagePath: "/jesse.png",
    },
    {
      name: "defidevrel.base.eth",
      position: { top: "25%", left: "30%" },
      imagePath: "/defidevrel.png",
    },
    {
      name: "eric.base.eth",
      position: { top: "15%", right: "10%" },
      imagePath: "/eric.png",
    },

    {
      name: "techwithmide.base.eth",
      position: { bottom: "25%", left: "30%" },
      imagePath: "/techwithmide.png",
    },
    {
      name: "njoku.base.eth",
      position: { bottom: "15%", left: "10%" },
      imagePath: "/njoku.png",
    },
    {
      name: "dami.base.eth",
      position: { bottom: "15%", right: "10%" },
      imagePath: "/dami.png",
    },
  ];

  const getResponsivePosition = (
    position: Position,
    isMobile: boolean,
    isVerySmall: boolean,
  ): Position => {
    const adjustedPosition = { ...position };

    if (isVerySmall) {
      if (position.top) {
        adjustedPosition.top = `${Math.max(5, parseInt(position.top as string) - 5)}%`;
      }

      if (position.bottom) {
        adjustedPosition.bottom = `${Math.max(5, parseInt(position.bottom as string) - 5)}%`;
      }

      if (position.left === "50%") {
        adjustedPosition.left = "40%";
      }
    } else if (isMobile) {
      if (position.top) {
        adjustedPosition.top = `${parseInt(position.top as string) - 2}%`;
      }

      if (position.bottom) {
        adjustedPosition.bottom = `${parseInt(position.bottom as string) - 2}%`;
      }
    }

    return adjustedPosition;
  };

  return (
    <div className="relative flex items-center justify-center w-full h-[80vh] sm:h-screen overflow-hidden">
      <div className="absolute inset-0">
        {isClientReady &&
          baseProfiles.map((profile, index) => {
            const responsivePosition = getResponsivePosition(
              profile.position,
              isMobile,
              isVerySmall,
            );

            return (
              <div
                key={index}
                className={`absolute p-1 sm:p-2 border-2 border-gray-300 rounded-lg opacity-60 flex items-center shadow-sm ${isVerySmall ? "max-w-[120px]" : "max-w-[180px]"} cursor-pointer transition-all duration-200`}
                style={responsivePosition}
              >
                <div
                  className={`${isVerySmall ? "w-6 h-6" : "w-8 h-8"} rounded-full bg-gray-200 flex items-center justify-center mr-1 sm:mr-2 overflow-hidden`}
                >
                  <Image
                    src={profile.imagePath}
                    alt={`${profile.name} Profile`}
                    width={isVerySmall ? 24 : 32}
                    height={isVerySmall ? 24 : 32}
                    className="object-cover"
                  />
                </div>
                <span
                  className={`text-gray-700 font-medium ${isVerySmall ? "text-xs" : "text-sm"} truncate`}
                >
                  {profile.name}
                </span>
              </div>
            );
          })}
      </div>

      <div className="relative z-10 w-full max-w-[90%] sm:max-w-md px-2 sm:px-6 mt-8 sm:mt-0">
        <div className="relative mt-16 sm:mt-16">
          <div className="absolute -top-6 left-0 text-gray-800 font-semibold">
            <span className="text-xs sm:text-md">🔵 Basenames</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              className="w-full py-1.5 sm:py-3 pr-8 pl-2 sm:pl-4 bg-[transparent] rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
              placeholder="Search for a basename..."
            />
            {value && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs sm:text-sm">
                .base.eth
              </div>
            )}

            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              {isLoading ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  />
                </svg>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="mt-2 text-red-500 text-xs sm:text-sm">
              {errorMessage}
            </div>
          )}

          {searchResults && !errorMessage && (
            <div
              className="mt-3 sm:mt-4 overflow-hidden bg-gray-200 bg-opacity-90 rounded-lg border border-gray-300 shadow-sm cursor-pointer hover:border-blue-500 transition-all duration-200"
              onClick={handleResultClick}
            >
              <div className="flex items-center">
                {/* Name Column */}
                <div className="flex-1 p-2 sm:p-3 truncate">
                  <span className="text-xs sm:text-sm font-medium">
                    {searchResults.name}
                  </span>
                </div>

                {/* Status Column */}
                <div className="flex items-center p-2 sm:p-3 bg-gray-200">
                  {searchResults.isAvailable !== undefined ? (
                    <>
                      <span
                        className={`inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 ${searchResults.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                      ></span>
                      <span className="text-xs sm:text-sm">
                        {searchResults.isAvailable
                          ? "Available"
                          : "Not Available"}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-500">
                      Unknown
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Basenames;
