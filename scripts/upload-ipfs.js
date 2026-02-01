const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    console.error("Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env");
    process.exit(1);
}

async function uploadFolderToIPFS(folderPath) {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const data = new FormData();

    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
        data.append('file', fs.createReadStream(path.join(folderPath, file)), {
            filepath: `basePath/${file}`,
        });
    });

    return axios.post(url, data, {
        maxBodyLength: 'Infinity',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
    });
}

// Example usage
// const main = async () => {
// const imagesHash = await uploadFolderToIPFS('./assets/images');
// console.log(`Images uploaded: ipfs://${imagesHash.data.IpfsHash}`);
// Generate metadata files with this hash...
// const metadataHash = await uploadFolderToIPFS('./assets/metadata');
// console.log(`Metadata uploaded: ipfs://${metadataHash.data.IpfsHash}`);
// };
// main();
