defmodule StableMint.Banking.Address do
  use Ash.Resource,
    domain: StableMint.Banking,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "addresses"
    repo StableMint.Repo
  end

  json_api do
    type "addresses"
  end

  attributes do
    uuid_primary_key :id

    attribute :chain, :atom do
      allow_nil? false
      public? true
      constraints one_of: [:ethereum, :solana, :stellar]
    end

    attribute :address, :string do
      allow_nil? false
      public? true
    end

    attribute :label, :string, public?: true

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    belongs_to :account, StableMint.Banking.Account do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_address_per_chain, [:chain, :address]
  end

  actions do
    defaults [:read]

    create :create do
      accept [:chain, :address, :label, :account_id]

      validate {StableMint.Validations.ValidChainAddress, []} do
        message "address format is invalid for the specified chain"
      end
    end

    read :by_account do
      argument :account_id, :uuid, allow_nil?: false
      filter expr(account_id == ^arg(:account_id))
    end
  end
end
