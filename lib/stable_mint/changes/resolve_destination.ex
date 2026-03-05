defmodule StableMint.Changes.ResolveDestination do
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    address_id = Ash.Changeset.get_argument(changeset, :destination_address_id)
    deployment_id = Ash.Changeset.get_argument(changeset, :deployment_id)

    changeset
    |> Ash.Changeset.force_change_attribute(:destination_id, address_id)
    |> Ash.Changeset.force_change_attribute(:deployment_id, deployment_id)
  end
end
