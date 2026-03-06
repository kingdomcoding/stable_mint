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
        {:ok, eth_deploy} = StableMint.Stablecoins.deploy_to_chain(coin.id, :ethereum)
        StableMint.Stablecoins.deploy_to_chain(coin.id, :solana)
        StableMint.Stablecoins.deploy_to_chain(coin.id, :stellar)

        {:ok, issuer} = StableMint.Banking.create_account("Acme Treasury", :issuer, :platform)
        {:ok, alice} = StableMint.Banking.create_account("Alice Corp", :customer, :platform)
        {:ok, bob} = StableMint.Banking.create_account("Bob Inc", :customer, :self)

        {:ok, alice_eth} = StableMint.Banking.create_address(alice.id, :ethereum, "0x" <> String.duplicate("aa", 20))
        StableMint.Banking.create_address(alice.id, :solana, String.duplicate("A", 44))
        {:ok, bob_eth} = StableMint.Banking.create_address(bob.id, :ethereum, "0x" <> String.duplicate("bb", 20))
        StableMint.Banking.create_address(bob.id, :stellar, "G" <> String.duplicate("B", 55))

        StableMint.Banking.create_fiat_account(%{
          institution_name: "First National Bank",
          account_type: :checking,
          routing_number: "021000021",
          account_number_last4: "4567",
          account_id: issuer.id
        })

        {:ok, _reserve} = StableMint.Banking.create_account_with_id(
          StableMint.Platform.reserve_account_id(),
          "Reserve",
          :issuer,
          :platform
        )

        StableMint.Platform.mint!(%{
          deployment_id: eth_deploy.id,
          destination_address_id: alice_eth.id,
          amount: "10000",
          currency: "ACME",
          idempotency_key: "seed-mint-alice-1"
        })

        StableMint.Platform.mint!(%{
          deployment_id: eth_deploy.id,
          destination_address_id: bob_eth.id,
          amount: "5000",
          currency: "ACME",
          idempotency_key: "seed-mint-bob-1"
        })

        StableMint.Platform.burn!(%{
          deployment_id: eth_deploy.id,
          source_address_id: alice_eth.id,
          amount: "1000",
          currency: "ACME",
          idempotency_key: "seed-burn-alice-1"
        })

        IO.puts("Seed data created successfully!")
    end
  end

  defp repos, do: Application.fetch_env!(@app, :ecto_repos)
  defp load_app, do: Application.ensure_all_started(@app)
end
