import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, PERMISSIONS, ROLES } from "./base-data";

/**
 * Bootstrap de PRODUÇÃO (idempotente, nunca apaga nada):
 *  - cria/atualiza permissões, papéis e categorias estruturais;
 *  - cria o 1º administrador a partir de BOOTSTRAP_ADMIN_* se ainda não houver admin.
 * Uso: BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... npm run db:bootstrap
 */

const prisma = new PrismaClient();

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key: perm.key }, create: perm, update: { description: perm.description } });
  }
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      create: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        permissions: { connect: r.perms.map((key) => ({ key })) },
      },
      update: { permissions: { set: r.perms.map((key) => ({ key })) } },
    });
  }
  for (const { disabled, ...c } of CATEGORIES) {
    // Não sobrescreve ajustes feitos no painel (nome/descrição/posição);
    // só garante que as categorias desativadas pela loja continuem desativadas.
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, deletedAt: disabled ? new Date() : null },
      update: disabled ? { deletedAt: new Date() } : {},
    });
  }
  console.log(`✔ ${PERMISSIONS.length} permissões · ${ROLES.length} papéis · ${CATEGORIES.length} categorias`);

  const hasAdmin = await prisma.user.count({ where: { isActive: true, deletedAt: null, role: { slug: "admin" } } });
  if (hasAdmin > 0) {
    console.log("✔ Já existe administrador ativo — nenhum usuário criado.");
    return;
  }
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrador";
  if (!email || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error(
      "Nenhum admin no banco. Defina BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD (10+ caracteres, letra e número).",
    );
  }
  const admin = await prisma.role.findUniqueOrThrow({ where: { slug: "admin" } });
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      passwordChangedAt: new Date(),
      roleId: admin.id,
    },
  });
  console.log(`✔ Administrador ${email} criado. Remova BOOTSTRAP_ADMIN_PASSWORD do ambiente.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
