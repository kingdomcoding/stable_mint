import Config

config :stable_mint, StableMint.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "stable_mint_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

config :stable_mint, StableMintWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4402],
  secret_key_base: "lRLSvIX1j8FfVqRwNoEVfIjcYyvkaL3jWg2pR4dp+MeGAmJEzv1gmzurvJv/kxaB",
  server: false

config :logger, level: :warning

config :phoenix, :plug_init_mode, :runtime

config :ash, :disable_async?, true
