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
        {:ok, acme} = StableMint.Stablecoins.create_stablecoin("Acme Dollar", "ACME")
        {:ok, eurc} = StableMint.Stablecoins.create_stablecoin("Euro Coin", "EURC")
        {:ok, gbps} = StableMint.Stablecoins.create_stablecoin("Pound Stable", "GBPS")

        {:ok, acme_eth} = StableMint.Stablecoins.deploy_to_chain(acme.id, :ethereum)
        StableMint.Stablecoins.deploy_to_chain(acme.id, :solana)
        StableMint.Stablecoins.deploy_to_chain(acme.id, :stellar)

        {:ok, eurc_eth} = StableMint.Stablecoins.deploy_to_chain(eurc.id, :ethereum)
        StableMint.Stablecoins.deploy_to_chain(eurc.id, :stellar)

        StableMint.Stablecoins.deploy_to_chain(gbps.id, :ethereum)
        {:ok, gbps_reloaded} = StableMint.Stablecoins.get_stablecoin(gbps.id)
        StableMint.Stablecoins.pause_stablecoin(gbps_reloaded)

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
          deployment_id: acme_eth.id,
          destination_address_id: alice_eth.id,
          amount: "10000",
          currency: "ACME",
          idempotency_key: "seed-mint-acme-alice-1"
        })

        StableMint.Platform.mint!(%{
          deployment_id: acme_eth.id,
          destination_address_id: bob_eth.id,
          amount: "5000",
          currency: "ACME",
          idempotency_key: "seed-mint-acme-bob-1"
        })

        StableMint.Platform.burn!(%{
          deployment_id: acme_eth.id,
          source_address_id: alice_eth.id,
          amount: "1000",
          currency: "ACME",
          idempotency_key: "seed-burn-acme-alice-1"
        })

        StableMint.Platform.transfer!(%{
          deployment_id: acme_eth.id,
          source_address_id: alice_eth.id,
          destination_address_id: bob_eth.id,
          amount: "500",
          currency: "ACME",
          idempotency_key: "seed-transfer-acme-alice-bob-1"
        })

        StableMint.Platform.mint!(%{
          deployment_id: eurc_eth.id,
          destination_address_id: alice_eth.id,
          amount: "5000",
          currency: "EURC",
          idempotency_key: "seed-mint-eurc-alice-1"
        })

        StableMint.Platform.mint!(%{
          deployment_id: eurc_eth.id,
          destination_address_id: bob_eth.id,
          amount: "2000",
          currency: "EURC",
          idempotency_key: "seed-mint-eurc-bob-1"
        })

        IO.puts("Seed data created successfully!")
    end
  end

  defp repos, do: Application.fetch_env!(@app, :ecto_repos)
  defp load_app, do: Application.ensure_all_started(@app)
end
