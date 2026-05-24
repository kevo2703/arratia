"use client";

import { createContext, useContext } from "react";

export interface Brand {
  nombre_comercial: string;
  logo_url: string;
  color_primary: string;
  color_secondary: string;
}

const defaultBrand: Brand = {
  nombre_comercial: "Arratia",
  logo_url: "",
  color_primary: "#ea580c",
  color_secondary: "#1e293b",
};

const BrandCtx = createContext<Brand>(defaultBrand);

export function BrandProvider({
  brand,
  children,
}: {
  brand: Brand;
  children: React.ReactNode;
}) {
  return <BrandCtx.Provider value={brand}>{children}</BrandCtx.Provider>;
}

export function useBrand() {
  return useContext(BrandCtx);
}
