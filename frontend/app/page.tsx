"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import { getMerkleProof, isAllowlisted } from "../utils/merkle";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read Contract Data
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalSupply",
    args: [],
    query: { refetchInterval: 3000 }
  });

  const { data: saleState } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "saleState",
    args: [],
    query: { refetchInterval: 3000 }
  });

  // 0 = Paused, 1 = Allowlist, 2 = Public
  const getSaleStatusText = (state: number | undefined) => {
    if (state === 0) return "Paused";
    if (state === 1) return "Allowlist Only";
    if (state === 2) return "Public Sale";
    return "Loading...";
  };

  const handleMint = async () => {
    if (!address) return;

    try {
      if (saleState === 1) { // Allowlist
        const proof = getMerkleProof(address);
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "allowlistMint",
          args: [proof, BigInt(quantity)],
          value: parseEther((0.01 * quantity).toString()),
        });
      } else if (saleState === 2) { // Public
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "publicMint",
          args: [BigInt(quantity)],
          value: parseEther((0.01 * quantity).toString()),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          NFT Launchpad
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div data-testid="connect-wallet-button">
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="relative flex place-items-center flex-col mt-20 gap-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          MyNFT Collection
        </h1>

        <div className="flex flex-col gap-4 items-center bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
          <div className="flex gap-8 text-lg">
            <div className="flex flex-col items-center">
              <span className="text-gray-400">Total Minted</span>
              <span className="font-bold text-2xl" data-testid="mint-count">
                {totalSupply ? totalSupply.toString() : "0"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-400">Max Supply</span>
              <span className="font-bold text-2xl" data-testid="total-supply">10000</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-400">Status</span>
              <span className="font-bold text-2xl text-purple-400" data-testid="sale-status">
                {getSaleStatusText(Number(saleState))}
              </span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-700 my-4" />

          {isConnected ? (
            <div className="flex flex-col gap-4 w-full">
              <div data-testid="connected-address" className="hidden">{address}</div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-400">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  data-testid="quantity-input"
                />
              </div>

              <button
                onClick={handleMint}
                disabled={isConfirming || Number(saleState) === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                data-testid="mint-button"
              >
                {isConfirming ? "Minting..." : "Mint NFT (0.01 ETH)"}
              </button>

              {writeError && (
                <p className="text-red-400 text-xs mt-2 break-all max-w-[300px]">
                  Error: {writeError.message.split('\n')[0]}
                </p>
              )}
              {isConfirmed && (
                <p className="text-green-400 text-sm mt-2">
                  Successfully minted! Transaction Hash: {hash}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Connect your wallet to mint.</p>
          )}
        </div>
      </div>
    </main>
  );
}
