defmodule StableMint.Platform do
  use Ash.Domain,
    extensions: [AshJsonApi.Domain]

  json_api do
    routes do
      base_route "/deployments/:deployment_id/mints", StableMint.Platform.Transfer do
        post :mint
      end

      base_route "/deployments/:deployment_id/redemptions", StableMint.Platform.Transfer do
        post :burn
      end

      base_route "/accounts/:account_id/transfers", StableMint.Platform.Transfer do
        post :transfer
        index :by_account
      end

      base_route "/transfers", StableMint.Platform.Transfer do
        get :read
      end

      base_route "/ledger/entries", StableMint.Platform.LedgerEntry do
        index :read
      end
    end
  end

  defdelegate reserve_account_id, to: StableMint.Platform.Transfer

  resources do
    resource StableMint.Platform.Transfer do
      define :mint!, action: :mint
      define :burn!, action: :burn
      define :transfer!, action: :transfer
      define :get_transfer, action: :read, get_by: [:id]
      define :list_transfers, action: :read
      define :list_transfers_for_account, action: :by_account, args: [:account_id]
      define :finalize_transfer, action: :finalize
      define :fail_transfer, action: :fail, args: [:error_reason]
    end

    resource StableMint.Platform.LedgerEntry do
      define :list_entries, action: :read
      define :list_entries_for_account, action: :by_account, args: [:account_id]
      define :get_balance, action: :balance, args: [:account_id, :currency]
      define :check_balanced, action: :audit
    end
  end
end
