import jwt from 'jsonwebtoken';
import { getAddress, recoverMessageAddress } from 'viem';
import { LoginRequest, LoginResponse, JwtPayload, MeResponse } from '../types/auth.types';
import { AppError } from '../api/middlewares/errorHandler';
import { hasBalanceSecret, hasTxSecret } from './secret.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

/** Normalize signature to 65-byte (r,s,v) hex. Handles 64-byte EIP-2098 compact from some wallets. */
function normalizeSignature(sig: string): `0x${string}` {
  const raw = typeof sig !== 'string' ? '' : sig.trim();
  const hex = raw.startsWith('0x') ? raw.slice(2) : raw;
  if (hex.length === 130) return raw as `0x${string}`;
  if (hex.length !== 128) return raw as `0x${string}`;
  const r = hex.slice(0, 64);
  const sCompact = BigInt('0x' + hex.slice(64, 128));
  const yParity = Number((sCompact >> 255n) & 1n);
  const s = (sCompact & ((1n << 255n) - 1n)).toString(16).padStart(64, '0');
  const v = (27 + yParity).toString(16).padStart(2, '0');
  return (`0x${r}${s}${v}`) as `0x${string}`;
}

export class AuthService {
  generateMessage(address: string): string {
    const checksummedAddress = getAddress(address);
    const timestamp = Date.now();
    return `Login Void Wallet Timestamp:${timestamp}`;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const address = request?.address;
    const message = typeof request?.message === 'string' ? request.message.trim() : '';
    const signature = request?.signature;

    if (!address || !message || !signature) {
      throw new AppError('Missing address, message, or signature', 400);
    }

    try {
      const expectedAddress = getAddress(address);
      const sigHex = normalizeSignature(signature);

      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: sigHex,
      });

      if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new AppError('Signature does not match address', 401);
      }

      const payload: JwtPayload = { wallet: expectedAddress };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

      return { token, wallet: expectedAddress };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Login verification error:', error);
      throw new AppError('Signature verification failed', 401);
    }
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  async getMe(wallet: string): Promise<MeResponse> {
    const required_secrets: string[] = [];

    const hasBalance = await hasBalanceSecret(wallet);
    const hasTx = await hasTxSecret(wallet);

    if (!hasBalance) {
      required_secrets.push('balance');
    }
    if (!hasTx) {
      required_secrets.push('transaction');
    }

    return { wallet, required_secrets };
  }
}
