export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "saleState",
        "outputs": [{ "internalType": "enum MyNFT.SaleState", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "quantity", "type": "uint256" }],
        "name": "publicMint",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32[]", "name": "merkleProof", "type": "bytes32[]" },
            { "internalType": "uint256", "name": "quantity", "type": "uint256" }
        ],
        "name": "allowlistMint",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;
