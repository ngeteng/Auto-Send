// automation_wallet_multinet.js
// Interactive Automation CLI for Ethereum Sepolia & Base Sepolia Testnets (CommonJS - Ethers v6)
// Requirements:
//   - Node.js v14+
//   - npm install ethers dotenv prompt-sync node-cron

const ethers = require('ethers');
const cron = require('node-cron');
const dotenv = require('dotenv');
const promptSync = require('prompt-sync');

dotenv.config();
const prompt = promptSync({ sigint: true });

// Load RPC URLs from environment
const RPC = {
  sepolia: process.env.RPC_URL_SEPOLIA || '',
  'base-sepolia': process.env.RPC_URL_BASE_SEPOLIA || ''
};

function selectNetwork() {
  console.log('\nChoose network:');
  console.log('1) Sepolia');
  console.log('2) Base Sepolia');
  const choice = prompt('Network (1-2): ');
  switch (choice) {
    case '1': return { name: 'sepolia', url: RPC.sepolia, chainId: 11155111 };
    case '2': return { name: 'base-sepolia', url: RPC['base-sepolia'], chainId: 84532 };
    default:
      console.log('Invalid choice, defaulting to Sepolia');
      return { name: 'sepolia', url: RPC.sepolia, chainId: 11155111 };
  }
}

function getProviderAndWallet(network) {
  const provider = new ethers.JsonRpcProvider(network.url, { chainId: network.chainId, name: network.name });
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return { provider, wallet };
}

async function showBalance() {
  const net = selectNetwork();
  const { provider, wallet } = getProviderAndWallet(net);
  try {
    const balance = await provider.getBalance(wallet.address);
    console.log(`\n=== Balance on ${net.name} ===\n${ethers.formatEther(balance)} ETH\n`);
  } catch (err) {
    console.error('Error fetching balance:', err);
  }
}

async function sendTransactionInteractive() {
  const net = selectNetwork();
  const { wallet } = getProviderAndWallet(net);
  const to = prompt('Enter recipient address: ');
  const amount = prompt('Enter amount (ETH): ');
  try {
    console.log(`Sending ${amount} ETH on ${net.name} to ${to}...`);
    const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amount) });
    console.log('Transaction hash:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed.\n');
  } catch (err) {
    console.error('Error sending transaction:', err);
  }
}

function scheduleCronInteractive() {
  const net = selectNetwork();
  const { wallet } = getProviderAndWallet(net);
  const cronExpr = prompt('Enter cron expression (e.g. 0 * * * *): ');
  const to = prompt('Enter recipient address: ');
  const amount = prompt('Enter amount (ETH): ');
  console.log(`Scheduling send of ${amount} ETH on ${net.name} to ${to} at '${cronExpr}'`);
  cron.schedule(cronExpr, async () => {
    try {
      const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amount) });
      console.log(new Date().toISOString(), `Sent tx on ${net.name}:`, tx.hash);
    } catch (err) {
      console.error(new Date().toISOString(), 'Cron send error:', err);
    }
  });
  console.log('Cron job started. Keeping process running...\n');
}

async function main() {
  console.log('Multi-Net Sepolia Wallet Automation (Interactive)');
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
