defmodule StableMint.Validations.ValidChainAddress do
  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    chain = Ash.Changeset.get_attribute(changeset, :chain)
    address = Ash.Changeset.get_attribute(changeset, :address)

    case StableMint.Chains.Registry.get_adapter(Atom.to_string(chain)) do
      {:ok, adapter} -> adapter.validate_address(address)
      :error ->
        {:error, Ash.Error.Changes.InvalidAttribute.exception(
          field: :chain, message: "unsupported chain"
        )}
    end
  end
end
