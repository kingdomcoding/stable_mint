defmodule StableMint.Banking.FiatAccount do
  use Ash.Resource,
    domain: StableMint.Banking,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshJsonApi.Resource]

  postgres do
    table "fiat_accounts"
    repo StableMint.Repo
  end

  json_api do
    type "fiat-accounts"
  end

  attributes do
    uuid_primary_key :id

    attribute :institution_name, :string, allow_nil?: false, public?: true

    attribute :account_type, :atom do
      allow_nil? false
      public? true
      constraints one_of: [:checking, :wire]
    end

    attribute :routing_number, :string, public?: true
    attribute :account_number_last4, :string, public?: true

    attribute :status, :atom do
      constraints one_of: [:pending, :verified]
      default :verified
      public? true
    end

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    belongs_to :account, StableMint.Banking.Account do
      allow_nil? false
      public? true
    end
  end

  actions do
    defaults [:read]

    create :create do
      accept [:institution_name, :account_type, :routing_number,
              :account_number_last4, :account_id]
    end
  end
end
