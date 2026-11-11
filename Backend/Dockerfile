# Aegis Global (AGCI) Backend — .NET 10 Multi-stage build
# Fix: bỏ --no-restore ở publish


# ===== STAGE 1: Build =====
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution và tất cả csproj (cache layer cho dotnet restore)
COPY Aegis.sln ./
COPY Directory.Build.props ./
COPY src/Aegis.Domain/Aegis.Domain.csproj             src/Aegis.Domain/
COPY src/Aegis.Application/Aegis.Application.csproj   src/Aegis.Application/
COPY src/Aegis.Infrastructure/Aegis.Infrastructure.csproj src/Aegis.Infrastructure/
COPY src/Aegis.API/Aegis.API.csproj                   src/Aegis.API/

# Restore packages (separate layer để cache Docker)
RUN dotnet restore src/Aegis.API/Aegis.API.csproj

# Copy toàn bộ source và publish
COPY . .
RUN dotnet publish src/Aegis.API/Aegis.API.csproj -c Release -o /app/publish

# ===== STAGE 2: Runtime =====
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libgdiplus libfontconfig1 curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Aegis.API.dll"]
