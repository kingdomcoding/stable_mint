defmodule StableMint.Validations.SufficientBalance do
  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    source_id = Ash.Changeset.get_argument(changeset, :source_address_id)
    amount = Ash.Changeset.get_attribute(changeset, :amount)
    currency = Ash.Changeset.get_attribute(changeset, :currency)

    {:ok, address} = StableMint.Banking.get_address(source_id)

    balance =
      case StableMint.Platform.get_balance(address.account_id, currency) do
        {:ok, [%{balance_after: b}]} -> b
        _ -> Decimal.new(0)
      end

    if Decimal.gte?(balance, amount) do
      :ok
    else
      {:error, Ash.Error.Changes.InvalidAttribute.exception(
        field: :amount, message: "insufficient balance (have: #{balance}, need: #{amount})"
      )}
    end
  end
end
