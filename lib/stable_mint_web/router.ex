defmodule StableMintWeb.Router do
  use StableMintWeb, :router

  pipeline :api do
    plug StableMintWeb.Plugs.IdempotencyKey
  end

  scope "/api" do
    pipe_through :api
    get "/ledger/audit", StableMintWeb.AuditController, :show
    forward "/", StableMintWeb.AshJsonApiRouter
  end
end
