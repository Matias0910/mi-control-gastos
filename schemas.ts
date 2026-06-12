import { z } from 'zod';

export const CategoryEnum = z.enum(['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Kiosco', 'Otros']);

export const TransactionSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.number().positive({ message: "El monto debe ser mayor a 0" }),
  description: z.string().min(3, { message: "La descripción es muy corta" }),
  category: CategoryEnum,
  date: z.string().default(() => new Date().toISOString()),
  type: z.enum(['ingreso', 'gasto'])
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type Category = z.infer<typeof CategoryEnum>;