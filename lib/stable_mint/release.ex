defmodule StableMint.Release do
  @app :stable_mint

  def migrate do
    load_app()
    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def seed do
    load_app()
    migrate()

    case StableMint.Stablecoins.list_stablecoins() do
      {:ok, [_ | _]} ->
        IO.puts("Seed data already exists, skipping.")

      _ ->
        {:ok, coin} = StableMint.Stablecoins.create_stablecoin("Acme Dollar", "ACME")
        StableMint.Stablecoins.deploy_to_chain(coin.id, :ethereum)
        StableMint.Stablecoins.deploy_to_chain(coin.id, :solana)
        StableMint.Stablecoins.deploy_to_chain(coin.id, :stellar)

        {:ok, issuer} = StableMint.Banking.create_account("Acme Treasury", :issuer, :platform)
        {:ok, alice} = StableMint.Banking.create_account("Alice Corp", :customer, :platform)
        {:ok, bob} = StableMint.Banking.create_account("Bob Inc", :customer, :self)

        StableMint.Banking.create_address(alice.id, :ethereum, "0x" <> String.duplicate("aa", 20))
        StableMint.Banking.create_address(alice.id, :solana, String.duplicate("A", 44))
        StableMint.Banking.create_address(bob.id, :ethereum, "0x" <> String.duplicate("bb", 20))
        StableMint.Banking.create_address(bob.id, :stellar, "G" <> String.duplicate("B", 55))

        StableMint.Banking.create_fiat_account(%{
          institution_name: "First National Bank",
          account_type: :checking,
          routing_number: "021000021",
          account_number_last4: "4567",
          account_id: issuer.id
        })

        IO.puts("Seed data created successfully!")
    end
  end

  defp repos, do: Application.fetch_env!(@app, :ecto_repos)
  defp load_app, do: Application.ensure_all_started(@app)
end
