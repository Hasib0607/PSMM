import { PrismaClient, SpecialDayCategory, DateType } from "@prisma/client";

const prisma = new PrismaClient();

const specialDays = [
  {
    name: "International Mother Language Day",
    nameBn: "আন্তর্জাতিক মাতৃভাষা দিবস",
    category: SpecialDayCategory.bd_national,
    month: 2,
    day: 21,
    description: "Language Martyrs' Day and UNESCO International Mother Language Day",
  },
  {
    name: "Independence Day",
    nameBn: "স্বাধীনতা দিবস",
    category: SpecialDayCategory.bd_national,
    month: 3,
    day: 26,
    description: "Bangladesh Independence Day",
  },
  {
    name: "Pohela Boishakh",
    nameBn: "পহেলা বৈশাখ",
    category: SpecialDayCategory.bd_national,
    dateType: DateType.variable,
    month: 4,
    day: 14,
    description: "Bengali New Year",
  },
  {
    name: "Victory Day",
    nameBn: "বিজয় দিবস",
    category: SpecialDayCategory.bd_national,
    month: 12,
    day: 16,
    description: "Bangladesh Victory Day",
  },
  {
    name: "Mother's Day",
    nameBn: "মা দিবস",
    category: SpecialDayCategory.international,
    month: 5,
    day: 8,
    description: "International Mother's Day (approximate — varies by country)",
  },
  {
    name: "Valentine's Day",
    nameBn: "ভ্যালেন্টাইনস ডে",
    category: SpecialDayCategory.international,
    month: 2,
    day: 14,
    description: "Valentine's Day",
  },
  {
    name: "International Women's Day",
    nameBn: "আন্তর্জাতিক নারী দিবস",
    category: SpecialDayCategory.international,
    month: 3,
    day: 8,
    description: "International Women's Day",
  },
  {
    name: "New Year's Day",
    nameBn: "নববর্ষ",
    category: SpecialDayCategory.international,
    month: 1,
    day: 1,
    description: "Gregorian New Year",
  },
  {
    name: "Eid-ul-Fitr",
    nameBn: "ঈদুল ফিতর",
    category: SpecialDayCategory.religious,
    religion: "islam",
    dateType: DateType.lunar,
    dateRule: "1st Shawwal",
    description: "Islamic festival marking the end of Ramadan",
  },
  {
    name: "Eid-ul-Adha",
    nameBn: "ঈদুল আযহা",
    category: SpecialDayCategory.religious,
    religion: "islam",
    dateType: DateType.lunar,
    dateRule: "10th Dhul Hijjah",
    description: "Islamic festival of sacrifice",
  },
  {
    name: "Durga Puja",
    nameBn: "দুর্গা পূজা",
    category: SpecialDayCategory.religious,
    religion: "hindu",
    dateType: DateType.variable,
    description: "Major Hindu festival",
  },
  {
    name: "Christmas",
    nameBn: "বড়দিন",
    category: SpecialDayCategory.religious,
    religion: "christian",
    month: 12,
    day: 25,
    description: "Christmas Day",
  },
];

async function main() {
  for (const day of specialDays) {
    await prisma.specialDay.upsert({
      where: {
        id: `${day.category}-${day.name}`.toLowerCase().replace(/\s+/g, "-"),
      },
      update: {},
      create: {
        id: `${day.category}-${day.name}`.toLowerCase().replace(/\s+/g, "-"),
        name: day.name,
        nameBn: day.nameBn,
        category: day.category,
        religion: day.religion,
        dateType: day.dateType ?? DateType.fixed,
        month: day.month,
        day: day.day,
        dateRule: day.dateRule,
        description: day.description,
      },
    });
  }

  console.log(`Seeded ${specialDays.length} special days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
