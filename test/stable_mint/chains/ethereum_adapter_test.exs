defmodule StableMint.Chains.EthereumAdapterTest do
  use ExUnit.Case, async: true

  alias StableMint.Chains.EthereumAdapter

  @valid_address "0x" <> String.duplicate("ab", 20)
  @valid_token "0x" <> String.duplicate("cd", 20)

  test "accepts valid Ethereum address" do
    assert :ok = EthereumAdapter.validate_address(@valid_address)
  end

  test "rejects invalid address" do
    assert {:error, _} = EthereumAdapter.validate_address("invalid")
    assert {:error, _} = EthereumAdapter.validate_address("0xtooshort")
  end

  test "mint returns tx hash for valid inputs" do
    assert {:ok, "0x" <> hash} = EthereumAdapter.mint(
      to: @valid_address, amount: Decimal.new("100"), token: @valid_token
    )
    assert byte_size(hash) == 64
  end

  test "mint rejects zero amount" do
    assert {:error, _} = EthereumAdapter.mint(
      to: @valid_address, amount: Decimal.new("0"), token: @valid_token
    )
  end

  test "burn returns tx hash for valid inputs" do
    assert {:ok, "0x" <> _} = EthereumAdapter.burn(
      from: @valid_address, amount: Decimal.new("50"), token: @valid_token
    )
  end

  test "transfer returns tx hash for valid inputs" do
    to = "0x" <> String.duplicate("ef", 20)
    assert {:ok, "0x" <> _} = EthereumAdapter.transfer(
      from: @valid_address, to: to, amount: Decimal.new("25"), token: @valid_token
    )
  end

  test "finality time is positive" do
    assert EthereumAdapter.finality_time() > 0
  end

  test "chain name is ethereum" do
    assert EthereumAdapter.chain_name() == "ethereum"
  end
end
