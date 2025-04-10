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
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Handle window resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      handleResize(); // Set initial size

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Check name availability function
  const checkNameAvailability = async (name: string) => {
    if (!name) {
      setSearchResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/check-basename?name=${name}`);
      if (!response.ok) {
        throw new Error("Failed to check name availability");
      }
      const data = await response.json();
      setSearchResults({
        name: `${name}.base.eth`,
        isAvailable: data.isAvailable,
      });
    } catch (error) {
      console.error("Error checking name availability:", error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a debounced version of checkNameAvailability
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheck = useCallback(
    debounce((name: string) => {
      if (name.trim()) {
        const nameToCheck = name.trim().toLowerCase().replace(".base.eth", "");
        checkNameAvailability(nameToCheck);
      } else {
        setSearchResults(null);
      }
    }, 500),
    [],
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (newValue.trim()) {
      setIsLoading(true);
    }
    debouncedCheck(newValue);
  };

// Handle clicking on a search result
const handleResultClick = () => {
    if (!searchResults) return;
  
    const nameWithoutSuffix = searchResults.name.replace(".base.eth", "");
    
    console.log("Searching for name:", nameWithoutSuffix);
    
    if (searchResults.isAvailable) {
      // Make sure to use the correct path format
      console.log(`Routing to purchase page for: ${nameWithoutSuffix}`);
      router.push(`/basename/purchase/${encodeURIComponent(nameWithoutSuffix)}`);
    } else {
      // Route to details page if unavailable
      router.push(`/basename/${encodeURIComponent(nameWithoutSuffix)}`);
    }
  };

  // Handle clicking on a profile
  const handleProfileClick = (name: string) => {
    const nameWithoutSuffix = name.replace(".base.eth", "");
    router.push(`/basename/${nameWithoutSuffix}`);
  };

  // Adjust base profile positions based on screen size
  const getResponsivePosition = (
    position: Position,
    isMobile: boolean,
    isVerySmall: boolean,
  ): Position => {
    // For very small screens, adjust more dramatically
    if (isVerySmall) {
      if (position.top) {
        return { ...position, top: `${parseInt(position.top) - 5}%` };
      }
      if (position.bottom) {
        return { ...position, bottom: `${parseInt(position.bottom) - 5}%` };
      }
      return position;
    }

    // For regular mobile screens
    if (isMobile) {
      if (position.right === "35%") {
        return { ...position, right: "20%" };
      }
      if (position.left === "40%") {
        return { ...position, left: "30%" };
      }
    }

    return position;
  };

  // Sample base names with predefined positions
  const baseProfiles: Profile[] = [
    {
      name: "jesse.base.eth",
      position: { top: "30%", right: "35%" },
      imagePath: "/jesse.png",
    },
    {
      name: "dami.base.eth",
      position: { top: "40%", left: "0%" },
      imagePath: "/dami.png",
    },
    {
      name: "eric.base.eth",
      position: { top: "40%", right: "0%" },
      imagePath: "/eric.png",
    },
    {
      name: "techwithmide.base.eth",
      position: { bottom: "30%", left: "0%" },
      imagePath: "/techwithmide.png",
    },
    {
      name: "njoku.base.eth",
      position: { bottom: "30%", right: "0%" },
      imagePath: "/njoku.png",
    },
    {
      name: "defidevrel.base.eth",
      position: { bottom: "25%", left: "40%" },
      imagePath: "/defidevrel.png",
    },
  ];

  const isMobile = windowSize.width < 640;
  const isVerySmall = windowSize.width < 360;

  return (
    <div className="relative flex items-center justify-center w-full h-[70vh] sm:h-screen overflow-hidden">
      {/* Background base names with profile images */}
      <div className="absolute inset-0">
        {baseProfiles.map((profile, index) => {
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
              onClick={() => handleProfileClick(profile.name)}
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

      {/* Content container */}
      <div className="relative z-10 w-full max-w-[90%] sm:max-w-md px-2 sm:px-6">
        <div className="relative mt-16 sm:mt-16">
          {/* Title positioned at the top left of the input */}
          <div className="absolute -top-6 left-0 text-gray-800 font-semibold">
            <span className="text-xs sm:text-md">🔵 Basenames</span>
          </div>

          {/* Wrapper for input and icon */}
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              className="w-full py-1.5 sm:py-3 pr-8 pl-2 sm:pl-4 bg-[transparent] rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
              placeholder="Search for a basename..."
            />

            {/* Search Icon/Loading Indicator */}
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

          {/* Clickable Search Results */}
          {searchResults && (
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
