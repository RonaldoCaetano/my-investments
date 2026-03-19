import { z } from "zod";

export const registerPayloadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(80),
  email: z.string().email("Informe um e-mail valido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(100, "A senha precisa ter no maximo 100 caracteres.")
});

export const loginPayloadSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha.")
});

export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type LoginPayload = z.infer<typeof loginPayloadSchema>;
