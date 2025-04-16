"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Globe,
  AtSign,
  Facebook,
  Twitch,
  Youtube,
  Figma,
  Dribbble,
  Slack,
  User,
  Share2,
  X,
} from "lucide-react";
import AlertModal from "@/app/components/AlertModal";
import { useMiniKit, useAddFrame } from "@coinbase/onchainkit/minikit";
import SocialProfiles from "../../components/SocialProfiles";

type RequestBody = {
  expiryDate: string;
  token: string;
  url: string;
  enabled: boolean;
  baseName: string;
};

type OwnerDetails = {
  address: string;
  expiryDate: string;
};

type SocialProfile = {
  follower_count: string;
  following_count: string;
  location: string;
  owner: string;
  bio: string;
  display_name: string;
  image_url: string;
  name: string;
  owned_since: string;
  profile_url: string;
  source: string;
};

// Function to determine which icon to use based on social platform
const getSocialIcon = (source: string) => {
  const iconProps = { size: 14, className: "text-gray-600" };

  switch (source.toLowerCase()) {
    case "twitter":
    case "x":
      return <Twitter {...iconProps} />;
    case "instagram":
      return <Instagram {...iconProps} />;
    case "linkedin":
      return <Linkedin {...iconProps} />;
    case "github":
      return <Github {...iconProps} />;
    case "facebook":
      return <Facebook {...iconProps} />;
    case "twitch":
      return <Twitch {...iconProps} />;
    case "youtube":
      return <Youtube {...iconProps} />;
    case "figma":
      return <Figma {...iconProps} />;
    case "dribbble":
      return <Dribbble {...iconProps} />;
    case "slack":
      return <Slack {...iconProps} />;
    case "lens":
      return <AtSign {...iconProps} />;
    default:
      return <Globe {...iconProps} />;
  }
};

const BasenameDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const name = (params?.names as string) || "";
  const ownerAddress = searchParams.get("owner");
  const expiryDateStr = searchParams.get("expiry");

  const [loading, setLoading] = useState(true);
  const [ownerDetails, setOwnerDetails] = useState<OwnerDetails | null>(null);
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [alertResponse, setAlertResponse] = useState<{
    message: string;
    success: boolean;
  } | null>(null);
  const [alertEnabled, setAlertEnabled] = useState<boolean>(false);
  const [isCheckingAlert, setIsCheckingAlert] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { context } = useMiniKit();
  const addFrame = useAddFrame();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!name) return;

      try {
        setLoading(true);
        setError(null);

        if (ownerAddress) {
          let formattedExpiryDate = new Date().toISOString();
          if (expiryDateStr) {
            formattedExpiryDate = new Date(expiryDateStr).toISOString();
          }

          setOwnerDetails({
            address: ownerAddress,
            expiryDate: formattedExpiryDate,
          });

          await fetchSocialProfiles(ownerAddress);

          setLoading(false);
        } else {
          const response = await fetch(`/api/check-basename?name=${name}`);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          if (data.isAvailable) {
            setError("This basename is available for registration");
            setLoading(false);
            return;
          }

          if (data.owner) {
            // Set owner details from API
            const expiryDate = data.expiry
              ? new Date(data.expiry).toISOString()
              : new Date().toISOString();

            setOwnerDetails({
              address: data.owner,
              expiryDate: expiryDate,
            });

            // Fetch social profiles
            await fetchSocialProfiles(data.owner);
          } else {
            throw new Error("Owner not found");
          }

          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Error fetching basename details:", err);

        if (err instanceof Error) {
          setError(`Failed to load basename details: ${err.message}`);
        } else {
          setError("Failed to load basename details: Unknown error occurred");
        }

        setLoading(false);
      }
    };

    if (name) {
      fetchDetails();
    } else {
      setLoading(false);
      setError("No basename specified");
    }
  }, [name, ownerAddress, expiryDateStr]);

  useEffect(() => {
    const checkExistingAlert = async () => {
      if (!context?.user?.fid || !name) return;

      setIsCheckingAlert(true);
      try {
        const response = await fetch(`/api/alert/status?baseName=${name}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Farcaster-FID": context.user.fid.toString(),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAlertEnabled(data.enabled || false);
        } else {
          const errorData = await response.json();
          console.error("Alert status error:", errorData);
        }
      } catch (error) {
        console.error("Failed to fetch alert status:", error);
      } finally {
        setIsCheckingAlert(false);
      }
    };

    if (context?.user?.fid && name) {
      checkExistingAlert();
    } else {
      setIsCheckingAlert(false);
    }
  }, [context?.user?.fid, name]);

  const fetchSocialProfiles = async (ownerAddress: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TALENT_PROTOCOL_API_KEY;

      if (!apiKey) {
        console.warn("Talent Protocol API key is not set");
        return;
      }

      // Use the resolved owner address
      const response = await fetch(
        `https://api.talentprotocol.com/socials?id=${ownerAddress}&account_source=wallet`,
        {
          method: "GET",
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setSocialProfiles(data.socials || []);
    } catch (apiError) {
      console.error("Error fetching social profiles:", apiError);
    }
  };

  // Share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${name}.base.eth Alert Set`,
          text: `I'm tracking ${name}.base.eth using BasenameTracker!`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          alert("Link copied to clipboard!");
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const mainProfile = socialProfiles.find(
    (profile) =>
      profile.source === "lens" ||
      profile.owner?.toLowerCase() === ownerDetails?.address?.toLowerCase(),
  );

  // Check if the name is already registered based on error state
  const isNameRegistered =
    !error ||
    (!error.includes("available") && !error.includes("not registered"));

  const handleToggleAlert = async () => {
    setAlertResponse(null);

    if (!context?.user?.fid) {
      setAlertResponse({
        message: "❌ Please connect your Farcaster account first",
        success: false,
      });
      setIsModalOpen(true);
      return;
    }

    try {
      const enabledStatus = !alertEnabled;

      const requestBody: RequestBody = {
        enabled: enabledStatus,
        token: "",
        url: "",
        baseName: name,
        expiryDate:
          ownerDetails?.expiryDate?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
      };

      if (enabledStatus) {
        const result = await addFrame();
        console.log("Result Frame: ", result);
        if (!result) {
          setAlertResponse({
            message: "❌ Frame access was denied. Alert can't be enabled.",
            success: false,
          });
          setIsModalOpen(true);
          return;
        }

        requestBody.token = result.token;
        requestBody.url = result.url;
      }

      // Make the API call with the proper header
      const response = await fetch("/api/alert/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Farcaster-FID": context.user.fid.toString(),
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      // Update UI based on response
      setAlertResponse({
        message: result.success
          ? enabledStatus
            ? "✅ Alert successfully set for this basename!"
            : "✅ Alert successfully disabled for this basename."
          : `❌ Error managing alert: ${result.error || "Unknown error"}`,
        success: result.success,
      });

      if (result.success) {
        setAlertEnabled(enabledStatus);
      }

      setIsModalOpen(true);
    } catch (err) {
      console.error("Error setting alert:", err);
      setAlertResponse({
        message: "❌ Error setting alert: Network or server issue",
        success: false,
      });
      setIsModalOpen(true);
    }
  };

  const renderAlertButton = () => {
    if (isCheckingAlert) {
      return (
        <button
          className="w-full bg-gray-300 text-white py-2 px-3 rounded-md cursor-not-allowed flex items-center justify-center text-sm"
          disabled
        >
          <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
          Checking alert status...
        </button>
      );
    }

    if (alertEnabled) {
      return (
        <button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
          onClick={handleToggleAlert}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Disable Expiry Alert
        </button>
      );
    }

    return (
      <button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
        onClick={handleToggleAlert}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
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
        Set Expiry Alert
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3">
      <div className="mx-auto bg-white rounded-xl overflow-hidden max-w-full">
        <div className="p-3 border-b border-gray-200">
          <Link
            href="/"
            className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
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
            Back
          </Link>
        </div>

        {loading ? (
          <div className="p-4 flex justify-center">
            <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : error && !isNameRegistered ? (
          <div className="p-4 text-center">
            <h2 className="mt-1 text-lg font-bold text-gray-900 break-words">
              {name}.base.eth
            </h2>
            <p className="mt-3 text-green-500 font-medium text-sm">{error}</p>
            <button className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors duration-200 text-sm w-full">
              Register this name
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="uppercase tracking-wide text-xs text-indigo-500 font-semibold">
              Basename Details
            </div>
            <h2 className="mt-1 text-lg font-bold text-gray-900 break-words">
              {name}.base.eth
            </h2>
            <p className="mt-1 text-xs text-red-500">
              This basename is already registered
            </p>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900">
                Owner Information
              </h3>
              <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                    {mainProfile?.image_url ? (
                      <Image
                        src={mainProfile.image_url}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {mainProfile?.display_name ||
                        truncateAddress(ownerDetails?.address || "")}
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

                {mainProfile && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    {mainProfile.bio && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-700 line-clamp-3">
                          {mainProfile.bio}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {mainProfile.follower_count && (
                        <div>
                          <span className="font-medium">
                            {mainProfile.follower_count}
                          </span>{" "}
                          followers
                        </div>
                      )}
                      {mainProfile.following_count && (
                        <div>
                          <span className="font-medium">
                            {mainProfile.following_count}
                          </span>{" "}
                          following
                        </div>
                      )}
                      {mainProfile.location && (
                        <div className="flex items-center">
                          <svg
                            className="h-3 w-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="truncate">
                            {mainProfile.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {mainProfile.profile_url && (
                      <div className="mt-2">
                        <a
                          href={mainProfile.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
                        >
                          <span className="mr-1">
                            View on {mainProfile.source}
                          </span>
                          {getSocialIcon(mainProfile.source)}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3">
                  <dt className="text-xs font-medium text-gray-500">
                    Expires On
                  </dt>
                  <dd className="mt-1 text-xs text-gray-900">
                    {formatDate(ownerDetails?.expiryDate || "")}
                  </dd>
                </div>
              </div>
            </div>

            {socialProfiles.length > 1 && (
              <div className="mt-4">
                <SocialProfiles socialProfiles={socialProfiles} />
              </div>
            )}

            <div className="mt-4">
              {alertEnabled && (
                <div className="mb-3 p-2 rounded-md text-center text-sm bg-blue-100 text-blue-800">
                  <p>🔔 You will be notified before this ENS name expires</p>
                </div>
              )}

              {renderAlertButton()}
            </div>
          </div>
        )}

        <AlertModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          message={alertResponse?.message || ""}
          success={alertResponse?.success || false}
          onShare={handleShare}
        />
      </div>
    </div>
  );
};

export default BasenameDetailsPage;
