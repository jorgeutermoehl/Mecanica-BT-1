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

export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type MovementType = (typeof MOVEMENT_TYPES)[number];

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
