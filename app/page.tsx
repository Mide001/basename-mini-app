"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import { Name, Identity, Badge } from "@coinbase/onchainkit/identity";
import { useCallback, useEffect, useMemo, useState } from "react";
import Basenames from "./components/basenames";
import { useAccount } from "wagmi";
import Check from "./svg/Check";

const SCHEMA_UID =
  "0x7889a09fb295b0a0c63a3d7903c4f00f7896cca4fa64d2c1313f8547390b7d39";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const { address } = useAccount();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame, setFrameAdded]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <button
          type="button"
          onClick={handleAddFrame}
          className="cursor-pointer bg-transparent font-semibold text-xs sm:text-sm"
        >
          + SAVE FRAME
        </button>
      );
    }
    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-xs sm:text-sm font-semibold animate-fade-out">
          <Check />
          <span>SAVED</span>
        </div>
      );
    }
    return null;
  }, [context, handleAddFrame, frameAdded]);

  return (
    <div className="flex flex-col min-h-screen sm:min-h-[820px] font-sans bg-[#E5E5E5] text-black items-center snake-dark relative">
      <div className="w-full max-w-[520px] px-2 sm:px-0">
        <header className="mr-2 mt-1 flex justify-between items-center">
          <div className="justify-start pl-1">
            {address ? (
              <Identity
                address={address}
                schemaId={SCHEMA_UID}
                className="!bg-inherit p-0 [&>div]:space-x-1 sm:[&>div]:space-x-2 text-xs sm:text-sm"
              >
                <Name className="text-inherit">
                  <Badge
                    tooltip="High Scorer"
                    className="!bg-inherit high-score-badge"
                  />
                </Name>
              </Identity>
            ) : (
              <div className="pl-1 sm:pl-2 pt-1 text-gray-500 text-xs sm:text-sm font-semibold">
                NOT CONNECTED
              </div>
            )}
          </div>
          <div className="pr-1 justify-end">{saveFrameButton}</div>
        </header>
        <main className="font-serif">
          <Basenames />
        </main>
        <footer className="absolute bottom-2 sm:bottom-4 flex items-center w-full justify-center px-2">
          <button
            type="button"
            className="py-1 px-2 flex justify-start rounded-2xl font-semibold opacity-40 border border-black text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            BUILT ON BASE WITH MINIKIT
          </button>
        </footer>
      </div>
    </div>
  );
}
