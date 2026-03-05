defmodule StableMint.Platform.LedgerTest do
  use StableMint.DataCase

  test "mint creates balanced debit/credit pair" do
    {deployment, account, address} = setup_mint_scenario()

    {:ok, transfer} = StableMint.Platform.mint!(%{
      idempotency_key: Ash.UUID.generate(),
      deployment_id: deployment.id,
      destination_address_id: address.id,
      amount: Decimal.new("100.00"),
      currency: "ACME"
    })

    assert transfer.type == :mint
    assert transfer.status == :pending

    {:ok, %{balanced: true}} = StableMint.Platform.check_balanced()

    {:ok, [entry]} = StableMint.Platform.get_balance(account.id, "ACME")
    assert Decimal.eq?(entry.balance_after, Decimal.new("100.00"))
  end

  test "mint then burn returns to zero" do
    {deployment, account, address} = setup_mint_scenario()

    {:ok, _} = StableMint.Platform.mint!(%{
      idempotency_key: Ash.UUID.generate(),
      deployment_id: deployment.id,
      destination_address_id: address.id,
      amount: Decimal.new("500.00"),
      currency: "ACME"
    })

    {:ok, _} = StableMint.Platform.burn!(%{
      idempotency_key: Ash.UUID.generate(),
      deployment_id: deployment.id,
      source_address_id: address.id,
      amount: Decimal.new("500.00"),
      currency: "ACME"
    })

    {:ok, %{balanced: true}} = StableMint.Platform.check_balanced()

    {:ok, [entry]} = StableMint.Platform.get_balance(account.id, "ACME")
    assert Decimal.eq?(entry.balance_after, Decimal.new("0"))
  end

  test "transfer moves balance between accounts" do
    {deployment, alice, alice_addr} = setup_mint_scenario()
    {:ok, bob} = StableMint.Banking.create_account("Bob Corp", :customer, :platform)
    {:ok, bob_addr} = StableMint.Banking.create_address(bob.id, :ethereum, "0x" <> String.duplicate("bb", 20))

    {:ok, _} = StableMint.Platform.mint!(%{
      idempotency_key: Ash.UUID.generate(),
      deployment_id: deployment.id,
      destination_address_id: alice_addr.id,
      amount: Decimal.new("1000.00"),
      currency: "ACME"
    })

    {:ok, _} = StableMint.Platform.transfer!(%{
      idempotency_key: Ash.UUID.generate(),
      deployment_id: deployment.id,
      source_address_id: alice_addr.id,
      destination_address_id: bob_addr.id,
      amount: Decimal.new("400.00"),
      currency: "ACME"
    })

    {:ok, %{balanced: true}} = StableMint.Platform.check_balanced()

    {:ok, [a]} = StableMint.Platform.get_balance(alice.id, "ACME")
    {:ok, [b]} = StableMint.Platform.get_balance(bob.id, "ACME")
    assert Decimal.eq?(a.balance_after, Decimal.new("600.00"))
    assert Decimal.eq?(b.balance_after, Decimal.new("400.00"))
  end

  test "duplicate idempotency key is rejected" do
    {deployment, _account, address} = setup_mint_scenario()
    key = Ash.UUID.generate()

    {:ok, _} = StableMint.Platform.mint!(%{
      idempotency_key: key,
      deployment_id: deployment.id,
      destination_address_id: address.id,
      amount: Decimal.new("100.00"),
      currency: "ACME"
    })

    assert {:error, _} = StableMint.Platform.mint!(%{
      idempotency_key: key,
      deployment_id: deployment.id,
      destination_address_id: address.id,
      amount: Decimal.new("100.00"),
      currency: "ACME"
    })
  end

  defp setup_mint_scenario do
    reserve_id = StableMint.Platform.Transfer.reserve_account_id()

    case StableMint.Banking.get_account(reserve_id) do
      {:ok, _} -> :ok
      _ ->
        StableMint.Banking.Account
        |> Ash.Changeset.for_create(:create, %{name: "Reserve", type: :issuer, custody_model: :platform})
        |> Ash.Changeset.force_change_attribute(:id, reserve_id)
        |> Ash.create!()
    end

    {:ok, coin} = StableMint.Stablecoins.create_stablecoin("Acme Dollar", "ACME")
    {:ok, deployment} = StableMint.Stablecoins.deploy_to_chain(coin.id, :ethereum)
    {:ok, account} = StableMint.Banking.create_account("Alice Inc", :customer, :platform)
    {:ok, address} = StableMint.Banking.create_address(account.id, :ethereum, "0x" <> String.duplicate("aa", 20))
    {deployment, account, address}
  end
end
