import { ethers } from "ethers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const registrarABI = [
  "function rentPrice(string memory name, uint256 duration) external view returns (uint256)",
];

const registrarAddress = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
export async function GET(request: Request) {
  try {
    // Get the name and years from the URL
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const years = searchParams.get("years");

    if (!name || !years) {
      return NextResponse.json(
        { message: "Name and years parameters are required" },
        { status: 400 },
      );
    }

    const duration = parseInt(years) * 365 * 24 * 60 * 60;

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

    const contract = new ethers.Contract(
      registrarAddress,
      registrarABI,
      provider,
    );

    const priceWei = await contract.rentPrice(name, duration);

    const priceETH = ethers.formatEther(priceWei);

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
