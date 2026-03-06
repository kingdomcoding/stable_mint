defmodule StableMint.Banking do
  use Ash.Domain,
    extensions: [AshJsonApi.Domain]

  json_api do
    routes do
      base_route "/accounts", StableMint.Banking.Account do
        get :read
        index :read
        post :create
        patch :suspend, route: "/:id/suspend"
        patch :reactivate, route: "/:id/reactivate"
      end

      base_route "/accounts/:account_id/addresses", StableMint.Banking.Address do
        index :by_account
        post :create
      end
    end
  end

  resources do
    resource StableMint.Banking.Account do
      define :create_account, action: :create, args: [:name, :type, :custody_model]
      define :create_account_with_id, action: :create_with_id, args: [:id, :name, :type, :custody_model]
      define :get_account, action: :read, get_by: [:id]
      define :list_accounts, action: :read
      define :suspend_account, action: :suspend
      define :reactivate_account, action: :reactivate
    end

    resource StableMint.Banking.Address do
      define :create_address, action: :create, args: [:account_id, :chain, :address]
      define :get_address, action: :read, get_by: [:id]
      define :list_addresses_for_account, action: :by_account, args: [:account_id]
    end

    resource StableMint.Banking.FiatAccount do
      define :create_fiat_account, action: :create
      define :get_fiat_account, action: :read, get_by: [:id]
    end
  end
end
