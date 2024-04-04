// src/airdrop.service.ts

import { Injectable } from '@nestjs/common';
import { TokenService } from './token.service'; // Assume you have a TokenService to interact with your token
import * as fs from 'fs';
import * as csv from 'csv-parser';

@Injectable()
export class AirdropService {
  constructor(private readonly tokenService: TokenService) {}

  public async distributeTokens(filePath: string, wallet: string, amount: number | string) {
    const tokenBalance = await this.tokenService.getTokenBalance(wallet);
    let totalAmountToSend: number;

    if (typeof amount === 'number') {
      totalAmountToSend = amount;
    } else if (typeof amount === 'string' && amount.endsWith('%')) {
      const percentage = parseFloat(amount.slice(0, -1)) / 100;
      totalAmountToSend = tokenBalance * percentage;
    } else {
      throw new Error('Invalid amount format');
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row) => {
        const destinationWallet = row.wallet;
        const tokenAmount = parseFloat(row.amount);

        if (isNaN(tokenAmount) || tokenAmount <= 0) {
          console.error(`Invalid token amount for wallet ${destinationWallet}`);
          return;
        }

        if (tokenAmount > totalAmountToSend) {
          console.error(`Not enough tokens to airdrop to ${destinationWallet}`);
          return;
        }

        await this.tokenService.transferTokens(wallet, destinationWallet, tokenAmount);
        totalAmountToSend -= tokenAmount;
        console.log(`Airdropped ${tokenAmount} tokens to ${destinationWallet}`);
      })
      .on('end', () => {
        console.log('Airdrop completed');
      });
  }
}
