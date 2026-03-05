defmodule StableMint.Stablecoins.Stablecoin do
  use Ash.Resource,
    domain: StableMint.Stablecoins,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "stablecoins"
    repo StableMint.Repo
  end

  json_api do
    type "stablecoins"
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      public? true
      constraints min_length: 1, max_length: 100
    end

    attribute :symbol, :string do
      allow_nil? false
      public? true
      constraints min_length: 1, max_length: 10
    end

    attribute :decimals, :integer do
      default 6
      public? true
      constraints min: 0, max: 18
    end

    attribute :status, :atom do
      constraints one_of: [:active, :paused, :decommissioned]
      default :active
      public? true
    end

    attribute :total_supply, :decimal do
      default Decimal.new(0)
      allow_nil? false
    end

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    has_many :deployments, StableMint.Stablecoins.Deployment
  end

  identities do
    identity :unique_symbol, [:symbol]
  end

  actions do
    defaults [:read]

    create :create do
      accept [:name, :symbol, :decimals]

      validate match(:symbol, ~r/^[A-Z][A-Z0-9]{1,9}$/) do
        message "must be uppercase alphanumeric, 2-10 characters"
      end
    end

    update :pause do
      accept []

      validate attribute_equals(:status, :active) do
        message "can only pause active stablecoins"
      end

      change set_attribute(:status, :paused)
    end

    update :adjust_supply do
      accept []
      require_atomic? false
      argument :delta, :decimal, allow_nil?: false

      change fn changeset, _context ->
        delta = Ash.Changeset.get_argument(changeset, :delta)
        current = changeset.data.total_supply
        Ash.Changeset.force_change_attribute(changeset, :total_supply, Decimal.add(current, delta))
      end
    end
  end
end
