// automation_wallet_multinet.js
// Interactive Automation CLI for Ethereum Sepolia, Base Sepolia, BSC Testnet & Arbitrum Sepolia Testnet with Colors & Emojis (ESM - Ethers v6)
// Bulk send feature: reads addresses from addresses.txt and sends specified amount to each
// Requirements:
//   - Node.js v14+
//   - npm install ethers dotenv prompt-sync node-cron chalk fs/promises

import { JsonRpcProvider, Wallet, formatEther, parseEther } from 'ethers';
import cron from 'node-cron';
import dotenv from 'dotenv';
import promptSync from 'prompt-sync';
import chalk from 'chalk';
import { readFile } from 'fs/promises';

dotenv.config();
const prompt = promptSync({ sigint: true });

// Load RPC URLs from environment
const RPC = {
  sepolia: process.env.RPC_URL_SEPOLIA ?? '',
  'base-sepolia': process.env.RPC_URL_BASE_SEPOLIA ?? '',
  'bsc-testnet': process.env.RPC_URL_BSC_TESTNET ?? '',
  'arbitrum-sepolia': process.env.RPC_URL_ARBITRUM_SEPOLIA ?? ''
};

function selectNetwork() {
  console.log(chalk.yellow('\n🌐 Choose Network:'));
  console.log(chalk.cyan('1) Sepolia'));
  console.log(chalk.cyan('2) Base Sepolia'));
  console.log(chalk.cyan('3) BSC Testnet (BNB)'));
  console.log(chalk.cyan('4) Arbitrum Sepolia'));
  const choice = prompt(chalk.magenta('Network (1-4): '));
  switch (choice) {
    case '1': return { name: 'Sepolia', key: 'sepolia' };
    case '2': return { name: 'Base-Sepolia', key: 'base-sepolia' };
    case '3': return { name: 'BSC Testnet', key: 'bsc-testnet' };
    case '4': return { name: 'Arbitrum-Sepolia', key: 'arbitrum-sepolia' };
    default:
      console.log(chalk.red('Invalid choice, defaulting to Sepolia 🔄'));
      return { name: 'Sepolia', key: 'sepolia' };
  }
}

function getProviderAndWallet({ name, key }) {
  const url = RPC[key];
  if (!url.startsWith('http')) {
    console.log(chalk.red(`⚠️  Invalid RPC URL for ${name}: ${url}`));
    process.exit(1);
  }
  // Let Ethers.js auto-detect network (chainId)
  const provider = new JsonRpcProvider(url);
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  return { provider, wallet };
}

async function showBalance() {
  const net = selectNetwork();
  const { provider, wallet } = getProviderAndWallet(net);
  try {
    console.log(chalk.bold(chalk.blue(`\n🔍 Fetching balance on ${net.name}...`)));
    const balance = await provider.getBalance(wallet.address);
    console.log(chalk.green(`💰 Balance on ${net.name}: ${formatEther(balance)}`));
    // Debug: show actual network
    const info = await provider.getNetwork();
    console.log(chalk.blue(`🔗 Connected to chainId ${info.chainId}, name ${info.name}`));
  } catch (err) {
    console.log(chalk.red(`❌ Error fetching balance: ${err.message}`));
  }
}

async function sendTransactionInteractive() {
  const net = selectNetwork();
  const { wallet } = getProviderAndWallet(net);
  const to = prompt(chalk.magenta('➡️  Enter recipient address: '));
  const amount = prompt(chalk.magenta('💵 Enter amount (ETH): '));
  try {
    console.log(chalk.bold(chalk.blue(`\n⏳ Sending ${amount} ETH on ${net.name} to ${to}...`)));
    const tx = await wallet.sendTransaction({ to, value: parseEther(amount) });
    console.log(chalk.green(`✅ Transaction sent. Hash: ${tx.hash}`));
    await tx.wait();
    console.log(chalk.green('✅ Transaction confirmed.'));
  } catch (err) {
    console.log(chalk.red(`❌ Error sending transaction: ${err.message}`));
  }
}

async function bulkSend() {
  const net = selectNetwork();
  const { wallet } = getProviderAndWallet(net);
  const amount = prompt(chalk.magenta('💵 Enter amount (ETH) for each address: '));
  let addresses;
  try {
    const data = await readFile('addresses.txt', 'utf8');
    addresses = data.split(/\r?\n/).filter(Boolean);
  } catch {
    console.log(chalk.red('❌ Gagal membaca addresses.txt')); process.exit(1);
  }
  console.log(chalk.bold(chalk.blue(`\n🔢 Bulk sending ${amount} ETH on ${net.name} to ${addresses.length} addresses...`)));
  for (const to of addresses) {
    try {
      const tx = await wallet.sendTransaction({ to, value: parseEther(amount) });
      console.log(chalk.green(`✅ Sent to ${to}: ${tx.hash}`));
      await tx.wait();
    } catch (err) {
      console.log(chalk.red(`❌ Error to ${to}: ${err.message}`));
    }
  }
  console.log(chalk.green('🚀 Bulk send completed.'));
}

function scheduleCronInteractive() {
  const net = selectNetwork();
  const { wallet } = getProviderAndWallet(net);
  const cronExpr = prompt(chalk.magenta('⏰ Enter cron expression (e.g. 0 * * * *): '));
  const to = prompt(chalk.magenta('➡️  Enter recipient address: '));
  const amount = prompt(chalk.magenta('💵 Enter amount (ETH): '));
  console.log(chalk.bold(chalk.blue(`\n🔄 Scheduling send of ${amount} ETH on ${net.name} to ${to} at '${cronExpr}'`)));
  cron.schedule(cronExpr, async () => {
    try {
      const tx = await wallet.sendTransaction({ to, value: parseEther(amount) });
      console.log(chalk.green(`${new Date().toISOString()} ✅ Sent tx on ${net.name}: ${tx.hash}`));
    } catch (err) {
      console.log(chalk.red(`${new Date().toISOString()} ❌ Cron send error: ${err.message}`));
    }
  });
  console.log(chalk.green('🚀 Cron job started. Keeping process running...'));
}

async function main() {
  console.log(chalk.bold(chalk.blue('🚀 Multi-Net Sepolia Wallet Automation')));
  while (true) {
    console.log(chalk.yellow(`\n📋 Menu:`));
    console.log(chalk.yellow('1) Check Balance'));
    console.log(chalk.yellow('2) Send ETH'));
    console.log(chalk.yellow('3) Bulk Send from addresses.txt'));
    console.log(chalk.yellow('4) Schedule Recurring Send'));
    console.log(chalk.yellow('0) Exit'));
    const choice = prompt(chalk.magenta('Choose an option: '));
    switch (choice) {
      case '1': await showBalance(); break;
      case '2': await sendTransactionInteractive(); break;
      case '3': await bulkSend(); break;
      case '4': scheduleCronInteractive(); break;
      case '0': console.log(chalk.blue('👋 Goodbye!')); process.exit(0);
      default: console.log(chalk.red('❌ Invalid choice, please try again.'));
    }
  }
}

main();
