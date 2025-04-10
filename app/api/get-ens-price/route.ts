// app/api/get-ens-price/route.ts
import { ethers } from "ethers";
import { NextResponse } from "next/server";

// Add this export to explicitly mark this route as dynamic
export const dynamic = "force-dynamic";

// ENS Registrar Contract ABI - just the rentPrice function
const registrarABI = [
  "function rentPrice(string memory name, uint256 duration) external view returns (uint256)",
];

// Use the registrar address you provided
const registrarAddress = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
export async function GET(request: Request) {
  try {
    // Get the name and years from the URL
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const years = searchParams.get("years");

    console.log("API received name:", name);
    console.log("API received years:", years);

    if (!name || !years) {
      return NextResponse.json(
        { message: "Name and years parameters are required" },
        { status: 400 },
      );
    }

    // Convert years to seconds for the contract call
    const duration = parseInt(years) * 365 * 24 * 60 * 60;

    // Connect to the Base blockchain using environment variable
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

    // Create contract instance
    const contract = new ethers.Contract(
      registrarAddress,
      registrarABI,
      provider,
    );

    // Call the contract to get the price
    const priceWei = await contract.rentPrice(name, duration);

    // Convert price from wei to ETH
    const priceETH = ethers.formatEther(priceWei);

    // Prepare response data
    const response = {
      name,
      years: parseInt(years),
      priceETH,
      priceWei: priceWei.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting ENS price:", error);
    return NextResponse.json(
      { message: "Error getting ENS price" },
      { status: 500 },
    );
  }
}
