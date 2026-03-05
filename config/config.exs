import Config

config :stable_mint,
  ecto_repos: [StableMint.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true],
  ash_domains: [
    StableMint.Stablecoins,
    StableMint.Banking,
    StableMint.Platform
  ]

config :stable_mint, StableMintWeb.Endpoint,
  url: [host: "localhost", port: 4400],
  http: [port: 4400],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: StableMintWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: StableMint.PubSub,
  live_view: [signing_salt: "WEkb+nJu"]

config :mime, :types, %{
  "application/vnd.api+json" => ["json"]
}

config :mime, :extensions, %{
  "json" => "application/json"
}

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
