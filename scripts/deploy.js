const hre = require("hardhat");

async function main() {
    const MyNFT = await hre.ethers.getContractFactory("MyNFT");

    // Deploy with arguments: Name, Symbol, Royalty (500 = 5%)
    const myNFT = await MyNFT.deploy("MyNFT Collection", "MNFT", 500);

    await myNFT.waitForDeployment();

    console.log("MyNFT deployed to:", await myNFT.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
