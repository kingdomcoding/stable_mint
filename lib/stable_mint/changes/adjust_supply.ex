defmodule StableMint.Changes.AdjustSupply do
  use Ash.Resource.Change

  @impl true
  def init(opts) do
    if opts[:direction] in [:mint, :burn] do
      {:ok, opts}
    else
      {:error, "direction must be :mint or :burn"}
    end
  end

  @impl true
  def change(changeset, opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, transfer ->
      {:ok, deployment} = StableMint.Stablecoins.get_deployment(transfer.deployment_id)
      {:ok, stablecoin} = StableMint.Stablecoins.get_stablecoin(deployment.stablecoin_id)

      delta =
        case opts[:direction] do
          :mint -> transfer.amount
          :burn -> Decimal.negate(transfer.amount)
        end

      {:ok, _} = StableMint.Stablecoins.adjust_supply(stablecoin, delta)
      {:ok, transfer}
    end)
  end
end
