defmodule StableMint.Platform.Transfer do
  use Ash.Resource,
    domain: StableMint.Platform,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "transfers"
    repo StableMint.Repo
  end

  json_api do
    type "transfers"
  end

  attributes do
    uuid_primary_key :id

    attribute :idempotency_key, :string, allow_nil?: false, public?: true

    attribute :type, :atom do
      allow_nil? false
      public? true
      constraints one_of: [:mint, :burn, :transfer]
    end

    attribute :status, :atom do
      public? true
      constraints one_of: [:pending, :processing, :complete, :failed]
      default :pending
    end

    attribute :amount, :decimal, allow_nil?: false, public?: true
    attribute :currency, :string, allow_nil?: false, public?: true

    attribute :source_type, :atom do
      public? true
      constraints one_of: [:address, :fiat_account, :reserve]
    end

    attribute :source_id, :uuid, public?: true

    attribute :destination_type, :atom do
      public? true
      constraints one_of: [:address, :fiat_account, :reserve]
    end

    attribute :destination_id, :uuid, public?: true

    attribute :chain_tx_hash, :string, public?: true
    attribute :error_reason, :string, public?: true

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    belongs_to :deployment, StableMint.Stablecoins.Deployment do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_idempotency_key, [:idempotency_key]
  end

  actions do
    defaults [:read]

    create :mint do
      accept [:amount, :currency]

      argument :deployment_id, :uuid, allow_nil?: false, public?: true
      argument :destination_address_id, :uuid, allow_nil?: false, public?: true
      argument :idempotency_key, :string, allow_nil?: false, public?: true

      change set_attribute(:type, :mint)
      change set_attribute(:source_type, :reserve)
      change set_attribute(:source_id, &StableMint.Platform.Transfer.reserve_account_id/0)
      change set_attribute(:destination_type, :address)
      change {StableMint.Changes.ResolveDestination, []}
      change {StableMint.Changes.SetIdempotencyKey, []}

      validate {StableMint.Validations.MintEnabled, []}
      validate {StableMint.Validations.PositiveAmount, []}

      change {StableMint.Changes.RecordLedgerEntries, direction: :mint}
      change {StableMint.Changes.AdjustSupply, direction: :mint}
      change {StableMint.Changes.DispatchToChain, []}
    end

    create :burn do
      accept [:amount, :currency]

      argument :deployment_id, :uuid, allow_nil?: false, public?: true
      argument :source_address_id, :uuid, allow_nil?: false, public?: true
      argument :idempotency_key, :string, allow_nil?: false, public?: true

      change set_attribute(:type, :burn)
      change set_attribute(:destination_type, :reserve)
      change set_attribute(:destination_id, &StableMint.Platform.Transfer.reserve_account_id/0)
      change set_attribute(:source_type, :address)
      change {StableMint.Changes.ResolveSource, []}
      change {StableMint.Changes.SetIdempotencyKey, []}

      validate {StableMint.Validations.BurnEnabled, []}
      validate {StableMint.Validations.PositiveAmount, []}
      validate {StableMint.Validations.SufficientBalance, []}, only_when_valid?: true

      change {StableMint.Changes.RecordLedgerEntries, direction: :burn}
      change {StableMint.Changes.AdjustSupply, direction: :burn}
      change {StableMint.Changes.DispatchToChain, []}
    end

    create :transfer do
      accept [:amount, :currency]

      argument :deployment_id, :uuid, allow_nil?: false, public?: true
      argument :source_address_id, :uuid, allow_nil?: false, public?: true
      argument :destination_address_id, :uuid, allow_nil?: false, public?: true
      argument :idempotency_key, :string, allow_nil?: false, public?: true

      change set_attribute(:type, :transfer)
      change set_attribute(:source_type, :address)
      change set_attribute(:destination_type, :address)
      change {StableMint.Changes.ResolveSource, []}
      change {StableMint.Changes.ResolveDestination, []}
      change {StableMint.Changes.SetIdempotencyKey, []}

      validate {StableMint.Validations.PositiveAmount, []}
      validate {StableMint.Validations.SufficientBalance, []}, only_when_valid?: true

      change {StableMint.Changes.RecordLedgerEntries, direction: :transfer}
      change {StableMint.Changes.DispatchToChain, []}
    end

    update :processing do
      accept []
      require_atomic? false
      argument :chain_tx_hash, :string, allow_nil?: false

      change fn changeset, _context ->
        hash = Ash.Changeset.get_argument(changeset, :chain_tx_hash)
        Ash.Changeset.force_change_attribute(changeset, :chain_tx_hash, hash)
      end

      change set_attribute(:status, :processing)
    end

    update :finalize do
      accept []

      validate attribute_equals(:status, :processing) do
        message "can only finalize processing transfers"
      end

      change set_attribute(:status, :complete)
    end

    update :fail do
      accept []
      require_atomic? false
      argument :error_reason, :string, allow_nil?: false

      change fn changeset, _context ->
        reason = Ash.Changeset.get_argument(changeset, :error_reason)
        Ash.Changeset.force_change_attribute(changeset, :error_reason, reason)
      end

      change set_attribute(:status, :failed)
    end

    read :by_account do
      argument :account_id, :uuid, allow_nil?: false, public?: true

      filter expr(
        source_id == ^arg(:account_id) or
        destination_id == ^arg(:account_id)
      )

      prepare build(sort: [inserted_at: :desc])
    end
  end

  def reserve_account_id, do: "00000000-0000-0000-0000-000000000000"
end
