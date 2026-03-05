ARG ELIXIR_VERSION=1.17.3
ARG OTP_VERSION=27.2.1
ARG DEBIAN_CODENAME=trixie

ARG BUILDER_IMAGE="hexpm/elixir:${ELIXIR_VERSION}-erlang-${OTP_VERSION}-debian-${DEBIAN_CODENAME}-20260223-slim"
ARG RUNNER_IMAGE="debian:${DEBIAN_CODENAME}-slim"

FROM ${BUILDER_IMAGE} AS builder

RUN apt-get update -y && apt-get install -y build-essential git \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

WORKDIR /app

RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV="prod"

COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config
COPY config/config.exs config/runtime.exs config/
RUN mix deps.compile

COPY lib lib
COPY priv priv

RUN mix compile

COPY config/prod.exs config/
RUN mix release

FROM ${RUNNER_IMAGE}

RUN apt-get update -y && \
    apt-get install -y libstdc++6 openssl libncurses6 locales ca-certificates \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

WORKDIR /app
RUN chown nobody /app

ENV MIX_ENV="prod"
ENV PORT=4400

COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/stable_mint ./

USER nobody

EXPOSE 4400

CMD ["/app/bin/server"]
