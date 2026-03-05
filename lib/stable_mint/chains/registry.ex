defmodule StableMint.Chains.Registry do
  @adapters %{
    "ethereum" => StableMint.Chains.EthereumAdapter,
    "solana" => StableMint.Chains.SolanaAdapter,
    "stellar" => StableMint.Chains.StellarAdapter
  }

  def get_adapter(chain), do: Map.fetch(@adapters, chain)
  def supported_chains, do: Map.keys(@adapters)

  def adapter_for!(chain) do
    case get_adapter(chain) do
      {:ok, adapter} -> adapter
      :error -> raise ArgumentError, "Unsupported chain: #{chain}"
    end
  end

  def generate_mock_contract(chain) do
    case chain do
      :ethereum -> "0x" <> Base.encode16(:crypto.strong_rand_bytes(20), case: :lower)
      :solana -> Base.encode64(:crypto.strong_rand_bytes(32))
      :stellar -> "G" <> Base.encode32(:crypto.strong_rand_bytes(17), padding: false)
    end
  end
end
