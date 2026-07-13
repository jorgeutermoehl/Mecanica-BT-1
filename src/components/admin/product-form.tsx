"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { createProductAction, updateProductAction } from "@/app/actions/admin";
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

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = product !== undefined;
  const [values, setValues] = useState<FormValues>(() => initialValues(product));
  const [submitting, setSubmitting] = useState(false);

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
      toast.success(isEdit ? "Produto atualizado" : "Produto publicado na loja");
      router.push("/admin/produtos");
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível salvar o produto.");
      setSubmitting(false);
    }
  }

  const previewUrl = values.imageUrl.trim();

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
              placeholder="Ex.: Turbina T3/T4 .63 Racing"
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
              placeholder="Ex.: TRB-T3T4-63"
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
              placeholder="Ex.: Garrett"
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
            <Label htmlFor="product-fitment">Fitment / compatibilidade</Label>
            <Input
              id="product-fitment"
              value={values.fitment}
              onChange={(e) => set("fitment", e.target.value)}
              placeholder="Ex.: VW Golf GTI Mk7 2014–2020 · Audi A3 8V"
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

      {/* ============ Imagem ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">Imagem</CardTitle>
          <CardDescription>
            URL da foto principal exibida na vitrine da loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-image">URL da imagem</Label>
            <Input
              id="product-image"
              type="url"
              value={values.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="font-mono"
            />
          </div>
          {previewUrl !== "" && (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Pré-visualização de ${values.name || "produto"}`}
                className="size-24 rounded-lg border border-border bg-muted object-cover"
              />
              <p className="text-sm text-muted-foreground">
                Pré-visualização — confira se a imagem carrega antes de salvar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
