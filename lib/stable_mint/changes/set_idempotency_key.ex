defmodule StableMint.Changes.SetIdempotencyKey do
  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    key = Ash.Changeset.get_argument(changeset, :idempotency_key)
    Ash.Changeset.force_change_attribute(changeset, :idempotency_key, key)
  end
end
