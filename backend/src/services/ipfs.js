const axios = require('axios');
const FormData = require('form-data');

/**
 * Upload a file buffer to IPFS via Pinata.
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - Name for the file
 * @returns {Promise<{ipfsHash: string, pinataUrl: string}>}
 */
async function uploadToIPFS(fileBuffer, fileName) {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (!apiKey || !secretKey || apiKey === 'your_pinata_api_key') {
        // Demo mode: return a placeholder hash
        console.log('⚠️ Pinata not configured, returning placeholder IPFS hash');
        return {
            ipfsHash: `Qm${Date.now().toString(36)}placeholder${Math.random().toString(36).slice(2, 10)}`,
            pinataUrl: 'https://gateway.pinata.cloud/ipfs/placeholder',
        };
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });

    const metadata = JSON.stringify({ name: fileName });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
            maxBodyLength: Infinity,
            headers: {
                ...formData.getHeaders(),
                pinata_api_key: apiKey,
                pinata_secret_api_key: secretKey,
            },
        }
    );

    return {
        ipfsHash: response.data.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
    };
}

module.exports = { uploadToIPFS };
