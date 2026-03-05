defmodule StableMint.Chains.StellarAdapterTest do
  use ExUnit.Case, async: true

  alias StableMint.Chains.StellarAdapter

  @valid_address "G" <> String.duplicate("A", 55)
  @valid_token "G" <> String.duplicate("T", 55)

  test "accepts valid Stellar address" do
    assert :ok = StellarAdapter.validate_address(@valid_address)
  end

  test "rejects invalid address" do
    assert {:error, _} = StellarAdapter.validate_address("invalid")
    assert {:error, _} = StellarAdapter.validate_address("XABC")
  end

  test "mint returns tx hash" do
    assert {:ok, _hash} = StellarAdapter.mint(
      to: @valid_address, amount: Decimal.new("100"), token: @valid_token
    )
  end

  test "chain name is stellar" do
    assert StellarAdapter.chain_name() == "stellar"
  end

  test "finality time is positive" do
    assert StellarAdapter.finality_time() > 0
  end
end
