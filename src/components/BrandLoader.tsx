import { createClient } from "@/lib/supabase/server";
import { BrandProvider, type Brand } from "./BrandContext";

const defaultBrand: Brand = {
  nombre_comercial: "Arratia",
  logo_url: "",
  color_primary: "#ea580c",
  color_secondary: "#1e293b",
};

// Server component: lee marca desde DB y envuelve children con context + CSS vars
export async function BrandLoader({ children }: { children: React.ReactNode }) {
  let brand: Brand = defaultBrand;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("empresa_config")
      .select("nombre_comercial, logo_url, color_primary, color_secondary")
      .limit(1)
      .single();

    if (data) {
      brand = {
        nombre_comercial: data.nombre_comercial || defaultBrand.nombre_comercial,
        logo_url: data.logo_url || "",
        color_primary: data.color_primary || defaultBrand.color_primary,
        color_secondary: data.color_secondary || defaultBrand.color_secondary,
      };
    }
  } catch {
    // Fallback silencioso si DB no existe o columnas faltantes (migración pendiente)
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root {
            --primary: ${brand.color_primary};
            --secondary: ${brand.color_secondary};
            --ring: ${brand.color_primary};
          }`,
        }}
      />
      <BrandProvider brand={brand}>{children}</BrandProvider>
    </>
  );
}
