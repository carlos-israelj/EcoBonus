import { create } from 'ipfs-http-client';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

class IPFSService {
  constructor() {
    const auth = process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET
      ? 'Basic ' + Buffer.from(
          process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
        ).toString('base64')
      : undefined;

    this.client = create({
      host: process.env.IPFS_HOST || 'ipfs.infura.io',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'https',
      headers: auth ? { authorization: auth } : undefined,
    });
  }

  /**
   * Upload image to IPFS
   */
  async uploadImage(buffer, filename) {
    try {
      const result = await this.client.add({
        path: filename,
        content: buffer,
      });

      const ipfsUri = `ipfs://${result.cid}`;
      logger.info(`Image uploaded to IPFS: ${ipfsUri}`);

      return {
        cid: result.cid.toString(),
        uri: ipfsUri,
        url: `https://ipfs.io/ipfs/${result.cid}`,
      };
    } catch (error) {
      logger.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images and create proof metadata
   */
  async uploadProofBundle(images, metadata) {
    try {
      const uploadedImages = [];

      // Upload each image
      for (const [index, image] of images.entries()) {
        const result = await this.uploadImage(
          image.buffer,
          `evidence_${index}_${Date.now()}.jpg`
        );
        uploadedImages.push(result);
      }

      // Create metadata JSON
      const proofMetadata = {
        ...metadata,
        evidence: uploadedImages,
        timestamp: new Date().toISOString(),
      };

      // Upload metadata
      const metadataResult = await this.client.add(
        JSON.stringify(proofMetadata, null, 2)
      );

      return {
        metadataCid: metadataResult.cid.toString(),
        metadataUri: `ipfs://${metadataResult.cid}`,
        images: uploadedImages,
      };
    } catch (error) {
      logger.error('Error uploading proof bundle:', error);
      throw error;
    }
  }

  /**
   * Retrieve content from IPFS
   */
  async getContent(cid) {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error(`Error retrieving content from IPFS (${cid}):`, error);
      throw error;
    }
  }

  /**
   * Get JSON metadata from IPFS
   */
  async getMetadata(cid) {
    try {
      const content = await this.getContent(cid);
      return JSON.parse(content.toString());
    } catch (error) {
      logger.error(`Error parsing metadata from IPFS (${cid}):`, error);
      throw error;
    }
  }
}

export default new IPFSService();
