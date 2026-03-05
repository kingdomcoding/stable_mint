defmodule StableMint.Validations.BurnEnabled do
  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    deployment_id = Ash.Changeset.get_argument(changeset, :deployment_id)
    {:ok, deployment} = StableMint.Stablecoins.get_deployment(deployment_id)

    if deployment.burn_enabled do
      :ok
    else
      {:error, Ash.Error.Changes.InvalidAttribute.exception(
        field: :deployment_id, message: "burning is disabled for this deployment"
      )}
    end
  end
end
