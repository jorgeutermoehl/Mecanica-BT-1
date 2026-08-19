import { z } from "zod";

/**
 * Valores canônicos dos campos de status/tipo (SQLite não tem enum nativo —
 * a validação dupla acontece aqui e nos serviços).
 */
export const PRODUCT_STATUS = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "PROMOTION"] as const;
export const ORDER_STATUS = [
  "AWAITING_PAYMENT",
  "PAID",
  "SEPARATING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export const PAYMENT_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "BOLETO", "CASH", "BANK_TRANSFER"] as const;
export const MOVEMENT_TYPES = [
  "ENTRY",
  "SALE",
  "MANUAL_OUT",
  "ADJUSTMENT",
  "CUSTOMER_RETURN",
  "SUPPLIER_RETURN",
  "LOSS",
  "INVENTORY",
] as const;

export const SALE_CHANNELS = ["SITE", "INSTAGRAM", "WHATSAPP", "LOJA"] as const;

export const FUEL_TYPES = ["GASOLINE", "ETHANOL", "FLEX", "DIESEL"] as const;
export const FITMENT_TYPES = ["UNIVERSAL", "SPECIFIC", "UNKNOWN"] as const;
export const PRODUCT_CONDITIONS = ["NEW", "USED", "REMAN"] as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type MovementType = (typeof MOVEMENT_TYPES)[number];
export type SaleChannel = (typeof SALE_CHANNELS)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type FitmentType = (typeof FITMENT_TYPES)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
  FLEX: "Flex",
  DIESEL: "Diesel",
};

export const FITMENT_TYPE_LABEL: Record<FitmentType, string> = {
  UNIVERSAL: "Universal",
  SPECIFIC: "Aplicação específica",
  UNKNOWN: "Consultar compatibilidade",
};

export const SALE_CHANNEL_LABEL: Record<SaleChannel, string> = {
  SITE: "Site",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  LOJA: "Loja física",
};

/** Rótulos pt-BR para exibição na loja e no painel. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  SEPARATING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  RETURNED: "Devolvido",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  OUT_OF_STOCK: "Esgotado",
  PROMOTION: "Promoção",
};

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  ENTRY: "Entrada",
  SALE: "Venda",
  MANUAL_OUT: "Saída manual",
  ADJUSTMENT: "Ajuste",
  CUSTOMER_RETURN: "Devolução de cliente",
  SUPPLIER_RETURN: "Devolução a fornecedor",
  LOSS: "Perda/avaria",
  INVENTORY: "Inventário",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
  BANK_TRANSFER: "Transferência",
};

// ===========================================================================
// Schemas
// ===========================================================================

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(120),
  sku: z.string().min(2, "SKU obrigatório").max(40),
  categoryId: z.string().min(1, "Selecione a categoria"),
  brandName: z.string().max(60).optional().or(z.literal("")),
  originalCode: z.string().max(60).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  technicalSpecs: z.string().max(4000).optional().or(z.literal("")),
  fitment: z.string().max(160).optional().or(z.literal("")),
  warranty: z.string().max(160).optional().or(z.literal("")),
  location: z.string().max(80).optional().or(z.literal("")),
  imageUrl: z.string().url("URL de imagem inválida").optional().or(z.literal("")),
  costPrice: z.coerce.number().min(0, "Custo não pode ser negativo"),
  salePrice: z.coerce.number().positive("Preço de venda deve ser maior que zero"),
  promoPrice: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  initialStock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
}).refine((d) => d.promoPrice === undefined || d.promoPrice < d.salePrice, {
  message: "Preço promocional deve ser menor que o preço de venda",
  path: ["promoPrice"],
});

export const stockEntrySchema = z.object({
  productId: z.string().min(1, "Selecione o produto"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  unitCost: z.coerce.number().min(0),
  invoiceNumber: z.string().max(40).optional().or(z.literal("")),
  supplierName: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  /// Financeiro da compra: lança a despesa junto com a movimentação.
  registerExpense: z.boolean().default(true),
  paid: z.boolean().default(true), // true = pago à vista (sai do caixa); false = a prazo (contas a pagar em aberto)
  paymentMethod: z.enum(PAYMENT_METHODS).default("PIX"),
});

/** Venda manual (balcão/Instagram/WhatsApp) — gera pedido + saída de estoque. */
export const manualSaleSchema = z.object({
  productId: z.string().min(1, "Selecione o produto"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  unitPrice: z.coerce.number().positive("Preço deve ser maior que zero"),
  channel: z.enum(SALE_CHANNELS),
  /** Cliente já cadastrado (via lupa) — preferido. */
  customerId: z.string().optional().or(z.literal("")),
  /** Cadastro rápido: nome de um cliente novo (quando não há customerId). */
  customerName: z.string().max(120).optional().or(z.literal("")),
  /** Cadastro rápido "cliente Instagram": handle e WhatsApp opcionais. */
  customerInstagram: z.string().max(40).optional().or(z.literal("")),
  customerWhatsapp: z.string().max(20).optional().or(z.literal("")),
  paymentMethod: z.enum(PAYMENT_METHODS).default("PIX"),
});

/** Consentimento de cookies (LGPD) com dados de origem da visita. */
export const consentSchema = z.object({
  sessionId: z.string().min(8).max(64),
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
  referrer: z.string().max(500).optional().or(z.literal("")),
  utmSource: z.string().max(100).optional().or(z.literal("")),
  utmMedium: z.string().max(100).optional().or(z.literal("")),
  utmCampaign: z.string().max(100).optional().or(z.literal("")),
  locale: z.string().max(20).optional().or(z.literal("")),
  timezone: z.string().max(60).optional().or(z.literal("")),
  consentVersion: z.string().max(10).default("v1"),
});
export type ConsentInput = z.infer<typeof consentSchema>;

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Código deve ter ao menos 3 caracteres")
    .max(30)
    .regex(/^[A-Za-z0-9]+$/, "Use apenas letras e números"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Valor deve ser maior que zero"),
  minOrderValue: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
}).refine((d) => d.type !== "PERCENT" || d.value <= 90, {
  message: "Desconto percentual máximo é 90%",
  path: ["value"],
});

export const promoPriceSchema = z.object({
  productId: z.string().min(1, "Selecione o produto"),
  promoPrice: z.coerce.number().positive("Preço promocional deve ser maior que zero"),
});

export const customerFormSchema = z.object({
  name: z.string().min(3, "Informe o nome").max(120),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  document: z.string().max(20).optional().or(z.literal("")),
  instagram: z.string().max(40).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  acquisitionChannel: z.enum(SALE_CHANNELS).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// ---- Catálogo de veículos (fitment) ----

export const vehicleMakeSchema = z.object({
  name: z.string().min(2, "Informe a marca").max(60),
});

export const vehicleModelSchema = z.object({
  makeId: z.string().min(1, "Selecione a marca"),
  name: z.string().min(1, "Informe o modelo").max(60),
});

export const vehicleVersionSchema = z.object({
  modelId: z.string().min(1, "Selecione o modelo"),
  name: z.string().min(1, "Informe a versão").max(80),
  yearStart: z.coerce.number().int().min(1950, "Ano inicial inválido").max(2100),
  yearEnd: z.coerce
    .number()
    .int()
    .min(1950)
    .max(2100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  engine: z.string().max(60).optional().or(z.literal("")),
  fuel: z.enum(FUEL_TYPES).optional(),
  chassis: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
}).refine((d) => d.yearEnd === undefined || d.yearEnd >= d.yearStart, {
  message: "Ano final deve ser maior ou igual ao inicial",
  path: ["yearEnd"],
});

export const productApplicationSchema = z.object({
  productId: z.string().min(1),
  vehicleVersionId: z.string().min(1, "Selecione a versão do veículo"),
  yearStart: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal("").transform(() => undefined)),
  yearEnd: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal("").transform(() => undefined)),
  engine: z.string().max(60).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export const myCarSchema = z.object({
  vehicleVersionId: z.string().min(1),
  year: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal("").transform(() => undefined)),
});

/** Filtros dos relatórios de estoque. */
export const movementReportSchema = z.object({
  from: z.string().optional().or(z.literal("")),
  to: z.string().optional().or(z.literal("")),
  direction: z.enum(["ALL", "IN", "OUT"]).default("ALL"),
});

export const stockOutSchema = z.object({
  productId: z.string().min(1, "Selecione o produto"),
  quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
  type: z.enum(["MANUAL_OUT", "LOSS", "SUPPLIER_RETURN"]),
  reason: z.string().min(3, "Informe o motivo").max(300),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1, "Selecione o produto"),
  newQuantity: z.coerce.number().int().min(0, "Quantidade não pode ser negativa"),
  reason: z.string().min(3, "Informe o motivo do ajuste").max(300),
});

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(3, "Informe seu nome completo").max(120),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(8, "Telefone inválido").max(20),
    document: z.string().max(20).optional().or(z.literal("")),
  }),
  shipping: z.object({
    zipCode: z.string().min(8, "CEP inválido").max(9),
    street: z.string().min(3, "Informe o endereço").max(160),
    number: z.string().min(1, "Número obrigatório").max(20),
    complement: z.string().max(80).optional().or(z.literal("")),
    district: z.string().max(80).optional().or(z.literal("")),
    city: z.string().min(2, "Informe a cidade").max(80),
    state: z.string().length(2, "UF inválida"),
  }),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  couponCode: z.string().max(30).optional().or(z.literal("")),
  /** Sessão de consentimento (localStorage fb-session-id) — liga pedido à origem da visita. */
  sessionId: z.string().max(64).optional().or(z.literal("")),
  /** "Meu Carro" no momento da compra → garagem do cliente + snapshot no pedido. */
  myCarVersionId: z.string().max(40).optional().or(z.literal("")),
  myCarLabel: z.string().max(120).optional().or(z.literal("")),
  /** Idempotência: UUID gerado uma vez por tentativa de checkout (double-click/retry). */
  externalReference: z.string().uuid().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, "Carrinho vazio"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ManualSaleInput = z.infer<typeof manualSaleSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type PromoPriceInput = z.infer<typeof promoPriceSchema>;
export type CustomerFormInput = z.infer<typeof customerFormSchema>;
export type MovementReportInput = z.infer<typeof movementReportSchema>;
export type VehicleMakeInput = z.infer<typeof vehicleMakeSchema>;
export type VehicleModelInput = z.infer<typeof vehicleModelSchema>;
export type VehicleVersionInput = z.infer<typeof vehicleVersionSchema>;
export type ProductApplicationInput = z.infer<typeof productApplicationSchema>;
