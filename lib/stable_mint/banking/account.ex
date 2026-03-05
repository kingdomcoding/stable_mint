defmodule StableMint.Banking.Account do
  use Ash.Resource,
    domain: StableMint.Banking,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "accounts"
    repo StableMint.Repo
  end

  json_api do
    type "accounts"
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      public? true
    end

    attribute :type, :atom do
      allow_nil? false
      public? true
      constraints one_of: [:issuer, :customer]
    end

    attribute :status, :atom do
      constraints one_of: [:active, :suspended]
      default :active
      public? true
    end

    attribute :custody_model, :atom do
      allow_nil? false
      public? true
      constraints one_of: [:platform, :self]
    end

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    has_many :addresses, StableMint.Banking.Address
    has_many :fiat_accounts, StableMint.Banking.FiatAccount
  end

  actions do
    defaults [:read]

    create :create do
      accept [:name, :type, :custody_model]
    end

    update :suspend do
      accept []

      validate attribute_equals(:status, :active) do
        message "can only suspend active accounts"
      end

      change set_attribute(:status, :suspended)
    end
  end
end
