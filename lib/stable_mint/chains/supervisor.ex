defmodule StableMint.Chains.Supervisor do
  use Supervisor

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    children =
      StableMint.Chains.Registry.supported_chains()
      |> Enum.map(fn chain ->
        Supervisor.child_spec(
          {StableMint.Chains.Processor, chain},
          id: {StableMint.Chains.Processor, chain}
        )
      end)

    Supervisor.init(children, strategy: :one_for_one)
  end
end
