# ---- בנייה של LibreDWG (הכלי dxf2dwg) ----
FROM debian:bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential ca-certificates curl pkg-config perl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN curl -fsSL -o libredwg.tar.gz \
      https://github.com/LibreDWG/libredwg/releases/download/0.14/libredwg-0.14.tar.gz \
  && tar xzf libredwg.tar.gz
WORKDIR /src/libredwg-0.14
RUN ./configure --disable-bindings --disable-python --disable-dependency-tracking \
  && make -j"$(nproc)" \
  && make install-strip \
  && ldconfig

# ---- השירות עצמו ----
FROM python:3.12-slim
COPY --from=build /usr/local /usr/local
RUN ldconfig && pip install --no-cache-dir fastapi "uvicorn[standard]"
WORKDIR /app
COPY app.py /app/app.py
ENV ALLOW_ORIGINS=*
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
