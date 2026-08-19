"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import {
  removeProductImageAction,
  reorderProductImagesAction,
  setPrimaryImageAction,
  uploadProductImageAction,
} from "@/app/actions/media";

/**
 * Gerenciador da galeria de imagens do produto (ESPEC-V2, Onda 2 item 11).
 * Upload multi-arquivo sequencial, imagem principal, remoção com confirmação e
 * reordenação acessível (drag com dnd-kit + botões mover para cima/baixo).
 * Toda mutação passa pelas actions de src/app/actions/media.ts + router.refresh().
 */

// Espelho CLIENT dos limites de src/server/media.ts (módulo server-only — não
// importável aqui). O servidor revalida tudo por magic bytes; isto só evita
// round-trips óbvios.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_MB = 8;
const MAX_IMAGES_PER_PRODUCT = 8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
const MIN_ALT_LENGTH = 3;
const THUMB_SIZE = 96;

export type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  position: number;
};

type PendingUpload = { file: File; alt: string };

function imageLabel(image: GalleryImage, index: number): string {
  return image.alt ? `${index + 1} (${image.alt})` : `${index + 1}`;
}

export function ProductGalleryManager({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reordenação otimista SEM estado espelhado: a ordem otimista fica amarrada
  // à referência de `images` que a originou — quando o server component
  // reenvia a lista (router.refresh), a base muda e o override expira sozinho.
  const [optimistic, setOptimistic] = React.useState<{
    base: GalleryImage[];
    order: string[];
  } | null>(null);
  const items = React.useMemo(() => {
    if (optimistic && optimistic.base === images) {
      const byId = new Map(images.map((image) => [image.id, image]));
      const ordered = optimistic.order
        .map((id) => byId.get(id))
        .filter((image): image is GalleryImage => image !== undefined);
      if (ordered.length === images.length) return ordered;
    }
    return images;
  }, [images, optimistic]);

  const [pending, setPending] = React.useState<PendingUpload[]>([]);
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [reordering, setReordering] = React.useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = React.useState<string | null>(null);
  const [toRemove, setToRemove] = React.useState<GalleryImage | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const uploading = progress !== null;
  const busy = uploading || reordering || removing || settingPrimaryId !== null;
  const slotsLeft = MAX_IMAGES_PER_PRODUCT - items.length - pending.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ---------------------------------------------------------------- upload --

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite selecionar o mesmo arquivo de novo
    if (files.length === 0) return;

    const valid: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: formato não permitido — envie JPEG, PNG, WebP ou AVIF.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name}: arquivo acima de ${MAX_UPLOAD_MB}MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    if (valid.length > slotsLeft) {
      const ignored = valid.length - slotsLeft;
      toast.error(
        `Máximo de ${MAX_IMAGES_PER_PRODUCT} imagens por produto — ${ignored} ${
          ignored === 1 ? "arquivo ignorado" : "arquivos ignorados"
        }.`,
      );
      valid.splice(Math.max(slotsLeft, 0));
    }
    if (valid.length === 0) return;

    setPending((prev) => [
      ...prev,
      ...valid.map((file, i) => ({
        file,
        // Sugestão editável; numeração continua a partir do que já existe.
        alt: `${productName} — vista ${items.length + prev.length + i + 1}`,
      })),
    ]);
  }

  const pendingInvalid = pending.some((p) => p.alt.trim().length < MIN_ALT_LENGTH);

  async function handleUpload() {
    if (pending.length === 0 || pendingInvalid) return;
    const queue = pending;
    const failed: PendingUpload[] = [];
    let sent = 0;

    for (let i = 0; i < queue.length; i++) {
      setProgress({ current: i + 1, total: queue.length });
      const formData = new FormData();
      formData.set("file", queue[i].file);
      formData.set("productId", productId);
      formData.set("alt", queue[i].alt.trim());
      const result = await uploadProductImageAction(formData);
      if (result.ok) {
        sent += 1;
      } else {
        failed.push(queue[i]);
        toast.error(`${queue[i].file.name}: ${result.error ?? "falha no upload."}`);
      }
    }

    setProgress(null);
    setPending(failed); // falhas ficam na fila para ajustar e reenviar
    if (sent > 0) {
      toast.success(sent === 1 ? "1 imagem enviada" : `${sent} imagens enviadas`);
      router.refresh();
    }
  }

  // --------------------------------------------------------------- reorder --

  async function commitOrder(next: GalleryImage[]) {
    const orderedIds = next.map((image) => image.id);
    setOptimistic({ base: images, order: orderedIds }); // otimista
    setReordering(true);
    const result = await reorderProductImagesAction(productId, orderedIds);
    setReordering(false);
    if (result.ok) {
      router.refresh();
    } else {
      setOptimistic(null); // reverte para a ordem do servidor
      toast.error(result.error ?? "Não foi possível reordenar as imagens.");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    void commitOrder(arrayMove(items, oldIndex, newIndex));
  }

  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    void commitOrder(arrayMove(items, index, target));
  }

  // Anúncios pt-BR para leitores de tela durante o drag.
  const positionOf = (id: UniqueIdentifier) => items.findIndex((i) => i.id === id) + 1;
  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Imagem na posição ${positionOf(active.id)} de ${items.length} selecionada.`;
    },
    onDragOver({ over }) {
      return over
        ? `Imagem movida para posição ${positionOf(over.id)} de ${items.length}.`
        : "Imagem fora de uma área válida.";
    },
    onDragEnd({ over }) {
      return over
        ? `Imagem solta na posição ${positionOf(over.id)} de ${items.length}.`
        : "Imagem solta.";
    },
    onDragCancel({ active }) {
      return `Reordenação cancelada. A imagem voltou para a posição ${positionOf(active.id)}.`;
    },
  };

  // --------------------------------------------------- primária e remoção --

  async function handleSetPrimary(image: GalleryImage) {
    setSettingPrimaryId(image.id);
    const result = await setPrimaryImageAction(image.id);
    setSettingPrimaryId(null);
    if (result.ok) {
      toast.success("Imagem principal atualizada", { description: image.alt ?? undefined });
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível definir a imagem principal.");
    }
  }

  async function handleRemove() {
    if (!toRemove) return;
    setRemoving(true);
    const result = await removeProductImageAction(toRemove.id);
    setRemoving(false);
    if (result.ok) {
      toast.success("Imagem removida", { description: toRemove.alt ?? undefined });
      setToRemove(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Não foi possível remover a imagem.");
    }
  }

  // ------------------------------------------------------------------ UI --

  return (
    <div className="space-y-4">
      {/* Envio de novas imagens */}
      <Card>
        <CardHeader>
          <CardTitle>
            Enviar imagens{" "}
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              ({items.length} de {MAX_IMAGES_PER_PRODUCT} imagens)
            </span>
          </CardTitle>
          <CardDescription>
            JPEG, PNG, WebP ou AVIF até {MAX_UPLOAD_MB}MB, mínimo 600x600px. Cada imagem
            precisa de um texto alternativo — descreva o que aparece na foto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            className="sr-only"
            aria-label="Selecionar arquivos de imagem"
            onChange={handleFilesSelected}
            disabled={uploading || slotsLeft <= 0}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={uploading || slotsLeft <= 0}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Adicionar imagens
            </Button>
            {slotsLeft <= 0 && pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Limite de {MAX_IMAGES_PER_PRODUCT} imagens atingido — remova uma para
                enviar outra.
              </p>
            ) : null}
          </div>

          {pending.length > 0 ? (
            <div className="space-y-4">
              <ul className="space-y-2">
                {pending.map((item, index) => (
                  <li
                    key={`${item.file.name}-${index}`}
                    className="rounded-md border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="truncate font-mono text-xs text-muted-foreground"
                        title={item.file.name}
                      >
                        {item.file.name}{" "}
                        <span className="tabular-nums">
                          ({Math.max(1, Math.round(item.file.size / 1024))}kB)
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={`Descartar arquivo ${item.file.name}`}
                        disabled={uploading}
                        onClick={() =>
                          setPending((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 grid gap-2">
                      <Label htmlFor={`gallery-alt-${index}`}>
                        Texto alternativo (obrigatório)
                      </Label>
                      <Input
                        id={`gallery-alt-${index}`}
                        value={item.alt}
                        maxLength={200}
                        required
                        aria-invalid={item.alt.trim().length < MIN_ALT_LENGTH}
                        disabled={uploading}
                        onChange={(e) =>
                          setPending((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, alt: e.target.value } : p,
                            ),
                          )
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  className="gap-2"
                  disabled={uploading || pendingInvalid}
                  onClick={() => void handleUpload()}
                >
                  <Upload className="size-4" />
                  {uploading
                    ? `Enviando ${progress.current} de ${progress.total}…`
                    : pending.length === 1
                      ? "Enviar 1 imagem"
                      : `Enviar ${pending.length} imagens`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={uploading}
                  onClick={() => setPending([])}
                >
                  Cancelar
                </Button>
                {pendingInvalid ? (
                  <p className="text-xs text-muted-foreground">
                    Preencha o texto alternativo de todas as imagens (mínimo{" "}
                    {MIN_ALT_LENGTH} caracteres).
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Progresso do envio sequencial (a11y) */}
          <p role="status" aria-live="polite" className={cn(!uploading && "sr-only")}>
            {uploading
              ? `Enviando ${progress.current} de ${progress.total}…`
              : ""}
          </p>
        </CardContent>
      </Card>

      {/* Grid reordenável */}
      <Card>
        <CardHeader>
          <CardTitle>Imagens do produto</CardTitle>
          <CardDescription>
            A primeira imagem define a ordem na loja; a principal é a capa do produto.
            Arraste pela alça ou use os botões de mover para reordenar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma imagem cadastrada — envie a primeira acima. Ela vira a principal
              automaticamente.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              accessibility={{
                announcements,
                screenReaderInstructions: {
                  draggable:
                    "Para pegar uma imagem, pressione espaço ou Enter. Enquanto arrasta, use as setas para mover, espaço ou Enter para soltar na nova posição e Esc para cancelar.",
                },
              }}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                <ul
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  aria-label="Imagens do produto, em ordem de exibição"
                >
                  {items.map((image, index) => (
                    <SortableImageCard
                      key={image.id}
                      image={image}
                      index={index}
                      total={items.length}
                      disabled={busy}
                      settingPrimary={settingPrimaryId === image.id}
                      onSetPrimary={() => void handleSetPrimary(image)}
                      onRemove={() => setToRemove(image)}
                      onMoveUp={() => handleMove(index, -1)}
                      onMoveDown={() => handleMove(index, 1)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Confirmação de remoção */}
      <AlertDialog
        open={toRemove !== null}
        onOpenChange={(open) => {
          if (!open) setToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove
                ? `"${toRemove.alt ?? "Imagem sem descrição"}" deixará de aparecer na loja. O arquivo fica preservado para auditoria${
                    toRemove.isPrimary
                      ? ", e a próxima imagem da ordem vira a principal"
                      : ""
                  }.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {removing ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableImageCard({
  image,
  index,
  total,
  disabled,
  settingPrimary,
  onSetPrimary,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  disabled: boolean;
  settingPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label = imageLabel(image, index);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border border-border bg-card p-3",
        isDragging && "z-10 border-primary shadow-lg",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Alça de drag: recebe os listeners/atributos do dnd-kit */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar imagem ${label}, posição ${index + 1} de ${total}`}
          disabled={disabled}
          className={cn(
            "mt-8 shrink-0 cursor-grab rounded-sm p-1 text-muted-foreground",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDragging && "cursor-grabbing",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            {image.isPrimary ? (
              <StatusBadge tone="primary">Principal</StatusBadge>
            ) : null}
          </div>
          <div className="flex items-start gap-3">
            <span className="relative block size-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
              <Image
                src={image.url}
                alt={image.alt ?? ""}
                width={THUMB_SIZE}
                height={THUMB_SIZE}
                className="size-24 object-cover"
                unoptimized
              />
            </span>
            <p
              className="min-w-0 flex-1 break-words text-xs text-muted-foreground"
              title={image.alt ?? undefined}
            >
              {image.alt ?? "Sem descrição"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-8", image.isPrimary && "text-primary")}
              aria-label={
                image.isPrimary
                  ? `Imagem ${label} já é a principal`
                  : `Definir imagem ${label} como principal`
              }
              disabled={disabled || image.isPrimary}
              onClick={onSetPrimary}
            >
              <Star
                className={cn("size-3.5", image.isPrimary && "fill-current")}
                aria-hidden="true"
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Mover imagem ${label} para cima, da posição ${index + 1} para ${index}`}
              disabled={disabled || index === 0}
              onClick={onMoveUp}
            >
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Mover imagem ${label} para baixo, da posição ${index + 1} para ${index + 2}`}
              disabled={disabled || index === total - 1}
              onClick={onMoveDown}
            >
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              aria-label={`Remover imagem ${label}`}
              disabled={disabled || settingPrimary}
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
