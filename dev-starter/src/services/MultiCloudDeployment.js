const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BlobServiceClient } = require('@azure/storage-blob');
const { Storage } = require('@google-cloud/storage');

class MultiCloudDeployment {
    constructor(config) {
        this.config = config;
        this.awsClient = new S3Client({ region: config.aws.region });
        this.azureClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
        this.gcpClient = new Storage({ keyFilename: config.gcp.keyFilename });
    }

    async deploy(deployment) {
        const { provider, bucket, filePath, fileContent } = deployment;

        switch (provider) {
            case 'aws':
                return this.deployToAWS(bucket, filePath, fileContent);
            case 'azure':
                return this.deployToAzure(bucket, filePath, fileContent);
            case 'gcp':
                return this.deployToGCP(bucket, filePath, fileContent);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async deployToAWS(bucket, key, body) {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        });

        try {
            const response = await this.awsClient.send(command);
            return { provider: 'aws', response };
        } catch (error) {
            console.error('Error deploying to AWS:', error);
            throw error;
        }
    }

    async deployToAzure(containerName, blobName, content) {
        try {
            const containerClient = this.azureClient.getContainerClient(containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const response = await blockBlobClient.upload(content, content.length);
            return { provider: 'azure', response };
        } catch (error) {
            console.error('Error deploying to Azure:', error);
            throw error;
        }
    }

    async deployToGCP(bucketName, fileName, contents) {
        try {
            await this.gcpClient.bucket(bucketName).file(fileName).save(contents);
            return { provider: 'gcp', response: { success: true } };
        } catch (error) {
            console.error('Error deploying to GCP:', error);
            throw error;
        }
    }
}

module.exports = MultiCloudDeployment;