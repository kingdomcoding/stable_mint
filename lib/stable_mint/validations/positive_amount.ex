defmodule StableMint.Validations.PositiveAmount do
  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    amount = Ash.Changeset.get_attribute(changeset, :amount)

    if amount && Decimal.gt?(amount, Decimal.new(0)) do
      :ok
    else
      {:error, Ash.Error.Changes.InvalidAttribute.exception(
        field: :amount, message: "must be greater than zero"
      )}
    end
  end
end
