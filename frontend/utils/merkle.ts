import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// In a real app, you might fetch this from an API route to avoid exposing the whole list, 
// or if the list is small, include it. For this assignment, we include it.
import allowlist from '../allowlist.json';

export function getMerkleProof(address: string) {
    const leaves = allowlist.map((x) => keccak256(x));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const leaf = keccak256(address);
    return tree.getHexProof(leaf) as `0x${string}`[];
}

export function isAllowlisted(address: string) {
    // Simple check, though proof verification on chain is what matters
    return allowlist.map(a => a.toLowerCase()).includes(address.toLowerCase());
}
