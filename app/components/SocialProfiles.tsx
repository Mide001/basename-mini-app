import React from "react";
import Link from "next/link";
import { Twitter, Linkedin, Github, Globe, AtSign } from "lucide-react";

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

interface SocialProfilesProps {
  socialProfiles: SocialProfile[];
}

const getSocialIcon = (source: string) => {
  const iconProps = { size: 18, className: "text-white" };

  switch (source.toLowerCase()) {
    case "twitter":
    case "x":
      return <Twitter {...iconProps} />;
    case "linkedin":
      return <Linkedin {...iconProps} />;
    case "github":
      return <Github {...iconProps} />;
    case "farcaster":
      return <AtSign {...iconProps} />;
    default:
      return <Globe {...iconProps} />;
  }
};

const getSocialBackground = (source: string) => {
  switch (source.toLowerCase()) {
    case "twitter":
    case "x":
      return "bg-blue-400";
    case "linkedin":
      return "bg-blue-700";
    case "github":
      return "bg-gray-800";
    case "farcaster":
      return "bg-purple-500";
    case "basename":
      return "bg-indigo-600";
    default:
      return "bg-gray-600";
  }
};

const SocialProfiles: React.FC<SocialProfilesProps> = ({ socialProfiles }) => {
  const filteredProfiles = socialProfiles.filter((profile) =>
    ["twitter", "x", "linkedin", "github", "farcaster", "basename"].includes(
      profile.source.toLowerCase(),
    ),
  );

  const basenameProfiles = filteredProfiles.filter(
    (profile) => profile.source.toLowerCase() === "basename",
  );

  const nonBasenameProfiles = filteredProfiles.filter(
    (profile) => profile.source.toLowerCase() !== "basename",
  );

  if (filteredProfiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-900 mb-3">
          Connected Profiles
        </h3>

        <div className="space-y-2">
          {nonBasenameProfiles.map((profile, index) => (
            <div key={index} className="group">
              <Link
                href={profile.profile_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-lg mr-3 ${getSocialBackground(profile.source)}`}
                >
                  {getSocialIcon(profile.source)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {profile.display_name || profile.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {profile.source}
                  </p>
                </div>

                <div className="text-gray-400 group-hover:text-gray-600 ml-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </Link>
            </div>
          ))}

          {basenameProfiles.length > 0 && (
            <div className="group">
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-lg mr-3 ${getSocialBackground("basename")}`}
                >
                  {getSocialIcon("basename")}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">Basenames</p>
                  <div className="mt-1 space-y-1">
                    {basenameProfiles.map((profile, i) => (
                      <Link
                        key={i}
                        href={profile.profile_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-gray-500 hover:text-blue-500 truncate"
                      >
                        {`${profile.name}.base.eth`}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialProfiles;
