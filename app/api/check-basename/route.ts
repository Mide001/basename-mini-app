// app/api/check-basename/route.ts
import { ethers } from "ethers";
import { NextResponse } from "next/server";

// Add this export to explicitly mark this route as dynamic
export const dynamic = "force-dynamic";

const contractABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function isAvailable(uint256 id) view returns (bool)",
  "function nameExpires(uint256 id) view returns (uint256)",
];

const contractAddress = "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a";

function nameToTokenId(name: string) {
  const labelHash = ethers.keccak256(ethers.toUtf8Bytes(name));
  return labelHash;
}

export async function GET(request: Request) {
  try {
    // Get the name from the URL
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { message: "Name parameter is required" },
        { status: 400 },
      );
    }

    // Connect to the Base blockchain using environment variable
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider,
    );

    // Convert name to token ID
    const tokenId = nameToTokenId(name);

    // Check availability
    const isAvailable = await contract.isAvailable(tokenId);

    // Prepare response data
    const response: {
      isAvailable: boolean;
      owner?: string;
      expiry?: string;
    } = {
      isAvailable,
    };

    // If name is not available, get owner and expiry
    if (!isAvailable) {
      try {
        const owner = await contract.ownerOf(tokenId);
        response.owner = owner;

        const expiryTimestamp = await contract.nameExpires(tokenId);
        const expiryDate = new Date(Number(expiryTimestamp) * 1000);
        response.expiry = expiryDate.toUTCString();
      } catch (error) {
        console.error("Error getting owner or expiry:", error);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking name availability:", error);
    return NextResponse.json(
      { message: "Error checking name availability" },
      { status: 500 },
    );
  }
}
