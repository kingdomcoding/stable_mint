import type { Transfer } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function TransferTable({
  transfers,
}: {
  transfers: Transfer[];
}) {
  if (transfers.length === 0) {
    return <p className="text-gray-500 text-sm">No transfers yet</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b dark:border-gray-700 text-left">
          <th className="pb-2">Type</th>
          <th className="pb-2">Amount</th>
          <th className="pb-2">Currency</th>
          <th className="pb-2">Status</th>
          <th className="pb-2">TX Hash</th>
          <th className="pb-2">Created</th>
        </tr>
      </thead>
      <tbody>
        {transfers.map((t) => (
          <tr key={t.id} className="border-b dark:border-gray-800">
            <td className="py-2 capitalize">{t.type}</td>
            <td className="py-2 font-mono">{t.amount}</td>
            <td className="py-2">{t.currency}</td>
            <td className="py-2">
              <StatusBadge status={t.status} />
            </td>
            <td className="py-2 font-mono text-xs truncate max-w-[120px]">
              {t.chain_tx_hash || "-"}
            </td>
            <td className="py-2 text-gray-500">
              {new Date(t.inserted_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
