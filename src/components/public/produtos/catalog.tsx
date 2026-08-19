"use client";

import { cn } from "@/lib/utils";
import { matchesProductQuery } from "@/lib/search";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  PackageOpen,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  productMatchesVehicle,
  type StoreCategory,
  type StoreProduct,
} from "@/types/store";
import { useMyCar } from "@/components/public/my-car/my-car-provider";
import { whatsappLink } from "@/lib/constants";

/* ---------- Configurações de filtro / ordenação ---------- */

type SortId =
  | "relevancia"
  | "menor-preco"
  | "maior-preco"
  | "mais-vendidos"
  | "novidades";

const SORTS: { id: SortId; label: string }[] = [
  { id: "relevancia", label: "Relevância" },
  { id: "menor-preco", label: "Menor preço" },
  { id: "maior-preco", label: "Maior preço" },
  { id: "mais-vendidos", label: "Mais vendidos" },
  { id: "novidades", label: "Novidades" },
];

const PRICE_RANGES: { id: string; label: string; min: number; max: number }[] = [
  { id: "all", label: "Todos os preços", min: 0, max: Infinity },
  { id: "lt100", label: "Até R$ 100", min: 0, max: 100 },
  { id: "100-500", label: "R$ 100 a R$ 500", min: 100, max: 500 },
  { id: "500-2000", label: "R$ 500 a R$ 2.000", min: 500, max: 2000 },
  { id: "2000-5000", label: "R$ 2.000 a R$ 5.000", min: 2000, max: 5000 },
  { id: "gt5000", label: "Acima de R$ 5.000", min: 5000, max: Infinity },
];

/** Preço efetivo (promoção vence o preço cheio). */
function priceOf(p: StoreProduct) {
  return p.promoPrice ?? p.price;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/* ---------- Eyebrow (rótulo mono vermelho com traço) ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/* ---------- Painel de filtros (reutilizado no desktop e no Sheet) ---------- */

type FilterPanelProps = {
  idPrefix: string;
  categories: StoreCategory[];
  catCounts: Record<string, number>;
  brandOptions: string[];
  brandCounts: Record<string, number>;
  cats: string[];
  setCats: (v: string[]) => void;
  brands: string[];
  setBrands: (v: string[]) => void;
  priceId: string;
  setPriceId: (v: string) => void;
  onlyPromo: boolean;
  setOnlyPromo: (v: boolean) => void;
  inStock: boolean;
  setInStock: (v: boolean) => void;
  activeCount: number;
  onClear: () => void;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </h3>
  );
}

function FilterPanel({
  idPrefix,
  categories,
  catCounts,
  brandOptions,
  brandCounts,
  cats,
  setCats,
  brands,
  setBrands,
  priceId,
  setPriceId,
  onlyPromo,
  setOnlyPromo,
  inStock,
  setInStock,
  activeCount,
  onClear,
}: FilterPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <span className="font-display text-sm font-bold uppercase tracking-wide">
          Filtrar
        </span>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="gap-1 text-muted-foreground"
          >
            <X className="size-3" />
            Limpar ({activeCount})
          </Button>
        )}
      </div>

      <div className="divide-y divide-border">
{/* Categorias — navegação lateral */}
<div className="py-5 first:pt-0">
  <SectionTitle>Categorias</SectionTitle>
  <nav className="flex flex-col gap-0.5">
    <button
      type="button"
      onClick={() => setCats([])}
      aria-current={cats.length === 0 ? "true" : undefined}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
        cats.length === 0
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span>Todas as categorias</span>
      <span className="font-mono text-xs">
        {Object.values(catCounts).reduce((s, n) => s + n, 0)}
      </span>
    </button>

    {categories.map((c) => {
      const active = cats.length === 1 && cats[0] === c.slug;
      return (
        <button
          key={c.slug}
          type="button"
          onClick={() => setCats(active ? [] : [c.slug])}
          aria-current={active ? "true" : undefined}
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
            active
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span>{c.name}</span>
          <span className="font-mono text-xs">{catCounts[c.slug] ?? 0}</span>
        </button>
      );
    })}
  </nav>
</div>

        {/* Marca */}
        {brandOptions.length > 0 && (
          <div className="py-5">
            <SectionTitle>Marca</SectionTitle>
            <div className="flex flex-col gap-0.5">
              {brandOptions.map((b) => {
                const id = `${idPrefix}-brand-${b.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <div key={b} className="flex items-center gap-2.5 py-1">
                    <Checkbox
                      id={id}
                      checked={brands.includes(b)}
                      onCheckedChange={() => setBrands(toggle(brands, b))}
                    />
                    <label
                      htmlFor={id}
                      className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                    >
                      <span>{b}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {brandCounts[b] ?? 0}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Faixa de preço */}
        <div className="py-5">
          <SectionTitle>Faixa de preço</SectionTitle>
          <RadioGroup value={priceId} onValueChange={setPriceId} className="gap-2.5">
            {PRICE_RANGES.map((r) => {
              const id = `${idPrefix}-price-${r.id}`;
              return (
                <div key={r.id} className="flex items-center gap-2.5">
                  <RadioGroupItem id={id} value={r.id} />
                  <label htmlFor={id} className="cursor-pointer text-sm">
                    {r.label}
                  </label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Disponibilidade */}
        <div className="py-5 last:pb-0">
          <SectionTitle>Disponibilidade</SectionTitle>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id={`${idPrefix}-promo`}
                checked={onlyPromo}
                onCheckedChange={(v) => setOnlyPromo(v === true)}
              />
              <label
                htmlFor={`${idPrefix}-promo`}
                className="cursor-pointer text-sm"
              >
                Só em promoção
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <Checkbox
                id={`${idPrefix}-stock`}
                checked={inStock}
                onCheckedChange={(v) => setInStock(v === true)}
              />
              <label
                htmlFor={`${idPrefix}-stock`}
                className="cursor-pointer text-sm"
              >
                Em estoque
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Catálogo ---------- */

type CatalogProps = {
  products: StoreProduct[];
  categories: StoreCategory[];
  initialCategory?: string;
};

export function Catalog({ products, categories, initialCategory }: CatalogProps) {
  const { car, hydrated: carHydrated } = useMyCar();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("relevancia");
  const [cats, setCats] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [brands, setBrands] = useState<string[]>([]);
  const [priceId, setPriceId] = useState("all");
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [inStock, setInStock] = useState(false);
  // "Só compatíveis" nasce LIGADO — só tem efeito quando há carro selecionado.
  const [onlyCompatible, setOnlyCompatible] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const compatActive = carHydrated && car !== null && onlyCompatible;

  // Facetas honestas com os dados: contagens derivadas do catálogo real.
  const catCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.categorySlug] = (counts[p.categorySlug] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const { brandOptions, brandCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (!p.brand) continue;
      counts[p.brand] = (counts[p.brand] ?? 0) + 1;
    }
    return {
      brandOptions: Object.keys(counts).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
      brandCounts: counts,
    };
  }, [products]);

  const activeCount =
    cats.length +
    brands.length +
    (priceId !== "all" ? 1 : 0) +
    (onlyPromo ? 1 : 0) +
    (inStock ? 1 : 0) +
    (compatActive ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function clearAll() {
    setQuery("");
    setCats([]);
    setBrands([]);
    setPriceId("all");
    setOnlyPromo(false);
    setInStock(false);
    setOnlyCompatible(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const range = PRICE_RANGES.find((r) => r.id === priceId) ?? PRICE_RANGES[0];

    const list = products.filter((p) => {
      const price = priceOf(p);
      if (q && !matchesProductQuery(p, q)) return false;
      if (cats.length && !cats.includes(p.categorySlug)) return false;
      if (brands.length && (!p.brand || !brands.includes(p.brand))) return false;
      if (price < range.min || price > range.max) return false;
      if (onlyPromo && p.promoPrice === null) return false;
      if (inStock && p.stock <= 0) return false;
      if (compatActive && car && !productMatchesVehicle(p, car.versionId))
        return false;
      return true;
    });

    switch (sort) {
      case "menor-preco":
        return [...list].sort((a, b) => priceOf(a) - priceOf(b));
      case "maior-preco":
        return [...list].sort((a, b) => priceOf(b) - priceOf(a));
      case "mais-vendidos":
        return [...list].sort((a, b) => b.sold - a.sold);
      case "novidades":
        return [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
      default:
        // Relevância = ordem em que o servidor entregou o catálogo.
        return list;
    }
  }, [products, query, cats, brands, priceId, onlyPromo, inStock, sort, compatActive, car]);

  return (
    <Container className="py-10 lg:py-14">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Produtos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Cabeçalho */}
      <div className="mt-6">
        <Eyebrow>Catálogo completo</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            Produtos
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {filtered.length} de {products.length}{" "}
            {products.length === 1 ? "produto" : "produtos"}
          </p>
        </div>
      </div>

      <Separator className="mt-6" />

      {/* Grade principal: sidebar + conteúdo */}
      <div className="mt-8 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel
              idPrefix="desktop"
              categories={categories}
              catCounts={catCounts}
              brandOptions={brandOptions}
              brandCounts={brandCounts}
              cats={cats}
              setCats={setCats}
              brands={brands}
              setBrands={setBrands}
              priceId={priceId}
              setPriceId={setPriceId}
              onlyPromo={onlyPromo}
              setOnlyPromo={setOnlyPromo}
              inStock={inStock}
              setInStock={setInStock}
              activeCount={activeCount}
              onClear={clearAll}
            />
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="min-w-0">
          {/* Barra superior: busca + filtros (mobile) + ordenação */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Label htmlFor="busca-produtos" className="sr-only">
                Buscar produtos
              </Label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="busca-produtos"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, SKU ou aplicação…"
                className="h-10 pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filtros no mobile (Sheet) */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-10 gap-2 lg:hidden"
                  >
                    <SlidersHorizontal className="size-4" />
                    Filtros
                    {activeCount > 0 && (
                      <Badge className="ml-0.5 h-5 min-w-5 px-1 font-mono">
                        {activeCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[19rem] gap-0 overflow-y-auto"
                >
                  <SheetHeader className="border-b border-border">
                    <SheetTitle className="font-display uppercase tracking-tight">
                      Filtros
                    </SheetTitle>
                    <SheetDescription>
                      Refine a busca e monte o setup ideal pro seu carro.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-4 py-2">
                    <FilterPanel
                      idPrefix="mobile"
                      categories={categories}
                      catCounts={catCounts}
                      brandOptions={brandOptions}
                      brandCounts={brandCounts}
                      cats={cats}
                      setCats={setCats}
                      brands={brands}
                      setBrands={setBrands}
                      priceId={priceId}
                      setPriceId={setPriceId}
                      onlyPromo={onlyPromo}
                      setOnlyPromo={setOnlyPromo}
                      inStock={inStock}
                      setInStock={setInStock}
                      activeCount={activeCount}
                      onClear={clearAll}
                    />
                  </div>
                  <SheetFooter className="border-t border-border">
                    <SheetClose asChild>
                      <Button size="lg" className="w-full">
                        Ver {filtered.length}{" "}
                        {filtered.length === 1 ? "produto" : "produtos"}
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* Ordenação */}
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as SortId)}
              >
                <SelectTrigger
                  aria-label="Ordenar produtos"
                  className="h-10 w-full min-w-40 sm:w-48"
                >
                  <ArrowUpDown className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro "Meu Carro" — só aparece com veículo selecionado */}
          {carHydrated && car && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-border bg-card/60 px-3 py-2.5">
              <Checkbox
                id="so-compativeis"
                checked={onlyCompatible}
                onCheckedChange={(v) => setOnlyCompatible(v === true)}
              />
              <label
                htmlFor="so-compativeis"
                className="cursor-pointer text-sm"
              >
                Só compatíveis com{" "}
                <span className="font-mono font-medium">{car.label}</span>
              </label>
              <p
                aria-live="polite"
                className="w-full font-mono text-xs text-muted-foreground sm:ml-auto sm:w-auto"
              >
                {compatActive
                  ? `Mostrando ${filtered.length} ${
                      filtered.length === 1
                        ? "produto compatível"
                        : "produtos compatíveis"
                    }`
                  : "Mostrando todos os produtos"}
              </p>
            </div>
          )}

          {/* Resultados */}
          {filtered.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <div key={p.id} className="relative grid">
                  {compatActive && p.fitmentType === "UNIVERSAL" && (
                    <Badge
                      variant="secondary"
                      className="pointer-events-none absolute right-2 top-2 z-10 font-mono uppercase"
                    >
                      Universal
                    </Badge>
                  )}
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageOpen className="size-7" />
              </span>
              <h2 className="mt-5 font-display text-lg font-bold uppercase tracking-tight">
                Nenhuma peça encontrada
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Não achamos peças com esses filtros. Ajuste a busca ou fale com um
                especialista para encontrar a peça certa pro seu setup.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={clearAll} variant="outline" className="gap-2">
                  <RotateCcw className="size-4" />
                  Limpar filtros
                </Button>
                <Button asChild className="gap-2">
                  <a
                    href={whatsappLink(
                      "Olá! Não encontrei a peça que procuro no catálogo. Podem me ajudar?",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    Falar com especialista
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
