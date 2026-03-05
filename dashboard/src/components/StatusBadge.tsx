import type { TransferStatus } from "@/lib/types";

const statusColors: Record<TransferStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function StatusBadge({ status }: { status: TransferStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[status]}`}>
      {status}
    </span>
  );
}
