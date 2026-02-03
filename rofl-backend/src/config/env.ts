import { config } from 'dotenv';

config();

// Environment variables
export const env = {
    // Server
    PORT: parseInt(process.env.PORT || '3000', 10),
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    DB_PATH: process.env.DB_PATH || './data',
    IS_TEE: process.env.IS_TEE || 'false',
    // Alchemy Webhook
    ALCHEMY_SIGNING_KEY: process.env.ALCHEMY_SIGNING_KEY || '',
    VOID_CONTRACT_ADDRESS: process.env.VOID_CONTRACT_ADDRESS || '0x4aE649044CC818A00fA20266aE5d5b77E79089C3',
    // Optional: Base Sepolia RPC (Alchemy/Infura). Enables balance backfill and avoids public RPC 503.
    BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL || '',
} as const;