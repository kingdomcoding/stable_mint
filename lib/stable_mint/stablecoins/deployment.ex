defmodule StableMint.Stablecoins.Deployment do
  use Ash.Resource,
    domain: StableMint.Stablecoins,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "deployments"
    repo StableMint.Repo
  end

  json_api do
    type "deployments"
  end

  attributes do
    uuid_primary_key :id

    attribute :chain, :atom do
      allow_nil? false
      public? true
      constraints one_of: [:ethereum, :solana, :stellar]
    end

    attribute :contract_address, :string, public?: true

    attribute :status, :atom do
      constraints one_of: [:active, :paused]
      default :active
      public? true
    end

    attribute :mint_enabled, :boolean, default: true, public?: true
    attribute :burn_enabled, :boolean, default: true, public?: true

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    belongs_to :stablecoin, StableMint.Stablecoins.Stablecoin do
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :unique_chain_per_stablecoin, [:stablecoin_id, :chain]
  end

  actions do
    defaults [:read]

    create :deploy do
      accept [:chain, :stablecoin_id]

      change fn changeset, _context ->

        chain = Ash.Changeset.get_attribute(changeset, :chain)
        addr = StableMint.Chains.Registry.generate_mock_contract(chain)
        Ash.Changeset.force_change_attribute(changeset, :contract_address, addr)
      end
    end

    read :by_chain do
      argument :chain, :atom, allow_nil?: false
      filter expr(chain == ^arg(:chain))
    end
  end
end
