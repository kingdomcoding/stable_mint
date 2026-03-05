defmodule StableMint.Changes.RecordLedgerEntries do
  use Ash.Resource.Change

  @reserve_id "00000000-0000-0000-0000-000000000000"

  @impl true
  def init(opts) do
    if opts[:direction] in [:mint, :burn, :transfer] do
      {:ok, opts}
    else
      {:error, "direction must be :mint, :burn, or :transfer"}
    end
  end

  @impl true
  def change(changeset, opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, transfer ->
      {debit_account_id, credit_account_id} =
        case opts[:direction] do
          :mint -> {@reserve_id, resolve_account_id(transfer.destination_id, transfer.destination_type)}
          :burn -> {resolve_account_id(transfer.source_id, transfer.source_type), @reserve_id}
          :transfer -> {resolve_account_id(transfer.source_id, transfer.source_type), resolve_account_id(transfer.destination_id, transfer.destination_type)}
        end

      debit_balance = current_balance(debit_account_id, transfer.currency)
      credit_balance = current_balance(credit_account_id, transfer.currency)

      {:ok, _} =
        StableMint.Platform.LedgerEntry
        |> Ash.Changeset.for_create(:record, %{
          transfer_id: transfer.id,
          account_id: debit_account_id,
          entry_type: :debit,
          amount: transfer.amount,
          currency: transfer.currency,
          balance_after: Decimal.sub(debit_balance, transfer.amount)
        })
        |> Ash.create()

      {:ok, _} =
        StableMint.Platform.LedgerEntry
        |> Ash.Changeset.for_create(:record, %{
          transfer_id: transfer.id,
          account_id: credit_account_id,
          entry_type: :credit,
          amount: transfer.amount,
          currency: transfer.currency,
          balance_after: Decimal.add(credit_balance, transfer.amount)
        })
        |> Ash.create()

      {:ok, transfer}
    end)
  end

  defp current_balance(account_id, currency) do
    case StableMint.Platform.get_balance(account_id, currency) do
      {:ok, [%{balance_after: balance}]} -> balance
      _ -> Decimal.new(0)
    end
  end

  defp resolve_account_id(id, :reserve), do: id
  defp resolve_account_id(address_id, :address) do
    {:ok, address} = StableMint.Banking.get_address(address_id)
    address.account_id
  end
  defp resolve_account_id(id, _), do: id
end
