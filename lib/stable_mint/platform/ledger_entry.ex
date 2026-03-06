defmodule StableMint.Platform.LedgerEntry do
  use Ash.Resource,
    domain: StableMint.Platform,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "ledger_entries"
    repo StableMint.Repo
  end

  json_api do
    type "ledger-entries"
  end

  attributes do
    uuid_primary_key :id

    attribute :entry_type, :atom do
      allow_nil? false
      constraints one_of: [:debit, :credit]
      public? true
    end

    attribute :amount, :decimal, allow_nil?: false, public?: true
    attribute :currency, :string, allow_nil?: false, public?: true
    attribute :balance_after, :decimal, allow_nil?: false, public?: true

    create_timestamp :inserted_at, public?: true
  end

  relationships do
    belongs_to :transfer, StableMint.Platform.Transfer, allow_nil?: false, public?: true
    belongs_to :account, StableMint.Banking.Account, allow_nil?: false, public?: true
  end

  actions do
    defaults [:read]

    create :record do
      accept [:entry_type, :amount, :currency, :balance_after, :transfer_id, :account_id]
    end

    read :by_account do
      argument :account_id, :uuid, allow_nil?: false
      filter expr(account_id == ^arg(:account_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :balance do
      argument :account_id, :uuid, allow_nil?: false
      argument :currency, :string, allow_nil?: false

      filter expr(
        account_id == ^arg(:account_id) and
        currency == ^arg(:currency)
      )

      prepare build(sort: [inserted_at: :desc], limit: 1)
    end

    action :audit, :map do
      run fn _input, _context ->
        import Ecto.Query

        result =
          StableMint.Repo.one(
            from e in "ledger_entries",
              select: %{
                total_debits: sum(fragment("CASE WHEN ? = 'debit' THEN ? ELSE 0 END", e.entry_type, e.amount)),
                total_credits: sum(fragment("CASE WHEN ? = 'credit' THEN ? ELSE 0 END", e.entry_type, e.amount))
              }
          )

        balanced =
          case result do
            %{total_debits: d, total_credits: c} when not is_nil(d) -> Decimal.eq?(d, c)
            _ -> true
          end

        {:ok, %{balanced: balanced, total_debits: result.total_debits, total_credits: result.total_credits}}
      end
    end
  end
end
