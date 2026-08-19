import type { PrismaClient } from "@prisma/client";

/**
 * Seed do catálogo de veículos (ESPEC-V2, Onda 2 item 1) — público tuning BR.
 * Idempotente: upsert por slug, roda quantas vezes for preciso sem duplicar.
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type VersionSpec = {
  name: string;
  yearStart: number;
  yearEnd?: number;
  engine?: string;
  fuel?: "GASOLINE" | "ETHANOL" | "FLEX" | "DIESEL";
};

type ModelSpec = { name: string; versions: VersionSpec[] };
type MakeSpec = { name: string; models: ModelSpec[] };

const CATALOG: MakeSpec[] = [
  {
    name: "Volkswagen",
    models: [
      {
        name: "Golf",
        versions: [
          { name: "GTI Mk7", yearStart: 2014, yearEnd: 2019, engine: "2.0 TSI", fuel: "GASOLINE" },
          { name: "GTI Mk7.5", yearStart: 2017, yearEnd: 2021, engine: "2.0 TSI", fuel: "GASOLINE" },
          { name: "TSI 1.4", yearStart: 2014, yearEnd: 2022, engine: "1.4 TSI", fuel: "FLEX" },
        ],
      },
      {
        name: "Gol",
        versions: [
          { name: "G5/G6 1.6", yearStart: 2008, yearEnd: 2016, engine: "1.6 8v", fuel: "FLEX" },
          { name: "GTI (quadrado)", yearStart: 1989, yearEnd: 1994, engine: "2.0 8v", fuel: "GASOLINE" },
        ],
      },
      {
        name: "Jetta",
        versions: [
          { name: "GLI Mk7", yearStart: 2019, engine: "2.0 TSI", fuel: "GASOLINE" },
          { name: "TSI Mk6", yearStart: 2011, yearEnd: 2018, engine: "1.4 TSI", fuel: "FLEX" },
        ],
      },
      {
        name: "Polo",
        versions: [
          { name: "GTS", yearStart: 2020, engine: "1.4 TSI", fuel: "FLEX" },
          { name: "TSI", yearStart: 2018, engine: "1.0 TSI", fuel: "FLEX" },
        ],
      },
      { name: "Saveiro", versions: [{ name: "Cross G6/G7", yearStart: 2013, engine: "1.6 16v", fuel: "FLEX" }] },
    ],
  },
  {
    name: "Chevrolet",
    models: [
      {
        name: "Onix",
        versions: [
          { name: "Turbo", yearStart: 2019, engine: "1.0 Turbo", fuel: "FLEX" },
          { name: "1.4", yearStart: 2012, yearEnd: 2019, engine: "1.4 8v", fuel: "FLEX" },
        ],
      },
      { name: "Cruze", versions: [{ name: "LT/LTZ Turbo", yearStart: 2016, engine: "1.4 Turbo", fuel: "FLEX" }] },
      { name: "Astra", versions: [{ name: "2.0 8v/16v", yearStart: 1998, yearEnd: 2011, engine: "2.0", fuel: "FLEX" }] },
      { name: "Opala", versions: [{ name: "6 cilindros", yearStart: 1968, yearEnd: 1992, engine: "4.1", fuel: "GASOLINE" }] },
      { name: "Corsa", versions: [{ name: "1.4/1.8", yearStart: 2002, yearEnd: 2012, engine: "1.8 8v", fuel: "FLEX" }] },
    ],
  },
  {
    name: "Fiat",
    models: [
      { name: "Uno", versions: [{ name: "Turbo i.e.", yearStart: 1994, yearEnd: 1996, engine: "1.4 Turbo", fuel: "GASOLINE" }] },
      { name: "Palio", versions: [{ name: "1.8 R", yearStart: 2004, yearEnd: 2010, engine: "1.8 8v", fuel: "FLEX" }] },
      { name: "Argo", versions: [{ name: "HGT", yearStart: 2017, engine: "1.8 16v", fuel: "FLEX" }] },
      { name: "Toro", versions: [{ name: "T270", yearStart: 2021, engine: "1.3 Turbo", fuel: "FLEX" }] },
      { name: "Pulse", versions: [{ name: "Abarth", yearStart: 2022, engine: "1.3 Turbo", fuel: "FLEX" }] },
    ],
  },
  {
    name: "Honda",
    models: [
      {
        name: "Civic",
        versions: [
          { name: "Si G10", yearStart: 2017, yearEnd: 2021, engine: "1.5 Turbo", fuel: "GASOLINE" },
          { name: "Type R FK8", yearStart: 2017, yearEnd: 2021, engine: "2.0 Turbo", fuel: "GASOLINE" },
          { name: "G9 2.0", yearStart: 2012, yearEnd: 2016, engine: "2.0 16v", fuel: "FLEX" },
        ],
      },
      { name: "City", versions: [{ name: "1.5", yearStart: 2015, engine: "1.5 16v", fuel: "FLEX" }] },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Corolla", versions: [{ name: "GR-S", yearStart: 2021, engine: "2.0 Dynamic Force", fuel: "FLEX" }] },
      { name: "Hilux", versions: [{ name: "SRX Diesel", yearStart: 2016, engine: "2.8 Turbodiesel", fuel: "DIESEL" }] },
      { name: "Supra", versions: [{ name: "Mk4", yearStart: 1993, yearEnd: 2002, engine: "2JZ-GTE", fuel: "GASOLINE" }] },
    ],
  },
  {
    name: "Ford",
    models: [
      { name: "Focus", versions: [{ name: "Duratec 2.0", yearStart: 2009, yearEnd: 2019, engine: "2.0 16v", fuel: "FLEX" }] },
      { name: "Fiesta", versions: [{ name: "ST/1.6", yearStart: 2011, yearEnd: 2019, engine: "1.6 16v", fuel: "FLEX" }] },
      { name: "Maverick", versions: [{ name: "V8 302", yearStart: 1973, yearEnd: 1979, engine: "5.0 V8", fuel: "GASOLINE" }] },
      { name: "Mustang", versions: [{ name: "GT S550", yearStart: 2018, engine: "5.0 V8", fuel: "GASOLINE" }] },
    ],
  },
  {
    name: "Hyundai",
    models: [
      { name: "HB20", versions: [{ name: "Sport/Turbo", yearStart: 2019, engine: "1.0 TGDI", fuel: "FLEX" }] },
      { name: "Creta", versions: [{ name: "1.0 Turbo", yearStart: 2022, engine: "1.0 TGDI", fuel: "FLEX" }] },
    ],
  },
  {
    name: "Renault",
    models: [
      { name: "Sandero", versions: [{ name: "RS 2.0", yearStart: 2015, yearEnd: 2022, engine: "2.0 16v", fuel: "FLEX" }] },
      { name: "Duster", versions: [{ name: "1.3 Turbo", yearStart: 2021, engine: "1.3 TCe", fuel: "FLEX" }] },
    ],
  },
  {
    name: "Subaru",
    models: [
      { name: "Impreza", versions: [{ name: "WRX", yearStart: 2008, yearEnd: 2014, engine: "2.5 Turbo", fuel: "GASOLINE" }] },
    ],
  },
  {
    name: "Mitsubishi",
    models: [
      { name: "Lancer", versions: [{ name: "Evolution X", yearStart: 2008, yearEnd: 2016, engine: "2.0 Turbo", fuel: "GASOLINE" }] },
    ],
  },
  {
    name: "Nissan",
    models: [
      { name: "370Z", versions: [{ name: "Coupé", yearStart: 2009, yearEnd: 2020, engine: "3.7 V6", fuel: "GASOLINE" }] },
    ],
  },
  {
    name: "BMW",
    models: [
      { name: "Série 3", versions: [{ name: "M3 E92", yearStart: 2007, yearEnd: 2013, engine: "4.0 V8", fuel: "GASOLINE" }] },
    ],
  },
];

export async function seedVehicles(prisma: PrismaClient) {
  let makes = 0;
  let models = 0;
  let versions = 0;

  for (const makeSpec of CATALOG) {
    const makeSlug = slugify(makeSpec.name);
    const make = await prisma.vehicleMake.upsert({
      where: { slug: makeSlug },
      update: { name: makeSpec.name, isActive: true },
      create: { name: makeSpec.name, slug: makeSlug },
    });
    makes++;

    for (const modelSpec of makeSpec.models) {
      const modelSlug = slugify(modelSpec.name);
      const model = await prisma.vehicleModel.upsert({
        where: { makeId_slug: { makeId: make.id, slug: modelSlug } },
        update: { name: modelSpec.name, isActive: true },
        create: { makeId: make.id, name: modelSpec.name, slug: modelSlug },
      });
      models++;

      for (const v of modelSpec.versions) {
        const existing = await prisma.vehicleVersion.findFirst({
          where: { modelId: model.id, name: v.name },
        });
        if (existing) {
          await prisma.vehicleVersion.update({
            where: { id: existing.id },
            data: {
              yearStart: v.yearStart,
              yearEnd: v.yearEnd ?? null,
              engine: v.engine ?? null,
              fuel: v.fuel ?? null,
              isActive: true,
            },
          });
        } else {
          await prisma.vehicleVersion.create({
            data: {
              modelId: model.id,
              name: v.name,
              yearStart: v.yearStart,
              yearEnd: v.yearEnd ?? null,
              engine: v.engine ?? null,
              fuel: v.fuel ?? null,
            },
          });
        }
        versions++;
      }
    }
  }

  return { makes, models, versions };
}
