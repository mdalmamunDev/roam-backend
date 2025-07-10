import TowType from "./tow type.model";

const towTypeData = [
  {
    name: 'Flatbed Tow Truck',
    baseFare: 500,
    perKM: 25,
    charge: 100
  },
  {
    name: 'Hook and Chain Tow Truck',
    baseFare: 450,
    perKM: 20,
    charge: 80
  },
  {
    name: 'Wheel-Lift Tow Truck',
    baseFare: 400,
    perKM: 18,
    charge: 75
  },
  {
    name: 'Integrated Tow Truck',
    baseFare: 600,
    perKM: 30,
    charge: 120
  }
];

const TowTypeSeeder = async () => {
  try {
    const existing = await TowType.find().lean();

    if (existing.length === 0) {
      await TowType.insertMany(towTypeData);
      console.log('Tow types seeded');
    } else {
      console.log('Tow types already exist');
    }
  } catch (error) {
    console.error('Error seeding TowTypes:', error);
  }
};

export default TowTypeSeeder;
