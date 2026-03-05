import Config

if System.get_env("PHX_SERVER") do
  config :stable_mint, StableMintWeb.Endpoint, server: true
end

config :stable_mint, StableMintWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4400")],
  url: [host: System.get_env("PHX_HOST") || "localhost", port: 4400]

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "environment variable DATABASE_URL is missing."

  config :stable_mint, StableMint.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise "environment variable SECRET_KEY_BASE is missing."

  config :stable_mint, StableMintWeb.Endpoint,
    secret_key_base: secret_key_base
end
