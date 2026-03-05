import Config

config :stable_mint, StableMint.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "stable_mint_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :stable_mint, StableMintWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 4400],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "KPkyCOWUlUpHxNDEGSgxwEwRMTbxz07kfuXUUBFtp8jzJ7mXhHYvHDydGF9NxTe9"

config :stable_mint, dev_routes: true

config :logger, :default_formatter, format: "[$level] $message\n"

config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime
