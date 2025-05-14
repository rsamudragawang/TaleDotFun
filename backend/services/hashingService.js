/**
 * Service for cryptographic hashing functions.
 */
const { sha256 } = require('@noble/hashes/sha256');
const { bytesToHex } = require('@noble/hashes/utils'); // For converting byte array to hex string

/**
 * Hashes a string using SHA256, suitable for generating PDA seeds from unique IDs.
 * @param {string} inputString - The string to hash (e.g., a UUID design ID).
 * @returns {{hashBytes: Uint8Array, hashHex: string}} - An object containing the 32-byte hash as a Uint8Array and its hex string representation.
 */
function hashDesignId(inputString) {
    if (typeof inputString !== 'string' || inputString.length === 0) {
        throw new Error("Input string cannot be empty for hashing.");
    }
    // Ensure the input is treated as UTF-8 bytes
    const messageBytes = Buffer.from(inputString, 'utf-8');

    // Calculate SHA256 hash
    const hashBytes = sha256(messageBytes); // Returns Uint8Array (32 bytes)

    // Convert bytes to hex string for storage/display if needed
    const hashHex = bytesToHex(hashBytes);

    return {
        hashBytes: hashBytes,
        hashHex: hashHex
    };
}

module.exports = {
    hashDesignId
};