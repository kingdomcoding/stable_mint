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
      with {:ok, debit_account_id, credit_account_id} <- resolve_accounts(transfer, opts[:direction]),
           {:ok, _} <- create_entry(transfer, debit_account_id, :debit),
           {:ok, _} <- create_entry(transfer, credit_account_id, :credit) do
        {:ok, transfer}
      end
    end)
  end

  defp resolve_accounts(transfer, :mint) do
    with {:ok, credit_id} <- resolve_account_id(transfer.destination_id, transfer.destination_type) do
      {:ok, @reserve_id, credit_id}
    end
  end

  defp resolve_accounts(transfer, :burn) do
    with {:ok, debit_id} <- resolve_account_id(transfer.source_id, transfer.source_type) do
      {:ok, debit_id, @reserve_id}
    end
  end

  defp resolve_accounts(transfer, :transfer) do
    with {:ok, debit_id} <- resolve_account_id(transfer.source_id, transfer.source_type),
         {:ok, credit_id} <- resolve_account_id(transfer.destination_id, transfer.destination_type) do
      {:ok, debit_id, credit_id}
    end
  end

  defp create_entry(transfer, account_id, entry_type) do
    balance = current_balance(account_id, transfer.currency)

    balance_after =
      case entry_type do
        :debit -> Decimal.sub(balance, transfer.amount)
        :credit -> Decimal.add(balance, transfer.amount)
      end

    StableMint.Platform.LedgerEntry
    |> Ash.Changeset.for_create(:record, %{
      transfer_id: transfer.id,
      account_id: account_id,
      entry_type: entry_type,
      amount: transfer.amount,
      currency: transfer.currency,
      balance_after: balance_after
    })
    |> Ash.create()
  end

  defp current_balance(account_id, currency) do
    case StableMint.Platform.get_balance(account_id, currency) do
      {:ok, [%{balance_after: balance}]} -> balance
      _ -> Decimal.new(0)
    end
  end

  defp resolve_account_id(id, :reserve), do: {:ok, id}

  defp resolve_account_id(address_id, :address) do
    case StableMint.Banking.get_address(address_id) do
      {:ok, address} -> {:ok, address.account_id}
      {:error, _} -> {:error, "address #{address_id} not found"}
    end
  end

  defp resolve_account_id(id, _), do: {:ok, id}
end
