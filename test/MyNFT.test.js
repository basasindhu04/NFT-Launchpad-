const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("MyNFT", function () {
    let MyNFT, myNFT, owner, addr1, addr2, addrs;
    let merkleTree, root;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Setup Merkle Tree
        const allowlist = [owner.address, addr1.address];
        const leafNodes = allowlist.map(addr => keccak256(addr));
        merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
        root = merkleTree.getHexRoot();

        MyNFT = await ethers.getContractFactory("MyNFT");
        myNFT = await MyNFT.deploy("MyNFT Collection", "NFT", 500);
        await myNFT.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await myNFT.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await myNFT.name()).to.equal("MyNFT Collection");
            expect(await myNFT.symbol()).to.equal("NFT");
        });

        it("Should be paused initially", async function () {
            expect(await myNFT.saleState()).to.equal(0); // 0 = Paused
        });
    });

    describe("Allowlist Minting", function () {
        it("Should allow allowlisted users to mint", async function () {
            await myNFT.setMerkleRoot(root);
            await myNFT.setSaleState(1); // Allowlist

            const leaf = keccak256(addr1.address);
            const proof = merkleTree.getHexProof(leaf);

            await myNFT.connect(addr1).allowlistMint(proof, 1, { value: ethers.parseEther("0.01") });
            expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
        });

        it("Should fail for non-allowlisted users", async function () {
            await myNFT.setMerkleRoot(root);
            await myNFT.setSaleState(1);

            const leaf = keccak256(addr2.address);
            const proof = merkleTree.getHexProof(leaf); // Invalid proof for addr2 (or valid but not in tree)

            await expect(
                myNFT.connect(addr2).allowlistMint(proof, 1, { value: ethers.parseEther("0.01") })
            ).to.be.revertedWith("Invalid Merkle Proof");
        });
    });

    describe("Public Minting", function () {
        it("Should allow public minting when active", async function () {
            await myNFT.setSaleState(2); // Public
            await myNFT.connect(addr2).publicMint(1, { value: ethers.parseEther("0.01") });
            expect(await myNFT.balanceOf(addr2.address)).to.equal(1);
        });

        it("Should fail if sale is not public", async function () {
            await myNFT.setSaleState(0); // Paused
            await expect(
                myNFT.connect(addr2).publicMint(1, { value: ethers.parseEther("0.01") })
            ).to.be.revertedWith("Public sale is not active");
        });
    });

    describe("Reveal", function () {
        it("Should return baseURI before reveal", async function () {
            await myNFT.setBaseURI("ipfs://hidden/");
            await myNFT.setSaleState(2);
            await myNFT.connect(addr1).publicMint(1, { value: ethers.parseEther("0.01") });

            expect(await myNFT.tokenURI(1)).to.equal("ipfs://hidden/1.json");
        });

        it("Should return revealedURI after reveal", async function () {
            await myNFT.setBaseURI("ipfs://hidden/");
            await myNFT.setRevealedURI("ipfs://revealed/");
            await myNFT.setSaleState(2);
            await myNFT.connect(addr1).publicMint(1, { value: ethers.parseEther("0.01") });

            await myNFT.reveal();
            expect(await myNFT.tokenURI(1)).to.equal("ipfs://revealed/1.json");
        });
    });

    describe("Withdrawal", function () {
        it("Should allow owner to withdraw", async function () {
            await myNFT.setSaleState(2);
            await myNFT.connect(addr1).publicMint(1, { value: ethers.parseEther("0.01") });

            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

            await myNFT.withdraw();

            const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
            expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
        });
    });
});
