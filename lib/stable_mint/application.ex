defmodule StableMint.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      StableMintWeb.Telemetry,
      StableMint.Repo,
      {DNSCluster, query: Application.get_env(:stable_mint, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: StableMint.PubSub},
      # Start a worker by calling: StableMint.Worker.start_link(arg)
      # {StableMint.Worker, arg},
      # Start to serve requests, typically the last entry
      StableMintWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: StableMint.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    StableMintWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
