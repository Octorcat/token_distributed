import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { ConfigService } from '@nestjs/config';
const bs58 = require("bs58");

interface CsvRow {
  wallet: string;
  amount: string;
}

interface DistributeData {
  wallet: string;
  amount: number;
}

const configService: ConfigService = new ConfigService;
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const FROM_SECRET_KEY_BASE58 = configService.get<string>('PARENT_PRIVATE_KEY'); // Replace with your own secret key in base58 format
const FROM_PRIVATE_KEY = bs58.decode(FROM_SECRET_KEY_BASE58);
const fromKeypair = Keypair.fromSecretKey(FROM_PRIVATE_KEY);

export const tokenDistribute = async () => {
  
  try{
    const results = await processCsv("./src/csv/data.csv");
    const tokenBalance = await getTokenBalance(fromKeypair.publicKey);
    let distributeData: DistributeData[] = [], totalAmount = 0;
    results.forEach(row => {
      if(row.amount.substr(-1) === "%") {
        const amount = parseFloat(row.amount.slice(0, -1)) * (tokenBalance / LAMPORTS_PER_SOL);
        distributeData.push({
          wallet: row.wallet,
          amount: amount
        })
        totalAmount += amount;
      } else{
        distributeData.push({
          wallet: row.wallet,
          amount: parseFloat(row.amount)
        })
        totalAmount += parseFloat(row.amount);
      }
    });

    if(totalAmount > (tokenBalance / LAMPORTS_PER_SOL)) {
      console.log('Your balance is not enough');
      return;
    }

    console.log(distributeData);

    for (const element of distributeData) {
      await sendSol(element.wallet, element.amount);
    }

    console.log(`SOL Balance in parent wallet: ${tokenBalance / LAMPORTS_PER_SOL} SOL`);
  } catch(e) {
    console.log(e);
  }
}
  
const processCsv = (filePath: string): Promise<CsvRow[]> => {
    const results: CsvRow[] = [];
  
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          // Assuming your CSV has columns named "wallet" and "amount"
          const wallet: string = data.wallet;
          const amount: string = data.amount;
  
          // Perform any validation or data transformation as needed
  
          results.push({ wallet, amount });
        })
        .on('end', () => {
            resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
}

const getTokenBalance = async (walletAddress: PublicKey): Promise<number> => {
  // Replace TOKEN_PROGRAM_ID with the actual token program ID
  const balance  = await connection.getBalance(walletAddress);
  return balance;
}

const sendSol = async (walletAddress: string, amount:number) => {
  try {
      // Get your wallet's public key
      const fromPublicKey = fromKeypair.publicKey;

      // Create a PublicKey object for the recipient's wallet address
      const toPublicKey = new PublicKey(walletAddress);

      // Get recent block hash
      const blockhash = await connection.getRecentBlockhash();

      // Create a new transaction
      const transaction = new Transaction().add(
          // Transfer SOL from your wallet to the recipient
          SystemProgram.transfer({
              fromPubkey: fromPublicKey,
              toPubkey: toPublicKey,
              lamports: Math.round(amount) * LAMPORTS_PER_SOL, // Amount in SOL (1 SOL = 1 billion lamports)
          })
      );

      // Sign the transaction with your wallet's keypair
      transaction.recentBlockhash = blockhash.blockhash;
      transaction.sign(fromKeypair);

      // Send the transaction to the Solana network
      const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [fromKeypair], // Specify your wallet's keypair as the signer
          { commitment: 'singleGossip', preflightCommitment: 'singleGossip' }
      );

      console.log(`Transaction successful with signature: ${signature}, Sent ${amount} SOL to ${walletAddress}`);
  } catch (error) {
      console.error(`Transaction failed for ${walletAddress}:`, error);
  }
}