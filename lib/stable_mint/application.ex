defmodule StableMint.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      StableMintWeb.Telemetry,
      StableMint.Repo,
      {DNSCluster, query: Application.get_env(:stable_mint, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: StableMint.PubSub},
      {Registry, keys: :unique, name: StableMint.Chains.ProcessorRegistry},
      StableMint.Chains.Supervisor,
      StableMintWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: StableMint.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    StableMintWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
