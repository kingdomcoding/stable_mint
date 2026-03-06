export default function BalanceCard({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: string;
  currency: string;
}) {
  return (
    <div className="border rounded px-3 py-1.5 dark:border-gray-700 inline-flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className="font-mono font-semibold">
        {parseFloat(amount).toLocaleString()}
      </span>
      <span className="text-sm text-gray-500">{currency}</span>
    </div>
  );
}
