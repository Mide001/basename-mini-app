"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  ConnectWallet,
  ConnectWalletText,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  EthBalance,
  Address,
  Avatar,
} from "@coinbase/onchainkit/identity";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { keccak256, stringToBytes, concat } from "viem";
import { parseEther } from "viem";
import { encodeFunctionData } from "viem";
import { namehash } from "@/lib/utils";

// Smart contract ABI (partial, just for the register function)
const contractAbi = [
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "owner", type: "address" },
          { name: "duration", type: "uint256" },
          { name: "resolver", type: "address" },
          { name: "data", type: "bytes[]" },
          { name: "reverseRecord", type: "bool" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "registerPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const CONTRACT_ADDRESS = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";

interface PriceData {
  name: string;
  years: number;
  priceETH: string;
  priceWei: string;
}

const BasenamePurchasePage = ({ params }: { params: { name: string } }) => {
  const rawName = params?.name || "example";
  const name = decodeURIComponent(rawName);
  const baseName = name; // This is the name without .base.eth

  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<string>("idle"); // "idle", "pending", "success", "error"
  const [txHash, setTxHash] = useState<`0x${string}` | "">("");
  const [years, setYears] = useState<number>(1);
  const [priceData, setPriceData] = useState({
    price: "0.000",
    pricePerYear: "0.000",
    ethToUsdRate: 0,
    isLoading: true,
  });

  // Contract write hook with data for transaction hash
  const {
    writeContract,
    data: writeData,
    isPending,
    isError: isWriteError,
  } = useWriteContract();

  // Watch for the writeData change (transaction hash)
  React.useEffect(() => {
    if (writeData) {
      setTxHash(writeData);
    }
  }, [writeData]);

  // Transaction receipt hook
  const {
    // Remove unused variables from destructuring
    isSuccess: isConfirmed,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash ? txHash : undefined,
  });

  // Convert years to seconds for contract
  const durationInSeconds = years * 365 * 24 * 60 * 60;

  const { data: priceFromContract, isLoading: isPriceLoading } =
    useReadContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: contractAbi,
      functionName: "registerPrice",
      args: [baseName, BigInt(durationInSeconds)],
    });

  // Use the price from contract if available
  React.useEffect(() => {
    if (priceFromContract) {
      const ethPrice = (Number(priceFromContract) / 1e18).toFixed(3);
      setPriceData((prev) => ({
        ...prev,
        price: ethPrice,
        pricePerYear: (Number(ethPrice) / years).toFixed(3),
        isLoading: false,
      }));
    }
  }, [priceFromContract, years]);

  // Fetch price data
  const fetchPriceData = useCallback(async () => {
    if (!name) return;

    setPriceData((prev) => ({ ...prev, isLoading: true }));

    try {
      const encodedName = encodeURIComponent(name);
      const response = await fetch(
        `/api/get-ens-price?name=${encodedName}&years=${years}`,
      );

      if (!response.ok) {
        throw new Error("Price fetch failed");
      }

      const data: PriceData = await response.json();
      const price = data.priceETH;
      const pricePerYear = (parseFloat(price) / years).toFixed(3);

      // Fetch ETH price if needed
      let ethToUsdRate = priceData.ethToUsdRate;
      if (ethToUsdRate === 0) {
        try {
          const rateResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
          );
          const rateData = await rateResponse.json();
          ethToUsdRate = rateData.ethereum.usd;
        } catch (error) {
          console.error("Failed to fetch ETH price:", error);
          ethToUsdRate = 3000; // Fallback
        }
      }

      setPriceData({
        price,
        pricePerYear,
        ethToUsdRate,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch price:", error);
      // Fallback to mock price calculation
      const price = (0.01 * years).toFixed(3);
      setPriceData({
        price,
        pricePerYear: (0.01).toFixed(3),
        ethToUsdRate: priceData.ethToUsdRate,
        isLoading: false,
      });
    }
  }, [name, years, priceData.ethToUsdRate]);

  // Initial price fetch
  React.useEffect(() => {
    fetchPriceData();
  }, [fetchPriceData]);

  const getHardcodedResolverData = (
    nameNode: string,
    ownerAddress: string,
  ): `0x${string}`[] => {
    // Root node for Base ENS
    const rootNode =
      "0xff1e3c0eb00ec714e34b6114125fbde1dea2f24a72fbf672e7b7fd5690328e10" as `0x${string}`;

    try {
      // Calculate the label (node without the root prefix)
      const label = keccak256(stringToBytes(baseName));
      const nodehash = keccak256(concat([rootNode, label]));

      console.log("Label:", label);
      console.log("Nodehash:", nodehash);

      // Encode the setAddr function call
      const setAddrData = encodeFunctionData({
        abi: [
          {
            name: "setAddr",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "node", type: "bytes32" },
              { name: "a", type: "address" },
            ],
            outputs: [],
          },
        ],
        functionName: "setAddr",
        args: [nodehash, ownerAddress as `0x${string}`],
      });

      console.log("Generated resolver data:", setAddrData);
      return [setAddrData];
    } catch (error) {
      console.error("Error generating resolver data:", error);
      // Return empty array as fallback
      return [];
    }
  };

  const handleRegister = async () => {
    if (!address || !baseName) return;

    try {
      setTxStatus("pending");

      // Get properly formatted resolver data
      const resolverData = getHardcodedResolverData(baseName, address);

      console.log("Resolver data:", resolverData);

      // Create register request
      const registerRequest = {
        name: baseName,
        owner: address,
        duration: BigInt(durationInSeconds),
        resolver: "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD",
        data: resolverData,
        reverseRecord: true, // Keep this true to set as primary name
      };

      console.log("Register request:", {
        name: registerRequest.name,
        owner: registerRequest.owner,
        duration: registerRequest.duration.toString(),
        resolver: registerRequest.resolver,
        dataLength: registerRequest.data.length,
      });

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "register",
        args: [registerRequest],
        value: parseEther(priceData.price),
      });
    } catch (error) {
      console.error("Registration failed:", error);
      let errorMessage: string;
      if (error && typeof error === "object") {
        errorMessage =
          (error as { message?: string }).message || JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      console.log("Detailed error:", errorMessage);
      setTxStatus("error");
    }
  };

  // Reset transaction state
  const resetTransaction = () => {
    setTxStatus("idle");
    setTxHash("");
  };

  // Update status based on transaction state
  React.useEffect(() => {
    if (isPending) {
      setTxStatus("pending");
    } else if (isConfirmed) {
      setTxStatus("success");
    } else if (isWriteError || isReceiptError) {
      setTxStatus("error");
    }
  }, [isPending, isConfirmed, isWriteError, isReceiptError]);

  // Helper function to convert ETH to USD
  const convertEthToUsd = useCallback(
    (ethAmount: string): string => {
      if (!ethAmount || !priceData.ethToUsdRate) return "0.00";
      const ethValue = parseFloat(ethAmount);
      const usdValue = ethValue * priceData.ethToUsdRate;
      return usdValue.toFixed(2);
    },
    [priceData.ethToUsdRate],
  );

  const incrementYears = useCallback(() => {
    if (years < 10) {
      setYears((prev) => {
        const newYears = prev + 1;
        // Defer price fetch to next render cycle
        setTimeout(() => fetchPriceData(), 0);
        return newYears;
      });
    }
  }, [years, fetchPriceData]);

  const decrementYears = useCallback(() => {
    if (years > 1) {
      setYears((prev) => {
        const newYears = prev - 1;
        // Defer price fetch to next render cycle
        setTimeout(() => fetchPriceData(), 0);
        return newYears;
      });
    }
  }, [years, fetchPriceData]);

  function WalletControl() {
    return (
      <Wallet className="[&>div:nth-child(2)]:!opacity-20 md:[&>div:nth-child(2)]:!opacity-100">
        <ConnectWallet
          className={`w-3 h-3 sm:w-4 sm:h-4 ${address ? "bg-red-500" : "bg-green-500"} hover:bg-gray-400 cursor-pointer select-none transition-all duration-150 min-w-6 sm:min-w-8`}
        >
          <ConnectWalletText>{""}</ConnectWalletText>
        </ConnectWallet>
        <WalletDropdown>
          <Identity
            className="px-3 pt-2 pb-1 sm:px-4 sm:pt-3 sm:pb-2"
            hasCopyAddressOnClick
          >
            <Avatar />
            <Name />
            <Address />
            <EthBalance />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    );
  }

  // Render transaction status message
  const renderTransactionStatus = () => {
    if (txStatus === "idle") return null;

    if (txStatus === "pending") {
      return (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center">
          Transaction in progress... Please wait.
        </div>
      );
    }

    if (txStatus === "success") {
      return (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-center text-sm">
          <p>
            Success!{" "}
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              tx
            </a>
          </p>
          <button
            onClick={resetTransaction}
            className="block mx-auto mt-2 underline"
          >
            Close
          </button>
        </div>
      );
    }

    if (txStatus === "error") {
      return (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center">
          <p>Transaction failed. Please try again.</p>
          <button
            onClick={resetTransaction}
            className="block mx-auto mt-2 text-sm underline"
          >
            Close
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full flex justify-end mb-2 xs:mb-3 sm:mb-4">
        <div className="flex items-center justify-center bg-black text-white rounded-lg px-1.5 py-0.5 sm:px-2 md:px-3 sm:py-1 md:py-2 transition-colors cursor-pointer">
          <WalletControl />
          <span className="ml-1 sm:ml-2 text-xs">
            {address ? "LOGOUT" : "LOGIN"}
          </span>
        </div>
      </div>
      <div className="max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        {/* Back button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="flex items-center text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
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
            Find another name
          </Link>
        </div>

        {/* Simple Basename Display with Large Text */}
        <div className="w-full mb-6 sm:mb-8 md:mb-10">
          <div className="w-full py-4 sm:py-6 md:py-8 bg-[#3333ff] rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-blue-400">
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-center px-2 sm:px-4 break-words">
              {name}.base.eth
            </h1>
          </div>
        </div>

        {/* Purchase Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
              Claim Your Basename
            </h2>

            {/* Duration Selector */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Registration Period
              </label>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <button
                  onClick={decrementYears}
                  disabled={years <= 1}
                  className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                    years <= 1
                      ? "text-gray-300 cursor-not-allowed bg-gray-100"
                      : "text-white bg-blue-500 hover:bg-blue-600"
                  }`}
                  type="button"
                >
                  <span className="text-lg sm:text-xl font-bold">-</span>
                </button>

                <div className="text-center">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                    {years} {years === 1 ? "Year" : "Years"}
                  </span>
                </div>

                <button
                  onClick={incrementYears}
                  disabled={years >= 10}
                  className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                    years >= 10
                      ? "text-gray-300 cursor-not-allowed bg-gray-100"
                      : "text-white bg-blue-500 hover:bg-blue-600"
                  }`}
                  type="button"
                >
                  <span className="text-lg sm:text-xl font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Pricing Details with Blur Effect */}
            <div className="mb-6 sm:mb-8">
              <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Base Price:
                </span>
                <div
                  className={`transition-all duration-300 ${priceData.isLoading ? "blur-sm" : ""}`}
                >
                  <span className="text-xs sm:text-sm text-gray-800 font-medium">
                    {priceData.pricePerYear} ETH
                    {priceData.pricePerYear && priceData.ethToUsdRate > 0 && (
                      <span className="text-2xs sm:text-xs text-gray-500 ml-1">
                        (${convertEthToUsd(priceData.pricePerYear)})/
                      </span>
                    )}
                    <span className="text-2xs sm:text-xs text-gray-600 ml-1">
                      year
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Duration:
                </span>
                <span className="text-xs sm:text-sm text-gray-800 font-medium">
                  {years} {years === 1 ? "year" : "years"}
                </span>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <div
                    className={`transition-all duration-300 ${priceData.isLoading ? "blur-sm" : ""}`}
                  >
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-black">
                      {parseFloat(priceData.price).toFixed(3)} ETH
                      {priceData.price && priceData.ethToUsdRate > 0 && (
                        <span className="text-xs sm:text-sm md:text-base text-black ml-1 font-normal">
                          (${convertEthToUsd(priceData.price)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={address ? handleRegister : undefined}
              disabled={
                priceData.isLoading || !address || txStatus === "pending"
              }
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-500 text-white py-3 sm:py-3 px-3 sm:px-4 rounded-full shadow transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
              type="button"
            >
              {isPending ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="text-sm sm:text-base">
                  {address ? "Register Name" : "Login"}
                </span>
              )}
            </button>

            {/* Transaction Status Message */}
            {renderTransactionStatus()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasenamePurchasePage;
