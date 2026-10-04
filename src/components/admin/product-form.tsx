"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Rocket, X } from "lucide-react";
import { createProductAction, updateProductAction } from "@/app/actions/admin";
import { uploadProductImageAction } from "@/app/actions/media";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface CategoryOption {
  id: string;
  name: string;
}

/** Dados carregados por getAdminProduct — subset usado pelo form em modo edição. */
export interface ProductFormProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  brandName: string;
  originalCode: string;
  description: string;
  technicalSpecs: string;
  fitment: string;
  warranty: string;
  location: string;
  imageUrl: string;
  costPrice: number;
  salePrice: number;
  promoPrice?: number;
  stock: number;
  minStock: number;
}

interface ProductFormProps {
  categories: CategoryOption[];
  product?: ProductFormProduct;
}

type FormValues = {
  name: string;
  sku: string;
  categoryId: string;
  brandName: string;
  originalCode: string;
  imageUrl: string;
  fitment: string;
  warranty: string;
  location: string;
  description: string;
  technicalSpecs: string;
  costPrice: string;
  salePrice: string;
  promoPrice: string;
  initialStock: string;
  minStock: string;
};

function initialValues(product?: ProductFormProduct): FormValues {
  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    categoryId: product?.categoryId ?? "",
    brandName: product?.brandName ?? "",
    originalCode: product?.originalCode ?? "",
    imageUrl: product?.imageUrl ?? "",
    fitment: product?.fitment ?? "",
    warranty: product?.warranty ?? "",
    location: product?.location ?? "",
    description: product?.description ?? "",
    technicalSpecs: product?.technicalSpecs ?? "",
    costPrice: product !== undefined ? String(product.costPrice) : "",
    salePrice: product !== undefined ? String(product.salePrice) : "",
    promoPrice: product?.promoPrice !== undefined ? String(product.promoPrice) : "",
    initialStock: "0",
    minStock: product !== undefined ? String(product.minStock) : "0",
  };
}

// Espelho client dos limites de src/server/media.ts (o servidor revalida tudo).
const MAX_PHOTOS = 8;
const MAX_PHOTO_MB = 8;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type PendingPhoto = { file: File; preview: string };

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = product !== undefined;
  const [values, setValues] = useState<FormValues>(() => initialValues(product));
  const [submitting, setSubmitting] = useState(false);
  // Fotos escolhidas no cadastro — enviadas logo após criar o produto.
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Libera os object URLs das prévias ao sair da página.
  useEffect(
    () => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)),
    [],
  );

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const next: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
        toast.error(`${file.name}: envie JPEG, PNG, WebP ou AVIF.`);
        continue;
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(`${file.name}: arquivo acima de ${MAX_PHOTO_MB}MB.`);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setPhotos((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > MAX_PHOTOS) {
        toast.error(`Máximo de ${MAX_PHOTOS} fotos por produto.`);
        merged.slice(MAX_PHOTOS).forEach((p) => URL.revokeObjectURL(p.preview));
      }
      return merged.slice(0, MAX_PHOTOS);
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  /** Envia as fotos em sequência (a 1ª vira a principal). Retorna quantas falharam. */
  async function uploadPhotos(productId: string, name: string): Promise<number> {
    let failed = 0;
    for (const [i, photo] of photos.entries()) {
      const fd = new FormData();
      fd.set("productId", productId);
      fd.set("alt", `${name} — foto ${i + 1}`);
      fd.set("file", photo.file);
      const r = await uploadProductImageAction(fd);
      if (!r.ok) {
        failed++;
        toast.error(`${photo.file.name}: ${r.error ?? "falha no envio"}`);
      }
    }
    return failed;
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    if (!values.categoryId) {
      toast.error("Selecione a categoria do produto.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      categoryId: values.categoryId,
      brandName: values.brandName.trim(),
      originalCode: values.originalCode.trim(),
      description: values.description.trim(),
      technicalSpecs: values.technicalSpecs.trim(),
      fitment: values.fitment.trim(),
      warranty: values.warranty.trim(),
      location: values.location.trim(),
      imageUrl: values.imageUrl.trim(),
      costPrice: Number(values.costPrice),
      salePrice: Number(values.salePrice),
      promoPrice:
        values.promoPrice.trim() === "" ? undefined : Number(values.promoPrice),
      minStock: Number(values.minStock || 0),
      initialStock: isEdit ? 0 : Number(values.initialStock || 0),
    };

    const result = isEdit
      ? await updateProductAction(product.id, payload)
      : await createProductAction(payload);

    if (result.ok) {
      const createdId = !isEdit && "id" in result ? result.id : undefined;
      if (typeof createdId === "string" && photos.length > 0) {
        const failed = await uploadPhotos(createdId, payload.name);
        toast.success(
          failed === 0
            ? `Produto publicado na loja com ${photos.length} foto(s)`
            : `Produto publicado — ${failed} foto(s) não enviada(s); reenvie na galeria`,
        );
        // Abre a edição para conferir a galeria (principal/ordem).
        router.push(`/admin/produtos/${createdId}`);
        router.refresh();
        return;
      }
      toast.success(isEdit ? "Produto atualizado" : "Produto publicado na loja");
      router.push("/admin/produtos");
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível salvar o produto.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Rocket />
        <AlertTitle>Anúncio publicado direto na loja</AlertTitle>
        <AlertDescription>
          Produtos ativos são publicados imediatamente na loja.
        </AlertDescription>
      </Alert>

      {/* ============ Identificação ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">
            Identificação
          </CardTitle>
          <CardDescription>
            Dados principais do anúncio: nome, SKU e classificação.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="product-name">Nome do produto *</Label>
            <Input
              id="product-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex.: Coroa e Pinhão 8x31 — Gol BX"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU *</Label>
            <Input
              id="product-sku"
              value={values.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="Ex.: TRA-CP-831-GBX"
              className="font-mono uppercase"
              maxLength={40}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-category">Categoria *</Label>
            <Select
              value={values.categoryId}
              onValueChange={(v) => set("categoryId", v)}
            >
              <SelectTrigger id="product-category" className="w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-brand">Marca</Label>
            <Input
              id="product-brand"
              value={values.brandName}
              onChange={(e) => set("brandName", e.target.value)}
              placeholder="Ex.: FullBoost"
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-original-code">Código original</Label>
            <Input
              id="product-original-code"
              value={values.originalCode}
              onChange={(e) => set("originalCode", e.target.value)}
              placeholder="Código do fabricante / OEM"
              className="font-mono"
              maxLength={60}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="product-fitment">Aplicação</Label>
            <Input
              id="product-fitment"
              value={values.fitment}
              onChange={(e) => set("fitment", e.target.value)}
              placeholder="Ex.: Câmbio Gol BX · relação 8x31 (texto livre)"
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-warranty">Garantia</Label>
            <Input
              id="product-warranty"
              value={values.warranty}
              onChange={(e) => set("warranty", e.target.value)}
              placeholder="Ex.: 12 meses contra defeito de fabricação"
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-location">Localização no estoque</Label>
            <Input
              id="product-location"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Ex.: Corredor B · Prateleira 3"
              maxLength={80}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============ Fotos (só no cadastro; na edição a galeria fica abaixo) ============ */}
      {!isEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">
              Fotos do produto{" "}
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                ({photos.length} de {MAX_PHOTOS})
              </span>
            </CardTitle>
            <CardDescription>
              JPEG, PNG, WebP ou AVIF até {MAX_PHOTO_MB}MB. Ideal: quadrada,
              1200x1200px, peça centralizada e fundo limpo (mínimo 400px no
              menor lado). A primeira foto vira a capa na loja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={photoInputRef}
              id="product-photos"
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(",")}
              multiple
              className="sr-only"
              onChange={(e) => addPhotos(e.target.files)}
            />
            {photos.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <li
                    key={p.preview}
                    className="relative overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.preview}
                      alt={`Prévia da foto ${i + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary-foreground">
                        Capa
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-1.5 top-1.5 size-7"
                      onClick={() => removePhoto(i)}
                      aria-label={`Remover foto ${i + 1}`}
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {photos.length < MAX_PHOTOS && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => photoInputRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Adicionar fotos
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============ Descrição ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">
            Descrição
          </CardTitle>
          <CardDescription>
            Conteúdo exibido na página do produto na loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Benefícios, aplicação e diferenciais da peça..."
              rows={5}
              maxLength={4000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-specs">Especificações técnicas</Label>
            <Textarea
              id="product-specs"
              value={values.technicalSpecs}
              onChange={(e) => set("technicalSpecs", e.target.value)}
              placeholder={"Uma por linha. Ex.:\nMaterial: alumínio forjado\nPressão máx.: 2.5 bar"}
              rows={5}
              maxLength={4000}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============ Preços ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">Preços</CardTitle>
          <CardDescription>
            O custo é congelado em cada venda para o cálculo correto do CMV.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="product-cost">Custo (R$) *</Label>
            <Input
              id="product-cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={values.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
              placeholder="0,00"
              className="font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-price">Preço de venda (R$) *</Label>
            <Input
              id="product-price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={values.salePrice}
              onChange={(e) => set("salePrice", e.target.value)}
              placeholder="0,00"
              className="font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-promo">Preço promocional (R$)</Label>
            <Input
              id="product-promo"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={values.promoPrice}
              onChange={(e) => set("promoPrice", e.target.value)}
              placeholder="Opcional"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, o produto entra na vitrine de promoções.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============ Estoque ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">Estoque</CardTitle>
          <CardDescription>
            {isEdit
              ? "O estoque muda apenas por movimentações — registre entradas, saídas e ajustes na tela de Estoque."
              : "O estoque inicial gera uma movimentação de entrada rastreável."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="product-stock">Estoque atual</Label>
              <Input
                id="product-stock"
                value={product.stock}
                readOnly
                disabled
                className="font-mono"
              />
              <p className="text-xs text-warning">
                Somente leitura: o estoque muda por movimentações.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="product-initial-stock">Estoque inicial</Label>
              <Input
                id="product-initial-stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.initialStock}
                onChange={(e) => set("initialStock", e.target.value)}
                className="font-mono"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="product-min-stock">Estoque mínimo</Label>
            <Input
              id="product-min-stock"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values.minStock}
              onChange={(e) => set("minStock", e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Abaixo desse nível o produto entra nos alertas do dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:max-w-xs">
        <Button asChild type="button" variant="ghost">
          <Link href="/admin/produtos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Salvando..."
            : isEdit
              ? "Salvar alterações"
              : "Publicar na loja"}
        </Button>
      </div>
    </form>
  );
}
