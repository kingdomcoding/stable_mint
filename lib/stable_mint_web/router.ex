defmodule StableMintWeb.Router do
  use StableMintWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", StableMintWeb do
    pipe_through :api
  end
end
