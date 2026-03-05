defmodule StableMint.Chains.SolanaAdapterTest do
  use ExUnit.Case, async: true

  alias StableMint.Chains.SolanaAdapter

  @valid_address String.duplicate("A", 44)
  @valid_token String.duplicate("T", 44)

  test "accepts valid Solana address" do
    assert :ok = SolanaAdapter.validate_address(@valid_address)
  end

  test "rejects invalid address" do
    assert {:error, _} = SolanaAdapter.validate_address("short")
    assert {:error, _} = SolanaAdapter.validate_address(String.duplicate("x", 50))
  end

  test "mint returns tx hash" do
    assert {:ok, _hash} = SolanaAdapter.mint(
      to: @valid_address, amount: Decimal.new("100"), token: @valid_token
    )
  end

  test "chain name is solana" do
    assert SolanaAdapter.chain_name() == "solana"
  end

  test "finality time is positive" do
    assert SolanaAdapter.finality_time() > 0
  end
end
