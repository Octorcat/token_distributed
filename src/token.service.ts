// src/token.service.ts

import { Injectable } from '@nestjs/common';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'; // Assuming you're using the Solana JavaScript SDK
const splToken = require('@solana/spl-token');

@Injectable()
export class TokenService {
  constructor(private readonly connection: Connection) {}

  async getTokenBalance(walletAddress: string): Promise<number> {
    const publicKey = new PublicKey(walletAddress);
    // Replace TOKEN_PROGRAM_ID with the actual token program ID
    const tokenAccountInfo = await this.connection.getTokenAccountBalance(publicKey);
    return tokenAccountInfo.value.uiAmount;
  }

  async transferTokens(sender: string, recipient: string, amount: number): Promise<void> {
    // Replace TOKEN_PROGRAM_ID with the actual token program ID
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    // Replace YOUR_TOKEN_ACCOUNT_ADDRESS with the sender's token account address
    const senderPublicKey = new PublicKey(sender);
    // Replace RECIPIENT_TOKEN_ACCOUNT_ADDRESS with the recipient's token account address
    const recipientPublicKey = new PublicKey(recipient);

    const transaction = new Transaction().add(
      // Construct a transfer instruction to send tokens from sender to recipient
      splToken.Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        senderPublicKey,
        recipientPublicKey,
        senderPublicKey, // Owner public key
        [], // Token program's associated token accounts
        amount // Amount of tokens to send
      )
    );

    // Sign and send the transaction
    await this.connection.sendTransaction(transaction, [], { preflightCommitment: 'singleGossip' });
  }
}
