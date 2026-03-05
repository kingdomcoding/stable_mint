const chainColors: Record<string, string> = {
  ethereum: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  solana: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  stellar: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export default function ChainBadge({ chain }: { chain: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs capitalize ${
        chainColors[chain] || "bg-gray-100 text-gray-800"
      }`}
    >
      {chain}
    </span>
  );
}
