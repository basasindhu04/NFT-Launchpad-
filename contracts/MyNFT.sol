// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981, Ownable {
    using Strings for uint256;

    enum SaleState { Paused, Allowlist, Public }

    SaleState public saleState = SaleState.Paused;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public price = 0.01 ether;
    uint256 public maxPerWallet = 5;
    
    bytes32 public merkleRoot;
    string public baseURI;
    string public revealedURI;
    bool public isRevealed = false;

    constructor(string memory _name, string memory _symbol, uint96 _royaltyFeeNumerator) 
        ERC721(_name, _symbol) 
        Ownable(msg.sender)
    {
        _setDefaultRoyalty(msg.sender, _royaltyFeeNumerator); // e.g., 500 = 5%
    }

    // --- Modifiers ---
    modifier mintCompliance(uint256 quantity) {
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply exceeded");
        require(quantity > 0, "Mint quantity must be greater than 0");
        require(msg.value >= price * quantity, "Insufficient ETH sent");
        _;
    }

    // --- Minting Functions ---

    function allowlistMint(bytes32[] calldata merkleProof, uint256 quantity) 
        external 
        payable 
        mintCompliance(quantity) 
    {
        require(saleState == SaleState.Allowlist, "Allowlist sale is not active");
        require(balanceOf(msg.sender) + quantity <= maxPerWallet, "Max per wallet exceeded");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid Merkle Proof");

        _mintLoop(msg.sender, quantity);
    }

    function publicMint(uint256 quantity) 
        external 
        payable 
        mintCompliance(quantity) 
    {
        require(saleState == SaleState.Public, "Public sale is not active");
        require(balanceOf(msg.sender) + quantity <= maxPerWallet, "Max per wallet exceeded");

        _mintLoop(msg.sender, quantity);
    }

    function _mintLoop(address to, uint256 quantity) internal {
        for (uint256 i = 0; i < quantity; i++) {
            uint256 newItemId = totalSupply() + 1; // Enumerable is 1-indexed count basically, but let's use +1 for IDs if we want 1-based
             // Actually Enumerable totalSupply() returns count. If we start at 0, next is totalSupply(). If we want ID 1 to 10000:
             // Let's use 1-based indexing.
            _safeMint(to, newItemId);
        }
    }

    // --- Admin Functions ---

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setSaleState(SaleState _saleState) external onlyOwner {
        saleState = _saleState;
    }

    function setPrice(uint256 _price) external onlyOwner {
        price = _price;
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setRevealedURI(string memory _revealedURI) external onlyOwner {
        revealedURI = _revealedURI;
    }

    function reveal() external onlyOwner {
        isRevealed = true;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // --- View Functions & Overrides ---

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        _requireOwned(tokenId); // Check existence

        if (!isRevealed) {
             return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
        }
        
        return bytes(revealedURI).length > 0 ? string(abi.encodePacked(revealedURI, tokenId.toString(), ".json")) : "";
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
