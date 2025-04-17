import { formatUnits, parseUnits } from 'viem';

export function formatAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

export function parseAmount(amount: string, decimals: number): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDuration(durationInSeconds: number): string {
  const days = Math.floor(durationInSeconds / (24 * 60 * 60));
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  return `${days} day${days === 1 ? '' : 's'}`;
}

export function calculateTimeLeft(endTimestamp: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const difference = endTimestamp - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (60 * 60 * 24)),
    hours: Math.floor((difference % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((difference % (60 * 60)) / 60),
    seconds: Math.floor(difference % 60),
  };
}

export function formatTimeLeft(timeLeft: ReturnType<typeof calculateTimeLeft>): string {
  const { days, hours, minutes } = timeLeft;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export const TOKENS = {
  ETH: {
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  DAI: {
    symbol: 'DAI',
    decimals: 18,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
}; 