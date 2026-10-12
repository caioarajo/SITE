import { createClient } from "@/lib/supabase/client";
import { isHeicSignature } from "@/lib/heic";

/** Sobe uma imagem pro bucket "portfolio" do storage. Detecta HEIC/HEIF
 * pelos bytes do arquivo (não pela extensão — um HEIC renomeado pra ".jpg"
 * ainda reporta "image/jpeg") e, só nesse caso, passa pela rota de
 * servidor que converte pra JPEG antes de subir. Usada tanto no upload do
 * Portfólio quanto no de fotos de Depoimentos. */
export async function uploadImageFile(file: File, folder = "uploads"): Promise<{ path: string; url: string }> {
  const isHeic = isHeicSignature(new Uint8Array(await file.slice(0, 12).arrayBuffer()));

  if (isHeic) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/portfolio/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Falha ao converter e enviar a foto.");
    return data;
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const url = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
  return { path, url };
}
