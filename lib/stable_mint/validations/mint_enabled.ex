defmodule StableMint.Validations.MintEnabled do
  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    deployment_id = Ash.Changeset.get_argument(changeset, :deployment_id)

    case StableMint.Stablecoins.get_deployment(deployment_id) do
      {:ok, deployment} ->
        if deployment.mint_enabled do
          :ok
        else
          {:error, Ash.Error.Changes.InvalidAttribute.exception(
            field: :deployment_id, message: "minting is disabled for this deployment"
          )}
        end

      {:error, _} ->
        {:error, Ash.Error.Changes.InvalidAttribute.exception(
          field: :deployment_id, message: "deployment not found"
        )}
    end
  end
end
