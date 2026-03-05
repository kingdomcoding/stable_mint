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
    <div className="border rounded-lg p-4 dark:border-gray-700">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold font-mono">
        {parseFloat(amount).toLocaleString()} <span className="text-sm text-gray-500">{currency}</span>
      </p>
    </div>
  );
}
