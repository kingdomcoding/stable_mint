defmodule StableMint.Chains.Processor do
  use GenServer
  require Logger

  defstruct [:chain, :adapter, :pending_txs]

  def start_link(chain) do
    GenServer.start_link(__MODULE__, chain, name: via_tuple(chain))
  end

  def submit(chain, transfer_id) do
    GenServer.cast(via_tuple(chain), {:submit, transfer_id})
  end

  @impl true
  def init(chain) do
    adapter = StableMint.Chains.Registry.adapter_for!(chain)
    Logger.info("Chain processor started for #{chain}")
    schedule_check(adapter.finality_time())
    {:ok, %__MODULE__{chain: chain, adapter: adapter, pending_txs: %{}}}
  end

  @impl true
  def handle_cast({:submit, transfer_id}, state) do
    case StableMint.Platform.get_transfer(transfer_id) do
      {:ok, transfer} ->
        {:ok, deployment} = StableMint.Stablecoins.get_deployment(transfer.deployment_id)

        case submit_to_chain(transfer, deployment, state.adapter) do
          {:ok, tx_hash} ->
            transfer
            |> Ash.Changeset.for_update(:processing, %{chain_tx_hash: tx_hash})
            |> Ash.update!()

            pending = Map.put(state.pending_txs, tx_hash, transfer_id)
            {:noreply, %{state | pending_txs: pending}}

          {:error, reason} ->
            transfer
            |> Ash.Changeset.for_update(:fail, %{error_reason: to_string(reason)})
            |> Ash.update!()

            {:noreply, state}
        end

      _ ->
        Logger.error("Transfer #{transfer_id} not found")
        {:noreply, state}
    end
  end

  @impl true
  def handle_info(:check_confirmations, state) do
    new_pending =
      Enum.reduce(state.pending_txs, state.pending_txs, fn {tx_hash, transfer_id}, acc ->
        case state.adapter.get_transaction_status(tx_hash) do
          {:ok, :confirmed} ->
            {:ok, transfer} = StableMint.Platform.get_transfer(transfer_id)

            transfer
            |> Ash.Changeset.for_update(:finalize, %{})
            |> Ash.update!()

            Map.delete(acc, tx_hash)

          {:ok, :failed} ->
            {:ok, transfer} = StableMint.Platform.get_transfer(transfer_id)

            transfer
            |> Ash.Changeset.for_update(:fail, %{error_reason: "Chain transaction failed"})
            |> Ash.update!()

            Map.delete(acc, tx_hash)

          {:ok, :pending} ->
            acc
        end
      end)

    schedule_check(state.adapter.finality_time())
    {:noreply, %{state | pending_txs: new_pending}}
  end

  defp submit_to_chain(transfer, deployment, adapter) do
    contract = deployment.contract_address

    case transfer.type do
      :mint ->
        {:ok, addr} = StableMint.Banking.get_address(transfer.destination_id)
        adapter.mint(to: addr.address, amount: transfer.amount, token: contract)

      :burn ->
        {:ok, addr} = StableMint.Banking.get_address(transfer.source_id)
        adapter.burn(from: addr.address, amount: transfer.amount, token: contract)

      :transfer ->
        {:ok, from_addr} = StableMint.Banking.get_address(transfer.source_id)
        {:ok, to_addr} = StableMint.Banking.get_address(transfer.destination_id)
        adapter.transfer(from: from_addr.address, to: to_addr.address, amount: transfer.amount, token: contract)
    end
  end

  defp schedule_check(seconds), do: Process.send_after(self(), :check_confirmations, seconds * 1_000)
  defp via_tuple(chain), do: {:via, Registry, {StableMint.Chains.ProcessorRegistry, chain}}
end
