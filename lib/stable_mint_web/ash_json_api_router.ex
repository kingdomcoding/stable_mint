defmodule StableMintWeb.AshJsonApiRouter do
  use AshJsonApi.Router,
    domains: [
      StableMint.Stablecoins,
      StableMint.Banking,
      StableMint.Platform
    ],
    open_api: "/open_api"
end
