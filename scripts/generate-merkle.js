const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const path = require('path');

function main() {
    const allowlistPath = path.join(__dirname, '../allowlist.json');
    if (!fs.existsSync(allowlistPath)) {
        console.error('allowlist.json not found!');
        process.exit(1);
    }

    const allowlist = JSON.parse(fs.readFileSync(allowlistPath));
    const leaves = allowlist.map(addr => keccak256(addr));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    const root = tree.getHexRoot();
    console.log('Merkle Root:', root);

    // Optional: Output proofs for testing
    // const leaf = keccak256(allowlist[0]);
    // const proof = tree.getHexProof(leaf);
    // console.log('Proof for first address:', proof);
}

main();
