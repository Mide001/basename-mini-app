import { keccak256, toHex, stringToBytes } from "viem";

// Namehash function to calculate ENS node
export function namehash(name: string): `0x${string}` {
  let node =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

  if (name) {
    const labels = name.split(".");
    for (let i = labels.length - 1; i >= 0; i--) {
      const labelHash = keccak256(stringToBytes(labels[i]));
      node = keccak256(hexConcat([toHex(node), toHex(labelHash)]));
    }
  }

  return node;
}

// Helper function to concatenate hex strings
function hexConcat(parts: string[]): `0x${string}` {
  let result = "0x";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].startsWith("0x") ? parts[i].slice(2) : parts[i];
    result += part;
  }
  return result as `0x${string}`;
}
