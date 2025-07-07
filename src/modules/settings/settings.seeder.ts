import Setting from './settings.model';

const SettingSeeder = async () => {
  const settingsData = [
    {
      key: 'commission-rate',
      value: 0.00,
    },
    {
      key: 'transport-price',
      value: 10,
    },
    {
      key: 'transaction-transfer-hours',
      value: 24,
    },
    {
      key: 'privacy-policy',
      value: 'Hi this is privacy-policy',
    },
    {
      key: 'terms-conditions',
      value: 'This is terms data',
    },
    {
      key: 'about-us',
      value: 'this is about us',
    },
    {
      key: 'support',
      value: {
        details: 'details data is here..........',
        phone: '5246543254145',
        email: 'support@autorevive.com',
      },
    },
    {
      key: 'radius-limits',
      value: {
        min: 1,
        max: 100,
      },
    },
  ];

  // Create bulk operations: upsert each setting by key
  const bulkOps = settingsData.map(setting => ({
    updateOne: {
      filter: { key: setting.key },
      update: { $setOnInsert: setting }, // If a setting with the same key already exists, nothing is updated because $setOnInsert only applies on insert.
      upsert: true,
    }
  }));

  // Execute bulkWrite to insert if not exists
  await Setting.bulkWrite(bulkOps);

  console.log('Settings seeded (inserted if missing) successfully');
};


export default SettingSeeder;