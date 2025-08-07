{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    fenix.url = "github:nix-community/fenix";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      fenix,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        # toolchain = fenix.packages.${system}.stable.toolchain;
        fenixPkgs = fenix.packages.${system};
        nightlyToolchain =
          with fenixPkgs;
          combine [
            latest.rustc
            latest.cargo
            latest.rust-analyzer
            latest.clippy
            latest.rustfmt
            targets.wasm32-unknown-unknown.latest.rust-std
          ];
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            # toolchain
            nightlyToolchain
            pkgs.wasm-pack
          ];
        };
      }

    );
}
