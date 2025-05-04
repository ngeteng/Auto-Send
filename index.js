// automation_wallet_sepolia.js
// Interactive Automation CLI for Ethereum Sepolia Testnet Wallet (CommonJS)
// Requirements:
//   - Node.js v14+
//   - npm install ethers dotenv prompt-sync node-cron

const { ethers } = require('ethers');
const cron = require('node-cron');
const dotenv = require('dotenv');
const promptSync = require('prompt-sync');

dotenv.config();
const prompt = promptSync({ sigint: true });

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function showBalance() {
  try {
    const balance = await wallet.getBalance();
    console.log(`\n=== Balance ===\n${ethers.utils.formatEther(balance)} ETH\n`);
  } catch (err) {
    console.error('Error fetching balance:', err);
  }
}

async function sendTransactionInteractive() {
  const to = prompt('Enter recipient address: ');
  const amount = prompt('Enter amount (ETH): ');
  try {
    console.log(`Sending ${amount} ETH to ${to}...`);
    const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(amount) });
    console.log('Transaction hash:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed.\n');
  } catch (err) {
    console.error('Error sending transaction:', err);
  }
}

function scheduleCronInteractive() {
  const cronExpr = prompt('Enter cron expression (e.g. 0 * * * *): ');
  const to = prompt('Enter recipient address: ');
  const amount = prompt('Enter amount (ETH): ');
  console.log(`Scheduling send of ${amount} ETH to ${to} at '${cronExpr}'`);
  cron.schedule(cronExpr, async () => {
    try {
      const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(amount) });
      console.log(new Date().toISOString(), 'Sent tx:', tx.hash);
    } catch (err) {
      console.error(new Date().toISOString(), 'Cron send error:', err);
    }
  });
  console.log('Cron job started. Keeping process running...\n');
}

async function main() {
  console.log('Sepolia Wallet Automation (Interactive)');
  while (true) {
    console.log(`
Menu:
1) Check Balance
2) Send ETH
3) Schedule Recurring Send
0) Exit`);
    const choice = prompt('Choose an option: ');
    switch (choice) {
      case '1': await showBalance(); break;
      case '2': await sendTransactionInteractive(); break;
      case '3': scheduleCronInteractive(); break;
      case '0': console.log('Goodbye!'); process.exit(0);
      default: console.log('Invalid choice, please try again.');
    }
  }
}

main();
