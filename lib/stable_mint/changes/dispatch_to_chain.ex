defmodule StableMint.Changes.DispatchToChain do
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_transaction(changeset, fn
      _changeset, {:ok, transfer} ->
        {:ok, deployment} = StableMint.Stablecoins.get_deployment(transfer.deployment_id)
        chain = Atom.to_string(deployment.chain)
        StableMint.Chains.Processor.submit(chain, transfer.id)
        {:ok, transfer}

      _changeset, {:error, error} ->
        {:error, error}
    end)
  end
end
