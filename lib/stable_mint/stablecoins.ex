defmodule StableMint.Stablecoins do
  use Ash.Domain,
    extensions: [AshJsonApi.Domain]

  json_api do
    routes do
      base_route "/stablecoins", StableMint.Stablecoins.Stablecoin do
        get :read
        index :read
        post :create
      end

      base_route "/deployments", StableMint.Stablecoins.Deployment do
        get :read
        index :read
        post :deploy
      end
    end
  end

  resources do
    resource StableMint.Stablecoins.Stablecoin do
      define :create_stablecoin, action: :create, args: [:name, :symbol]
      define :get_stablecoin, action: :read, get_by: [:id]
      define :list_stablecoins, action: :read
      define :pause_stablecoin, action: :pause
    end

    resource StableMint.Stablecoins.Deployment do
      define :deploy_to_chain, action: :deploy, args: [:stablecoin_id, :chain]
      define :get_deployment, action: :read, get_by: [:id]
      define :list_deployments, action: :read
      define :list_deployments_for_chain, action: :by_chain, args: [:chain]
    end
  end
end
