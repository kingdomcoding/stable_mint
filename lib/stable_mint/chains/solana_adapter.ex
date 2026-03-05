defmodule StableMint.Chains.SolanaAdapter do
  @behaviour StableMint.Chains.Adapter

  @impl true
  def mint(opts) do
    with :ok <- validate_address(Keyword.fetch!(opts, :to)),
         :ok <- validate_amount(Keyword.fetch!(opts, :amount)) do
      {:ok, generate_tx_hash()}
    end
  end

  @impl true
  def burn(opts) do
    with :ok <- validate_address(Keyword.fetch!(opts, :from)),
         :ok <- validate_amount(Keyword.fetch!(opts, :amount)) do
      {:ok, generate_tx_hash()}
    end
  end

  @impl true
  def transfer(opts) do
    with :ok <- validate_address(Keyword.fetch!(opts, :from)),
         :ok <- validate_address(Keyword.fetch!(opts, :to)),
         :ok <- validate_amount(Keyword.fetch!(opts, :amount)) do
      {:ok, generate_tx_hash()}
    end
  end

  @impl true
  def get_transaction_status(_tx_hash) do
    case :rand.uniform(10) do
      n when n <= 8 -> {:ok, :confirmed}
      _ -> {:ok, :pending}
    end
  end

  @impl true
  def get_balance(address, _token) do
    with :ok <- validate_address(address), do: {:ok, Decimal.new("1000.000000")}
  end

  @impl true
  def validate_address(address) when is_binary(address) and byte_size(address) in 32..44, do: :ok
  def validate_address(_), do: {:error, "Invalid Solana address: must be 32-44 chars (base58)"}

  @impl true
  def finality_time, do: 1

  @impl true
  def chain_name, do: "solana"

  defp validate_amount(amount) do
    if Decimal.gt?(amount, Decimal.new(0)), do: :ok, else: {:error, "Amount must be positive"}
  end

  defp generate_tx_hash do
    Base.encode64(:crypto.strong_rand_bytes(64))
  end
end
