import { z } from 'zod';

export const CATEGORIES = ['Almacen', 'Carniceria', 'Hijos', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Kiosco', 'Indumentaria', 'Bancos', 'Regaleria', 'Otros'] as const;

export const CategoryEnum = z.enum(CATEGORIES);

export const TransactionSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.number().positive({ message: "El monto debe ser mayor a 0" }),
  description: z.string().min(3, { message: "La descripción es muy corta" }),
  category: CategoryEnum,
  date: z.string().default(() => new Date().toISOString()),
  type: z.enum(['ingreso', 'gasto']),
  isPending: z.boolean().optional().default(false)
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type Category = z.infer<typeof CategoryEnum>;